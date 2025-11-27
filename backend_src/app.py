from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS
CORS(app, origins=[
    "http://localhost:3000",
    "https://*.vercel.app"
])

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)
limiter.init_app(app)

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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'service': 'Gatherly Backend (Flask)'
    })

@app.route('/api/chat', methods=['POST'])
@limiter.limit("50 per minute")
def chat():
    """OpenAI Chat endpoint for scheduling"""
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'messages' not in data:
            return jsonify({'error': 'Invalid messages format'}), 400
            
        messages = data['messages']
        
        if not isinstance(messages, list):
            return jsonify({'error': 'Messages must be an array'}), 400
            
        # Check for OpenAI API key
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            return jsonify({'error': 'OpenAI API key not configured'}), 500
            
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
            app.logger.error(f'OpenAI API error: {response.status_code} - {response.text}')
            return jsonify({'error': f'OpenAI API error: {response.status_code}'}), response.status_code
            
        # Parse OpenAI response
        openai_data = response.json()
        assistant_message = openai_data['choices'][0]['message']['content']
        
        try:
            # Parse and validate JSON response
            scheduling_response = json.loads(assistant_message)
            return jsonify(scheduling_response)
            
        except json.JSONDecodeError as e:
            app.logger.error(f'Failed to parse OpenAI response: {e}')
            return jsonify({
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
            })
            
    except requests.exceptions.Timeout:
        return jsonify({
            'error': 'Request timeout',
            'status': 'incomplete',
            'nextQuestion': 'The request timed out. Could you try again?'
        }), 504
        
    except Exception as e:
        app.logger.error(f'Server error: {str(e)}')
        return jsonify({
            'error': 'Internal server error',
            'status': 'incomplete',
            'nextQuestion': 'I had trouble processing your request. Could you tell me who you want to meet with?'
        }), 500

@app.errorhandler(404)
def not_found(error):
    """404 handler"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(429)
def rate_limit_handler(e):
    """Rate limit handler"""
    return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429

@app.errorhandler(500)
def internal_error(error):
    """500 handler"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    
    print(f"🚀 Gatherly Backend (Flask) running on port {port}")
    print(f"📡 Health check: http://localhost:{port}/health")
    print(f"🤖 Chat API: http://localhost:{port}/api/chat")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
