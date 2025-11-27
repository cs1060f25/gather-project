from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables from the parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

# Debug: Print environment variables
print("TWILIO_ACCOUNT_SID:", os.getenv('TWILIO_ACCOUNT_SID'))
print("TWILIO_AUTH_TOKEN present:", bool(os.getenv('TWILIO_AUTH_TOKEN')))
print("TWILIO_PHONE_NUMBER:", os.getenv('TWILIO_PHONE_NUMBER'))

# Initialize Flask and SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')

# Initialize SocketIO with CORS
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Twilio client and validator
client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
validator = RequestValidator(os.getenv('TWILIO_AUTH_TOKEN'))
TWILIO_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

# Store responses in memory (in production, use a database)
responses = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/send_question', methods=['POST'])
def send_question():
    data = request.json
    question = data.get('question')
    phone_number = data.get('phone_number')
    question_id = data.get('question_id')
    
    if not all([question, phone_number, question_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        message = client.messages.create(
            body=f"{question}\n\nPlease reply YES or NO.",
            from_=TWILIO_NUMBER,
            to=phone_number
        )
        
        # Initialize response tracking
        responses[message.sid] = {
            'question': question,
            'phone_number': phone_number,
            'status': 'sent',
            'response': None,
            'question_id': question_id
        }
        
        return jsonify({
            'status': 'success',
            'message_sid': message.sid
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Webhook endpoint for Twilio to send message status updates
@app.route('/message_status', methods=['POST'])
def message_status():
    message_sid = request.values.get('MessageSid', None)
    message_status = request.values.get('MessageStatus', None)
    
    if message_sid in responses:
        responses[message_sid]['status'] = message_status
        socketio.emit('status_update', {
            'message_sid': message_sid,
            'status': message_status
        })
    
    return ('', 200)

# Webhook endpoint for incoming messages
@app.route('/incoming_message', methods=['POST'], strict_slashes=False)
def incoming_message():
    # Get the X-Twilio-Signature header
    signature = request.headers.get('X-Twilio-Signature', '')
    
    # Get the full public URL Twilio used (reconstructed from forwarded headers)
    proto = request.headers.get('X-Forwarded-Proto', request.scheme)
    host = request.headers.get('Host', '').split(',')[0]
    url = f"{proto}://{host}{request.path}"
    qs = request.query_string.decode('utf-8')
    if qs:
        url = f"{url}?{qs}"
    params = request.form.to_dict()
    
    # Debug information
    print("\n=== Incoming Message ===")
    print("URL:", url)
    print("Full request URL:", request.url)
    print("Request method:", request.method)
    print("Form Data:", request.form)
    print("Headers:", dict(request.headers))
    print("Auth Token present:", bool(os.getenv('TWILIO_AUTH_TOKEN')))
    
    # Verify the request is from Twilio
    print("\n=== Validation Debug ===")
    print("URL being validated:", url)
    print("Signature received:", signature)
    print("Params being validated:", params)
    
    # Validate signature with reconstructed public URL
    validation_result = validator.validate(url, params, signature)
    
    if not validation_result:
        print("\n=== VALIDATION FAILED ===")
        print("Possible causes:")
        print("1. TWILIO_AUTH_TOKEN in .env doesn't match your Twilio account")
        print("2. The URL being validated doesn't match what Twilio used to sign the request")
        print("3. The request parameters don't match what was signed")
        print("4. The request is not actually from Twilio")
        print("\nDebug Info:")
        print("Request URL:", request.url)
        print("URL used for validation:", url)
        print("Signature:", signature)
        print("Params:", params)
        print("Request Headers:", dict(request.headers))
        return ('Invalid request', 403)
    
    from_number = request.form.get('From')
    body = request.form.get('Body', '').strip().upper()
    print(f"From: {from_number}, Body: {body}")
    
    # Find and update response
    for sid, data in responses.items():
        if data['phone_number'] == from_number and data['status'] in ['delivered', 'sent'] and data['response'] is None:
            if body in ['YES', 'NO']:
                data['response'] = body
                data['status'] = 'responded'
                socketio.emit('response_received', {
                    'message_sid': sid,
                    'response': body,
                    'phone_number': from_number,
                    'question': data['question']
                })
                print(f"Updated response for {sid}: {body}")
                break
    
    return ('', 200)

@socketio.on('connect')
def handle_connect():
    # Send current responses to newly connected client
    emit('initial_data', responses)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
