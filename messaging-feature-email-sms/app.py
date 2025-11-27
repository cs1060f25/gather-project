from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import os
import re
import smtplib
import imaplib
import email
import time
from email.message import EmailMessage

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*")

CARRIERS = {
    'verizon': '{number}@vtext.com',
    'att': '{number}@txt.att.net',
    'tmobile': '{number}@tmomail.net'
}

responses = {}

def normalize_number(num):
    return re.sub(r'\D', '', num or '')

def smtp_send(to_addr, body, subject):
    """Send an email using SMTP with enhanced error handling and debug logging."""
    try:
        host = os.getenv('SMTP_HOST')
        port = int(os.getenv('SMTP_PORT', '587'))
        user = os.getenv('SMTP_USERNAME')
        pwd = os.getenv('SMTP_PASSWORD')
        use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        debug = os.getenv('SMTP_DEBUG', 'false').lower() == 'true'
        
        print(f"SMTP: Attempting to send email to {to_addr}")
        print(f"SMTP: Server: {host}:{port}, User: {user}, TLS: {use_tls}")
        
        # Create the email message
        msg = EmailMessage()
        msg['From'] = user
        msg['To'] = to_addr
        msg['Subject'] = subject
        msg.set_content(body)
        
        # Connect to the SMTP server
        with smtplib.SMTP(host, port, timeout=30) as server:
            server.set_debuglevel(1 if debug else 0)
            
            # Identify ourselves to the server
            server.ehlo()
            
            # Start TLS encryption if needed
            if use_tls:
                print("SMTP: Starting TLS...")
                server.starttls()
                server.ehlo()  # Re-identify after TLS
            
            # Login if credentials are provided
            if user and pwd:
                print("SMTP: Logging in...")
                server.login(user, pwd)
            
            # Send the email
            print(f"SMTP: Sending message to {to_addr}")
            server.send_message(msg)
            print("SMTP: Message sent successfully!")
            return True
            
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: {e}")
        print("Please check your SMTP username and password.")
        print("For Gmail, you may need to use an App Password: https://support.google.com/accounts/answer/185833")
    except smtplib.SMTPException as e:
        print(f"SMTP Error: {e}")
    except Exception as e:
        print(f"Unexpected error sending email: {e}")
    
    return False

@app.route('/', methods=['GET'])
def index():
    # Serve the main dashboard page
    return render_template('index.html',
                         title='Email-to-SMS Dashboard',
                         socket_io_url='/'  # This ensures Socket.IO connects to the root path
    )

# Global dictionary to store message status and responses
responses = {}

@app.route('/send_sms', methods=['POST'])
def send_sms():
    print("\n=== Received send_sms request ===")
    print(f"Request data: {request.get_json()}")
    
    try:
        data = request.get_json(force=True)
        if not data:
            print("Error: No JSON data received")
            return jsonify({'error': 'No data provided'}), 400
            
        number = data.get('phone', '').strip()
        carrier = data.get('carrier', '').strip()
        message = data.get('message', '').strip()
        
        print(f"Processing SMS: number={number}, carrier={carrier}, message_length={len(message)}")
        
        # Validate inputs
        if not all([number, carrier, message]):
            error_msg = f"Missing required fields. Phone: {bool(number)}, Carrier: {bool(carrier)}, Message: {bool(message)}"
            print(f"Validation failed: {error_msg}")
            return jsonify({'error': error_msg}), 400
            
        # Normalize and validate phone number
        digits = normalize_number(number)
        print(f"Normalized phone number: {digits}")
        
        if not digits or len(digits) < 10:
            error_msg = f"Invalid phone number: {number} (normalized to {digits})"
            print(error_msg)
            return jsonify({'error': 'Please enter a valid 10-digit phone number'}), 400
            
        if carrier not in CARRIERS:
            error_msg = f"Invalid carrier: {carrier}. Must be one of: {', '.join(CARRIERS.keys())}"
            print(error_msg)
            return jsonify({'error': f'Invalid carrier. Please select from the list.'}), 400
            
        # Format the recipient email address
        to_addr = CARRIERS[carrier].format(number=digits)
        msg_id = f"{digits}-{int(time.time())}"
        subject = f"MSG {msg_id}"
        
        print(f"Sending SMS to {to_addr} with subject: {subject}")
        
        # Send the email
        if not smtp_send(to_addr, message, subject):
            error_msg = "Failed to send message. Check server logs for details."
            print(error_msg)
            return jsonify({'error': error_msg}), 500
        
        # Format the phone number for display
        phone_display = f"+1{digits[-10:]}"  # Format as +1XXXXXXXXXX
        
        # Store the message data
        message_data = {
            'id': msg_id,
            'phone_number': phone_display,
            'carrier': carrier,
            'question': message,
            'status': 'sent',
            'response': None,
            'timestamp': int(time.time())
        }
        responses[msg_id] = message_data
        
        print(f"Message sent successfully! Message ID: {msg_id}")
        print(f"Stored message data: {message_data}")
        
        # Emit the new message to all connected clients
        socketio.emit('new_message', message_data)
        print("Emitted new_message event to clients")
        
        return jsonify({
            'id': msg_id,
            'status': 'sent',
            'message': 'SMS sent successfully'
        })
        
    except Exception as e:
        print(f"Error sending SMS: {str(e)}")
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    emit('initial_data', responses)

