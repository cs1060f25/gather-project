from http.server import BaseHTTPRequestHandler
import json
import os
import requests

# System prompt for scheduling
SYSTEM_PROMPT = """You are a scheduling assistant for Gatherly. Your job is to extract meeting details from user requests and ensure ALL required information is collected before showing a review card.

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
- Generate 3 time slots based on their preferences"""

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if not data or 'messages' not in data:
                self._send_error(400, {'error': 'Invalid messages format'})
                return
                
            messages = data['messages']
            
            if not isinstance(messages, list):
                self._send_error(400, {'error': 'Messages must be an array'})
                return
                
            # Check for OpenAI API key
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key:
                self._send_error(500, {'error': 'OpenAI API key not configured'})
                return
                
            # Prepare OpenAI request
            openai_messages = [
                {"role": "system", "content": SYSTEM_PROMPT}
            ] + messages
            
            # Call OpenAI API
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {openai_api_key}'
                },
                json={
                    'model': 'gpt-4',
                    'messages': openai_messages,
                    'temperature': 0.1,
                    'max_tokens': 1000
                },
                timeout=30
            )
            
            if not response.ok:
                self._send_error(response.status_code, {'error': f'OpenAI API error: {response.status_code}'})
                return
                
            # Parse OpenAI response
            openai_data = response.json()
            assistant_message = openai_data['choices'][0]['message']['content']
            
            try:
                # Parse and validate JSON response
                scheduling_response = json.loads(assistant_message)
                self._send_response(200, scheduling_response)
                
            except json.JSONDecodeError:
                fallback_response = {
                    'status': 'incomplete',
                    'extracted': {
                        'attendees': None,
                        'duration': None,
                        'method': None,
                        'location': None,
                        'timePreferences': None
                    },
                    'missing': ['attendees', 'duration', 'method', 'location', 'timePreferences'],
                    'nextQuestion': 'I had trouble understanding your request. Could you tell me who you want to meet with?',
                    'reviewCard': None
                }
                self._send_response(200, fallback_response)
                
        except Exception as e:
            error_response = {
                'error': 'Internal server error',
                'status': 'incomplete',
                'nextQuestion': 'I had trouble processing your request. Could you tell me who you want to meet with?'
            }
            self._send_error(500, error_response)
    
    def do_OPTIONS(self):
        self._send_cors_headers()
        self.end_headers()
    
    def _send_response(self, status_code, data):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_error(self, status_code, data):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
