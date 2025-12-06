from flask import render_template, request, jsonify, url_for, redirect
from datetime import datetime
import uuid

def init_routes(app, socketio, db):
    from models import Event, Response

    @app.route("/")
    def index():
        return render_template("create_event.html")

    @app.route("/event", methods=["POST"])
    def create_event():
        data = request.form
        
        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        time1 = (data.get("time1") or "").strip()
        time2 = (data.get("time2") or "").strip()
        time3 = (data.get("time3") or "").strip()

        if not all([title, time1, time2, time3]):
            return jsonify({"error": "Title and all time slots are required"}), 400

        try:
            # Generate a unique ID for the event
            event_id = str(uuid.uuid4())
            event = Event(
                id=event_id,
                title=title,
                description=description,
                time1=time1,
                time2=time2,
                time3=time3,
                token=str(uuid.uuid4().hex)  # Generate a new token for the event
            )
            db.session.add(event)
            db.session.commit()

            event_url = url_for("event_page", event_id=event_id, _external=True)
            return jsonify({
                "event_id": event.id,
                "url": event_url,
                "token": event.token
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route("/event/<string:event_id>")
    def event_page(event_id):
        event = Event.query.get_or_404(event_id)
        responses = Response.query.filter_by(event_id=event_id).all()
        
        # Prepare response data for the template
        response_data = []
        for resp in responses:
            response_data.append({
                "responder_name": resp.responder_name,
                "available1": resp.available1,
                "available2": resp.available2,
                "available3": resp.available3,
                "submitted_at": resp.submitted_at.strftime('%Y-%m-%d %H:%M')
            })
        
        return render_template("organizer_dashboard.html", 
                             event=event, 
                             responses=response_data,
                             time_slots=[event.time1, event.time2, event.time3])

    @app.route('/event/<string:event_id>/schedule', methods=['POST'])
    def schedule_event(event_id):
        event = Event.query.get_or_404(event_id)
        event.status = "Scheduled"
        db.session.commit()
        return jsonify({"status": "success", "message": "Event scheduled successfully"})

    @app.route("/event/<string:event_id>/response", methods=["GET", "POST"])
    def event_response_page(event_id):
        event = Event.query.get_or_404(event_id)
        
        if request.method == "GET":
            return render_template("respondent_form.html", 
                                 event=event, 
                                 time_slots=[event.time1, event.time2, event.time3])
        
        # Handle POST request (Form Submission)
        print(f"\n=== SUBMIT RESPONSE DEBUG ===")
        print(f"Event ID: {event_id}")
        print(f"Form data: {dict(request.form)}")
        
        name = (request.form.get("name") or "").strip()
        print(f"Name extracted: '{name}'")
        
        if not name:
            print("ERROR: Name is empty!")
            return jsonify({"error": "Name is required"}), 400
        
        try:
            available1 = request.form.get("available1") == "on"
            available2 = request.form.get("available2") == "on"
            available3 = request.form.get("available3") == "on"
            
            print(f"Availability: {available1}, {available2}, {available3}")
            
            response = Response(
                event_id=event_id,
                responder_name=name,
                available1=available1,
                available2=available2,
                available3=available3
            )
            
            print(f"Response object created: {response}")
            
            db.session.add(response)
            print("Added to session")
            
            db.session.commit()
            print("Committed to database")
            
            # Notify all connected clients about the new response
            socketio.emit('update_responses', {
                'event_id': event_id,
                'responder_name': name,
                'available1': response.available1,
                'available2': response.available2,
                'available3': response.available3,
                'submitted_at': response.submitted_at.strftime('%Y-%m-%d %H:%M')
            }, room=f'event_{event_id}')
            
            print("Socket.IO event emitted")
            print("=== SUCCESS ===\n")
            
            return jsonify({"status": "success", "message": "Response recorded successfully"})
            
        except Exception as e:
            print(f"ERROR: {str(e)}")
            print(f"Exception type: {type(e)}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route("/api/event/<string:event_id>/responses")
    def get_responses(event_id):
        responses = Response.query.filter_by(event_id=event_id).all()
        return jsonify([{
            'responder_name': r.responder_name,
            'available1': r.available1,
            'available2': r.available2,
            'available3': r.available3,
            'submitted_at': r.submitted_at.isoformat()
        } for r in responses])

    # ----------------- API: BATCH EVENTS FOR DASHBOARD -----------------
    @app.route("/api/events/batch", methods=["POST"])
    def get_events_batch():
        from models import Event  # local import

        json_data = request.get_json(silent=True) or {}
        raw_ids = json_data.get("event_ids") or []

        # Support both [{id: 1}, {id: 2}] and [1, 2]
        event_ids = []
        for item in raw_ids:
            if isinstance(item, dict) and "id" in item:
                event_ids.append(item["id"])
            else:
                event_ids.append(item)

        if not event_ids:
            return jsonify([])

        events = Event.query.filter(Event.id.in_(event_ids)).all()

        return jsonify([
            {
                "id": e.id,
                "title": e.title,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "response_count": len(e.responses),
                "status": getattr(e, "status", None) or "In Progress",
            }
            for e in events
        ])

    return app
