const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// OpenAI Chat endpoint for scheduling
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // System prompt for scheduling
    const systemPrompt = `You are a scheduling assistant for Gatherly. Your job is to extract meeting details from user requests and ensure ALL required information is collected before showing a review card.

## Required Information for ANY Meeting:
1. **Attendees** - Who is attending (names, emails if provided)
2. **Duration** - How long the meeting should be (in minutes)
3. **Method** - How they'll meet (Video call, Phone call, In-person)
4. **Location** - Where they'll meet (if in-person) or platform (if virtual)
5. **Time Preferences** - When they want to meet (date/time constraints)

## Your Process:
1. **Extract** what you can from the user's message
2. **Identify** what's missing from the 5 required fields
3. **Ask** for missing information conversationally (one question at a time)
4. **Only** show review card when ALL 5 fields are complete

Always respond with a valid JSON object following this exact format:
{
  "status": "incomplete" | "complete",
  "extracted": {
    "attendees": ["name1", "name2"] | null,
    "duration": 30 | null,
    "method": "Video call" | "Phone call" | "In-person" | null,
    "location": "Downtown Cafe" | "Zoom" | "Google Meet" | null,
    "timePreferences": "Tomorrow afternoon" | "Monday 2pm" | null
  },
  "missing": ["attendees", "duration", "method", "location", "timePreferences"],
  "nextQuestion": "Who would you like to meet with?",
  "reviewCard": null | {
    "attendees": ["Sarah Johnson"],
    "duration": 60,
    "method": "In-person",
    "location": "Downtown Cafe",
    "constraints": "Tomorrow afternoon preferred",
    "proposedSlots": ["Tomorrow at 1:00 PM", "Tomorrow at 2:00 PM", "Tomorrow at 3:00 PM"]
  }
}

Rules:
- Always ask for ONE missing piece at a time
- Be conversational and friendly
- Make reasonable assumptions (lunch = 60min, coffee = 30min, meeting = 30min)
- For in-person meetings, always ask for location
- For virtual meetings, suggest platform if not specified
- Generate 3 time slots based on their preferences`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `OpenAI API error: ${response.status}` 
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    try {
      // Parse and validate JSON response
      const schedulingResponse = JSON.parse(assistantMessage);
      res.json(schedulingResponse);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      res.status(500).json({
        status: 'incomplete',
        extracted: {
          attendees: null,
          duration: null,
          method: null,
          location: null,
          timePreferences: null
        },
        missing: ['attendees', 'duration', 'method', 'location', 'timePreferences'],
        nextQuestion: 'I had trouble understanding your request. Could you tell me who you want to meet with?',
        reviewCard: null
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: 'incomplete',
      nextQuestion: 'I had trouble processing your request. Could you tell me who you want to meet with?'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Gatherly Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Chat API: http://localhost:${PORT}/api/chat`);
});
