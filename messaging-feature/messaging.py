from twilio.rest import Client

# Twilio credentials (get from Twilio console)
ACCOUNT_SID = "ACe3d4bdb8a97babcf4853fab41e885b9f"
AUTH_TOKEN = "bee09ea9f9a530af9ec1377fae343682"

# Your Twilio phone number
TWILIO_NUMBER = "+18666554012"

client = Client(ACCOUNT_SID, AUTH_TOKEN)

def send_yes_no_question(question, phone_numbers, question_id):
    """
    question: str, e.g. "Are you coming to dinner tonight?"
    phone_numbers: list of phone numbers as E.164 strings, e.g. ["+15556667777", "+15558889999"]
    question_id: identifier you use to track this question, e.g. "dinner_2025_01_01"
    """
    for number in phone_numbers:
        body = f"{question}\n\nPlease reply YES or NO."
        message = client.messages.create(
            body=body,
            from_=TWILIO_NUMBER,
            to=number
        )
        print(f"Sent to {number}, SID={message.sid}")

if __name__ == "__main__":
    question = "Are you available for the 3pm meeting tomorrow?"
    phone_numbers = ["+18777804236"]
    question_id = "meeting_3pm_2025_01_02"
    send_yes_no_question(question, phone_numbers, question_id)
