#!/usr/bin/env python3
"""
Gatherly Proto2-Flask: Form-based Web Scheduler
A basic Flask app with HTML forms for scheduling.
This prototype shows that plain forms can't represent natural conversation.
"""

from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime

app = Flask(__name__)

# Store scheduled events (in-memory, resets on restart)
scheduled_events = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/schedule', methods=['GET', 'POST'])
def schedule():
    if request.method == 'POST':
        # Get form data
        person1 = request.form.get('person1', '').strip()
        person2 = request.form.get('person2', '').strip()
        date_str = request.form.get('date', '').strip()
        time_slot = request.form.get('time_slot', '').strip()
        location = request.form.get('location', '').strip()
        
        # Validate
        errors = []
        if not person1:
            errors.append('Person 1 name is required')
        if not person2:
            errors.append('Person 2 name is required')
        if not date_str:
            errors.append('Date is required')
        if not time_slot:
            errors.append('Time slot is required')
            
        if errors:
            return render_template('schedule.html', errors=errors)
        
        # Create event
        event = {
            'person1': person1,
            'person2': person2,
            'date': date_str,
            'time': time_slot,
            'location': location if location else 'TBD',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        scheduled_events.append(event)
        
        return redirect(url_for('confirmation', event_id=len(scheduled_events)-1))
    
    return render_template('schedule.html')

@app.route('/confirmation/<int:event_id>')
def confirmation(event_id):
    if event_id < 0 or event_id >= len(scheduled_events):
        return redirect(url_for('index'))
    
    event = scheduled_events[event_id]
    return render_template('confirmation.html', event=event)

@app.route('/events')
def events():
    return render_template('events.html', events=scheduled_events)

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  GATHERLY Proto2-Flask Starting...")
    print("  Open: http://localhost:5001")
    print("="*60 + "\n")
    app.run(debug=True, port=5001)

