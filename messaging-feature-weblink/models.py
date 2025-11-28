from datetime import datetime
from extensions import db
import uuid

class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    time1 = db.Column(db.String(255), nullable=False)
    time2 = db.Column(db.String(255), nullable=False)
    time3 = db.Column(db.String(255), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4().hex))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    responses = db.relationship('Response', backref='event', lazy=True)

class Response(db.Model):
    __tablename__ = "responses"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    responder_name = db.Column(db.String(255), nullable=False)
    available1 = db.Column(db.Boolean, default=False, nullable=False)
    available2 = db.Column(db.Boolean, default=False, nullable=False)
    available3 = db.Column(db.Boolean, default=False, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
