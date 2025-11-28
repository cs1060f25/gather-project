# manage_db.py (in messaging-feature-weblink/)
from app import create_app, db
from models import Event, Response

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()
    print("DB reset")