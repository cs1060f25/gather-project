import os
import json
import requests
from dotenv import load_dotenv
from pathlib import Path
from twilio.request_validator import RequestValidator

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

# Configuration
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
NGROK_URL = "http://your-ngrok-url.ngrok.io"  # Replace with your ngrok URL
WEBHOOK_URL = f"{NGROK_URL}/incoming_message"

def test_incoming_message():
    """Test the /incoming_message webhook with a simulated Twilio request"""
    # Test data - simulate a Twilio webhook request
    test_data = {
        'AccountSid': TWILIO_ACCOUNT_SID,
        'MessageSid': 'SM' + 'a' * 32,  # Simulated message SID
        'From': '+1234567890',  # Test phone number
        'To': TWILIO_PHONE_NUMBER,
        'Body': 'YES',  # Test response
        'NumMedia': '0'
    }
    
    # Create a RequestValidator instance
    validator = RequestValidator(TWILIO_AUTH_TOKEN)
    
    # Generate a valid signature for the test request
    signature = validator.compute_signature(WEBHOOK_URL, test_data)
    
    # Make the test request
    headers = {
        'X-Twilio-Signature': signature,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-Proto': 'https',
        'Host': 'your-ngrok-url.ngrok.io'  # Replace with your ngrok host
    }
    
    print(f"Sending test request to: {WEBHOOK_URL}")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    print(f"Signature: {signature}")
    
    try:
        response = requests.post(
            WEBHOOK_URL,
            data=test_data,
            headers=headers
        )
        
        print("\n=== Response ===")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 403:
            print("\n=== 403 Forbidden Error ===")
            print("This usually means the request signature validation failed.")
            print("Possible causes:")
            print("1. TWILIO_AUTH_TOKEN in .env doesn't match your Twilio account")
            print("2. The URL in the test script doesn't match your ngrok URL")
            print("3. The test data doesn't match what was signed")
            
    except Exception as e:
        print(f"\n=== Error ===")
        print(f"Request failed: {str(e)}")

def test_local_validation():
    """Test the signature validation locally without making HTTP requests"""
    print("\n=== Testing Local Signature Validation ===")
    
    # Test data - must match exactly what would be sent by Twilio
    test_url = f"{NGROK_URL}/incoming_message"
    test_params = {
        'AccountSid': TWILIO_ACCOUNT_SID,
        'MessageSid': 'SM' + 'a' * 32,
        'From': '+1234567890',
        'To': TWILIO_PHONE_NUMBER,
        'Body': 'YES',
        'NumMedia': '0'
    }
    
    # Generate a signature
    validator = RequestValidator(TWILIO_AUTH_TOKEN)
    signature = validator.compute_signature(test_url, test_params)
    
    print(f"Test URL: {test_url}")
    print(f"Test params: {json.dumps(test_params, indent=2)}")
    print(f"Generated signature: {signature}")
    
    # Validate the signature
    is_valid = validator.validate(test_url, test_params, signature)
    print(f"\nSignature validation result: {'SUCCESS' if is_valid else 'FAILED'}")
    
    if not is_valid:
        print("\nTroubleshooting steps:")
        print("1. Verify TWILIO_AUTH_TOKEN in .env matches your Twilio account")
        print("2. Ensure the URL and parameters match exactly")
        print("3. Check for any URL encoding/decoding issues")

if __name__ == "__main__":
    print("=== Twilio Webhook Tester ===\n")
    
    # Check if required environment variables are set
    if not all([TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_PHONE_NUMBER]):
        print("Error: Missing required environment variables in .env file")
        print("Please ensure the following are set:")
        print("- TWILIO_ACCOUNT_SID")
        print("- TWILIO_AUTH_TOKEN")
        print("- TWILIO_PHONE_NUMBER")
        exit(1)
    
    # Run the local validation test first
    test_local_validation()
    
    # Uncomment to run the full HTTP test (requires ngrok)
    # test_incoming_message()
    
    print("\n=== Test Complete ===")
    print("If you're still having issues:")
    print("1. Make sure your ngrok URL is correct and accessible")
    print("2. Check the Flask server logs for detailed error messages")
    print("3. Verify your Twilio webhook URL is set correctly in the Twilio console")
    print("4. Ensure your ngrok URL is using HTTPS (not HTTP) in the Twilio console")
