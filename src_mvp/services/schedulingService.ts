// Scheduling Service - Handles OpenAI API calls for meeting extraction

interface SchedulingResponse {
  status: 'incomplete' | 'complete';
  extracted: {
    attendees: string[] | null;
    duration: number | null;
    method: string | null;
    location: string | null;
    timePreferences: string | null;
  };
  missing: string[];
  nextQuestion: string | null;
  reviewCard: {
    attendees: string[];
    duration: number;
    method: string;
    location?: string;
    constraints?: string;
    proposedSlots: string[];
  } | null;
}

const SYSTEM_PROMPT = `You are a scheduling assistant for Gatherly. Your job is to extract meeting details from user requests and ensure ALL required information is collected before showing a review card.

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

export class SchedulingService {
  private apiKey: string;
  private conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];

  constructor(apiKey?: string) {
    // Backend API URL
    this.apiKey = import.meta.env.VITE_API_BASE_URL || '';
  }

  async processSchedulingRequest(userMessage: string): Promise<SchedulingResponse> {
    // Add user message to conversation history
    this.conversationHistory.push({ role: 'user', content: userMessage });

    try {
      // Call our backend API instead of OpenAI directly
      const response = await fetch(`${this.apiKey}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: this.conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const schedulingResponse: SchedulingResponse = await response.json();
      
      // Add assistant response to history if we got a valid response
      if (schedulingResponse.status) {
        const responseText = schedulingResponse.nextQuestion || 
                           (schedulingResponse.reviewCard ? 'Review the meeting details above.' : 'Processing...');
        this.conversationHistory.push({ role: 'assistant', content: responseText });
      }
      
      return schedulingResponse;
    } catch (error) {
      console.error('Error processing scheduling request:', error);
      
      // Fallback response
      return {
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
      };
    }
  }

  // Reset conversation for new scheduling session
  resetConversation() {
    this.conversationHistory = [];
  }

  // Get conversation history (for debugging)
  getConversationHistory() {
    return this.conversationHistory;
  }
}

// Example usage:
// const scheduler = new SchedulingService(process.env.OPENAI_API_KEY);
// const response = await scheduler.processSchedulingRequest("Schedule lunch with Sarah tomorrow");
