import resend

resend.api_key = "re_W9scSHKT_C9Tea3j9GPNxD9RsYFfje7fc"

r = resend.Emails.send({
  "from": "onboarding@resend.dev",
  "to": "ikscout15@gmail.com",
  "subject": "Hello World",
  "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
})


print("Email sent successfully!")