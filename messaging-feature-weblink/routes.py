from flask import render_template, request, jsonify, url_for
from datetime import datetime
import uuid

def init_routes(app, socketio, db):
    # Import models here to avoid circular imports
    from models import Event, TimeSlot, Response

    @app.route('/')
    def index():
        return render_template('create_event.html')
    
    @app.route('/event', methods=['POST'])
    def create_event():
        data = request.form
        
        # Create new event
        event_id = str(uuid.uuid4())
        event = Event(
            id=event_id,
            title=data['title'],
            description=data.get('description', '')
        )
        
        # Add time slots
        for i in range(1, 4):
            start_time = datetime.fromisoformat(data[f'time_slot_{i}_start'])
            end_time = datetime.fromisoformat(data[f'time_slot_{i}_end'])
            time_slot = TimeSlot(
                event_id=event_id,
                start_time=start_time,
                end_time=end_time
            )
            event.time_slots.append(time_slot)
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'event_id': event_id,
            'url': url_for('view_event', event_id=event_id, _external=True)
        })
    
    @app.route('/event/<event_id>')
    def view_event(event_id):
        event = Event.query.get_or_404(event_id)
        return render_template('event.html', event=event)
    
    @app.route('/event/<event_id>/response', methods=['POST'])
    def submit_response(event_id):
        data = request.form
        
        # Save responses for each time slot
        for time_slot_id, is_available in data.items():
            if time_slot_id == 'name':
                continue
            response = Response(
                event_id=event_id,
                time_slot_id=time_slot_id,
                respondent_name=data.get('name'),
                is_available=is_available == 'true'
            )
            db.session.add(response)
        
        db.session.commit()
        
        # Notify all clients about the new response
        socketio.emit('new_response', {'event_id': event_id}, namespace='/')
        
        return jsonify({'status': 'success'})
    
    @app.route('/api/event/<event_id>/responses')
    def get_responses(event_id):
        responses = Response.query.filter_by(event_id=event_id).all()
        return jsonify([{
            'time_slot_id': r.time_slot_id,
            'respondent_name': r.respondent_name,
            'is_available': r.is_available
        } for r in responses])

    @app.route('/api/events/batch', methods=['POST'])
    def get_events_batch():
        data = request.get_json()
        event_ids = data.get('event_ids', [])
        
        if not event_ids:
            return jsonify([])
            
        events = Event.query.filter(Event.id.in_(event_ids)).all()
        
        return jsonify([{
            'id': e.id,
            'title': e.title,
            'created_at': e.created_at.isoformat(),
            'response_count': len(e.responses),
            'status': 'In Progress'
        } for e in events])

    return app
