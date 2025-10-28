/**
 * Simple mock server for development/demo purposes
 * Handles the /api/goal-matching endpoint
 */

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Mock data
const mockMatches = {
  'investment-banking': [
    {
      name: 'Ava Patel',
      title: 'IB Analyst @ Goldman Sachs',
      whyHelpful: 'Recent alum with NYC internship insights and strong network in M&A',
    },
    {
      name: 'Ryan Chen',
      title: 'Summer Associate @ JPMorgan',
      whyHelpful: 'Knows 2026 recruiting process and can share interview prep tips',
    },
    {
      name: 'Sofia Rodriguez',
      title: 'VP, Investment Banking @ Morgan Stanley',
      whyHelpful: 'Leads internship recruiting and can provide direct insights into application process',
    }
  ],
  'tech': [
    {
      name: 'Marcus Johnson',
      title: 'Software Engineer @ Google',
      whyHelpful: 'Completed SWE internship program and can share coding interview strategies',
    },
    {
      name: 'Priya Sharma',
      title: 'Engineering Manager @ Meta',
      whyHelpful: 'Experienced in hiring interns and understands what companies look for',
    }
  ],
  'consulting': [
    {
      name: 'David Kim',
      title: 'Consultant @ McKinsey & Company',
      whyHelpful: 'Expert in case interview prep and recently mentored successful applicants',
    }
  ],
  'general': [
    {
      name: 'Alex Thompson',
      title: 'Career Coach & Mentor',
      whyHelpful: 'Generalist who can help refine your career goals and create action plan',
    }
  ]
}

app.post('/api/goal-matching', (req, res) => {
  const { goal, careerField } = req.body
  
  console.log('Received request:', { goal, careerField })
  
  // Simulate processing delay
  setTimeout(() => {
    let field = careerField || 'general'
    
    // Parse goal for career field if not provided
    if (!careerField) {
      const lowerGoal = goal.toLowerCase()
      if (lowerGoal.includes('investment banking') || lowerGoal.includes('finance')) {
        field = 'investment-banking'
      } else if (lowerGoal.includes('tech') || lowerGoal.includes('software')) {
        field = 'tech'
      } else if (lowerGoal.includes('consulting')) {
        field = 'consulting'
      }
    }
    
    const matches = mockMatches[field] || mockMatches['general']
    
    res.json({
      matches,
      reasoning: `Found ${matches.length} professionals who can help`,
      confidence: 0.85
    })
  }, 1500) // 1.5 second delay to simulate API call
})

app.listen(PORT, () => {
  console.log(`🚀 Mock API server running at http://localhost:${PORT}`)
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/goal-matching`)
})