def read_email_body(msg):
    if msg.is_multipart():
        parts = []
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype == 'text/plain' and not part.get('Content-Disposition'):
                try:
                    parts.append(part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='ignore'))
                except Exception:
                    continue
        return "\n".join(parts).strip()
    else:
        try:
            return msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='ignore').strip()
        except Exception:
            return ''

def imap_poll_loop():
    print("IMAP: Starting polling thread...")
    
    # Adjust this list as you discover which carrier gateways you're using
    CARRIER_DOMAINS = {
        'vtext.com',              # Verizon
        'txt.att.net',            # AT&T
        'tmomail.net',            # T-Mobile
        'messaging.sprintpcs.com',
        'vzwpix.com',
        'mms.att.net',
        'pm.sprint.com',
        'mypixmessages.com',
    }
    
    # Add a small delay to ensure the main thread starts first
    time.sleep(2)

    while True:
        try:
            host = os.getenv('IMAP_HOST')
            port = int(os.getenv('IMAP_PORT', '993'))
            user = os.getenv('IMAP_USERNAME')
            password = os.getenv('IMAP_PASSWORD')
            folder = os.getenv('IMAP_FOLDER', 'sms')
            poll_interval = int(os.getenv('IMAP_POLL_SECONDS', '10'))

            print(f"IMAP: Connecting to {host}:{port}...")
            with imaplib.IMAP4_SSL(host, port) as M:
                print("IMAP: Logging in...")
                M.login(user, password)
                print("IMAP: Login successful")

                print(f"IMAP: Selecting folder '{folder}'...")
                status, [count] = M.select(folder)
                if status != 'OK':
                    print(f"IMAP: Failed to select folder '{folder}': {status}")
                    print("IMAP: Waiting 30 seconds before reconnecting...")
                    time.sleep(30)
                    continue

                print(f"IMAP: Selected folder '{folder}', {count} messages")

                # On startup, mark any existing unread messages as read so we only
                # react to new ones that arrive after the app is running.
                print(f"IMAP: Marking existing unread messages in '{folder}' as read...")
                status, messages = M.search(None, 'UNSEEN')
                if status == 'OK' and messages[0]:
                    ids = messages[0].split()
                    print(f"IMAP: Found {len(ids)} existing unseen messages in '{folder}'")
                    try:
                        id_list = b','.join(ids)
                        M.store(id_list, '+FLAGS', '\\Seen')
                        print("IMAP: Finished marking existing messages as read")
                    except Exception as e:
                        print(f"IMAP: Error marking existing messages as read: {e}")
                else:
                    print(f"IMAP: No existing unread messages in '{folder}'")

                # Now start the polling loop for new messages
                while True:
                    try:
                        print("IMAP: Checking for new messages...")
                        status, messages = M.search(None, 'UNSEEN')

                        if status != 'OK':
                            print(f"IMAP: Error searching for messages: {status}")
                            break  # break inner loop, reconnect in outer loop

                        message_ids = messages[0].split()
                        if not message_ids:
                            # No new messages, just sleep
                            print(f"IMAP: No new messages, sleeping for {poll_interval} seconds...")
                            time.sleep(poll_interval)
                            continue

                        print(f"IMAP: Found {len(message_ids)} new message(s)")

                        for msg_id in message_ids:
                            msg_id_str = msg_id.decode('utf-8', errors='ignore')
                            print(f"IMAP: Fetching message {msg_id_str}...")

                            status, msg_data = M.fetch(msg_id, '(RFC822)')
                            if status != 'OK':
                                print(f"IMAP: Error fetching message {msg_id_str}: {status}")
                                # Mark it seen so we don't loop on it forever
                                M.store(msg_id, '+FLAGS', '\\Seen')
                                continue

                            # msg_data is a list of (bytes, bytes) tuples
                            for response_part in msg_data:
                                if not isinstance(response_part, tuple):
                                    continue

                                try:
                                    msg = email.message_from_bytes(response_part[1])
                                    from_email = (msg.get('from') or '').lower()
                                    subject = msg.get('subject') or ''
                                    body = ''

                                    print(f"IMAP: Processing email from {from_email}")

                                    # Only handle messages from carrier domains
                                    if not any(domain in from_email for domain in CARRIER_DOMAINS):
                                        print(f"IMAP: Skipping non-SMS email from {from_email}")
                                        # Mark as seen so it doesn't keep reappearing
                                        M.store(msg_id, '+FLAGS', '\\Seen')
                                        continue

                                    # Extract text body
                                    if msg.is_multipart():
                                        for part in msg.walk():
                                            content_type = part.get_content_type()
                                            content_disposition = str(
                                                part.get("Content-Disposition", "")
                                            ).lower()

                                            if "attachment" in content_disposition:
                                                continue

                                            if content_type in ('text/plain', 'text/html'):
                                                try:
                                                    body = part.get_payload(decode=True).decode(
                                                        'utf-8', errors='replace'
                                                    )
                                                    if body:
                                                        break
                                                except Exception as e:
                                                    print(f"IMAP: Error decoding part: {e}")
                                    else:
                                        try:
                                            body = msg.get_payload(decode=True).decode(
                                                'utf-8', errors='replace'
                                            )
                                        except Exception as e:
                                            print(f"IMAP: Error decoding message body: {e}")

                                    combined_text = f"{subject}\n{body}".strip()
                                    normalized = combined_text.lower()

                                    # Match this reply to one of our pending SMS requests
                                    # Assumes you have a global `responses` dict like:
                                    # responses[sid] = {"status": "sent", "carrier_email": "...", "room": "...", "to": "..."}
                                    for sid, data in list(responses.items()):
                                        if data.get('status') != 'sent':
                                            continue

                                        carrier_email = (data.get('carrier_email') or '').lower()
                                        if carrier_email and carrier_email not in from_email:
                                            continue  # not for this SID

                                        # We got a reply for this SID
                                        if 'yes' in normalized:
                                            user_answer = 'YES'
                                        elif 'no' in normalized:
                                            user_answer = 'NO'
                                        else:
                                            print(f"IMAP: Unrecognized reply text: {combined_text}")
                                            continue

                                        print(f"IMAP: Matched reply to SID {sid}: {user_answer}")
                                        responses[sid]['status'] = 'answered'
                                        responses[sid]['answer'] = user_answer

                                        room = data.get('room')
                                        if room:
                                            socketio.emit(
                                                'sms_response',
                                                {
                                                    'sid': sid,
                                                    'to': data.get('to'),
                                                    'answer': user_answer,
                                                },
                                                room=room,
                                            )
                                            print(
                                                f"IMAP: Emitted response for SID {sid} "
                                                f"to room {room}: {user_answer}"
                                            )

                                        # Once processed, mark this message as seen
                                        M.store(msg_id, '+FLAGS', '\\Seen')
                                        print(f"IMAP: Marked message {msg_id_str} as read")

                                except Exception as e:
                                    print(f"IMAP: Error processing message part: {e}")
                                    # Make sure we don't get stuck on this one
                                    M.store(msg_id, '+FLAGS', '\\Seen')
                                    continue

                        # After handling all new messages, sleep
                        print(f"IMAP: Sleeping for {poll_interval} seconds...")
                        time.sleep(poll_interval)

                    except (imaplib.IMAP4.abort, ConnectionResetError) as e:
                        print(f"IMAP: Connection lost: {e}")
                        break  # break inner loop, reconnect in outer loop
                    except Exception as e:
                        print(f"IMAP: Unexpected error in inner loop: {e}")
                        time.sleep(10)
                        continue

        except imaplib.IMAP4.error as e:
            print(f"IMAP: Login/connection error: {e}")
        except Exception as e:
            print(f"IMAP: Unexpected error in outer loop: {e}")

        print("IMAP: Waiting 30 seconds before reconnecting...")
        time.sleep(30)



def run_imap_polling():
    """Run the IMAP polling in a separate thread"""
    print("Starting IMAP polling thread...")
    imap_poll_loop()

if __name__ == '__main__':
    # Start the IMAP polling in a daemon thread
    import threading
    imap_thread = threading.Thread(target=run_imap_polling, daemon=True)
    imap_thread.start()
    
    print(f"Starting Flask-SocketIO server on port {os.getenv('APP_PORT', '5001')}...")
    
    # Run the Flask-SocketIO application
    socketio.run(
        app,
        host='0.0.0.0',
        port=int(os.getenv('APP_PORT', '5001')),
        debug=True,
        use_reloader=False,  # Disable reloader as it causes issues with threads
        allow_unsafe_werkzeug=True
    )
