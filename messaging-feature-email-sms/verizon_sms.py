import smtplib
import imaplib
import email
import time

# ---------- CONFIGURE THESE ----------
GMAIL_USER = "ikscout15@gmail.com"
GMAIL_APP_PASSWORD = "dlzayviowmigjfbj"   # 16-char app password, no spaces
VERIZON_PHONE = "6263444909"              # digits only, no +1
QUESTION_TEXT = "Are you available at 3pm tomorrow? "
WAIT_SECONDS = 60                        # how long to wait for reply (total)
POLL_INTERVAL = 10                        # seconds between checks
# -------------------------------------


def send_sms_via_email(question: str) -> None:
    """Send an SMS to a Verizon number via vtext.com."""
    to_addr = f"{VERIZON_PHONE}@vtext.com"
    subject = "Question"

    msg = (
        f"From: {GMAIL_USER}\r\n"
        f"To: {to_addr}\r\n"
        f"Subject: {subject}\r\n\r\n"
        f"{question}"
    )

    print(f"Sending SMS to {to_addr}...")
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, [to_addr], msg.encode("utf-8"))
    print("SMS sent.")


def wait_for_reply() -> str | None:
    """
    Poll Gmail INBOX for a reply from the Verizon gateway.
    Returns the reply text, or None if nothing came in time.
    """
    # Possible from-addresses for Verizon
    expected_fragments = [
        f"{VERIZON_PHONE}@vtext.com",
        f"{VERIZON_PHONE}@vzwpix.com",
    ]

    deadline = time.time() + WAIT_SECONDS
    print(f"Waiting up to {WAIT_SECONDS} seconds for a reply...")

    while time.time() < deadline:
        try:
            with imaplib.IMAP4_SSL("imap.gmail.com", 993) as M:
                M.login(GMAIL_USER, GMAIL_APP_PASSWORD)
                M.select("INBOX")

                # SIMPLE: just get all unseen messages
                status, data = M.search(None, "UNSEEN")
                if status != "OK":
                    print("IMAP search error:", status)
                    time.sleep(POLL_INTERVAL)
                    continue

                ids = data[0].split()
                if not ids:
                    print("No new messages yet, sleeping...")
                    time.sleep(POLL_INTERVAL)
                    continue

                print(f"Found {len(ids)} unseen message(s).")

                for msg_id in ids:
                    status, msg_data = M.fetch(msg_id, "(RFC822)")
                    if status != "OK":
                        print("Error fetching message:", status)
                        continue

                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)

                    from_raw = msg.get("From", "")
                    from_lower = from_raw.lower()
                    print("Saw email from:", from_raw)

                    # Only treat as reply if From matches expected Verizon gateways
                    if not any(fragment in from_lower for fragment in expected_fragments):
                        print("Not from expected Verizon address, marking seen and skipping.")
                        M.store(msg_id, "+FLAGS", "\\Seen")
                        continue

                    # Get body text
                    if msg.is_multipart():
                        body = ""
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode(
                                    "utf-8", errors="replace"
                                )
                                break
                    else:
                        body = msg.get_payload(decode=True).decode(
                            "utf-8", errors="replace"
                        )

                    body = body.strip()
                    print("Got reply body:\n", body)

                    # Mark as seen so we don't process again
                    M.store(msg_id, "+FLAGS", "\\Seen")

                    return body  # return first valid reply we see

        except Exception as e:
            print("Error while checking for reply:", e)
            time.sleep(POLL_INTERVAL)

    print("Timed out waiting for a reply.")
    return None


if __name__ == "__main__":
    send_sms_via_email(QUESTION_TEXT)
    reply = wait_for_reply()
    if reply is None:
        print("No reply received.")
    else:
        print("Final recorded reply:", repr(reply))
