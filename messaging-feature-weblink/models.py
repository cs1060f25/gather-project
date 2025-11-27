from datetime import datetime
from extensions import db

class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    time_slots = db.relationship('TimeSlot', backref='event', lazy=True, cascade='all, delete-orphan')
    responses = db.relationship('Response', backref='event', lazy=True, cascade='all, delete-orphan')

class TimeSlot(db.Model):
    __tablename__ = 'time_slots'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    responses = db.relationship('Response', backref='time_slot', lazy=True, cascade='all, delete-orphan')

class Response(db.Model):
    __tablename__ = 'responses'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    time_slot_id = db.Column(db.Integer, db.ForeignKey('time_slots.id'), nullable=False)
    respondent_name = db.Column(db.String(100), nullable=False)
    is_available = db.Column(db.Boolean, default=False)
    responded_at = db.Column(db.DateTime, default=datetime.utcnow)
