from mail_to_sms import MailToSMS
import uuid
from datetime import datetime

SMTP_USER = os.getenv('SMTP_USERNAME')
SMTP_PASS = os.getenv('SMTP_PASSWORD')

# in-memory store for demo; in real life use a DB table
pending_questions = {}  # question_id -> dict

def send_yes_no_question(phone_number, carrier, question_text):
    question_id = str(uuid.uuid4())  # unique id for this question
    body = f"{question_text}\n\nReply YES or NO.\n"

    MailToSMS(
        phone_number,
        carrier,
        SMTP_USER,
        SMTP_PASS,
        body
    )

    pending_questions[question_id] = {
        "phone": phone_number,
        "carrier": carrier,
        "question": question_text,
        "status": "waiting",
        "answer": None,
        "sent_at": datetime.utcnow(),
    }

    return question_id

qid = send_yes_no_question("6263444909", "verizon",
                           "Are you available at 3pm tomorrow?")
print("Question id:", qid)
