import os
import datetime as dt

from flask import Flask, redirect, url_for, session, request, render_template_string, jsonify
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

app = Flask(__name__)
app.secret_key = "super-secret-key-change-me"  # use env var in real app

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # ONLY for local http dev

GOOGLE_CLIENT_SECRETS_FILE = "credentials.json"
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar",  # Required for freeBusy endpoint
    "https://www.googleapis.com/auth/calendar.readonly"  # For listing calendars
]
REDIRECT_URI = "http://127.0.0.1:5000/oauth2callback"


# Simple home page with a "Connect Google" button
@app.route("/")
def index():
    if "credentials" not in session:
        return '''
        <h1>Google Calendar Demo</h1>
        <p><a href="/authorize">🔑 Connect Google Calendar</a> to get started</p>
        '''
    else:
        return f"""
        <h1>Google Calendar Demo</h1>
        <p>✅ Google Calendar is connected</p>
        
        <h2>Calendar Actions</h2>
        <ul>
            <li><a href="/calendars">📅 View All Calendars</a></li>
            <li><a href="/my-week">📆 View My Week</a></li>
            <li><a href="/check-availability-form">⏱️ Check Availability</a> (across multiple calendars)</li>
            <li><a href="/create-test-event">➕ Create Test Event</a></li>
        </ul>
        
        <h2>Debug</h2>
        <ul>
            <li><a href="/clear">🔄 Clear Session</a> (use if you need to re-authenticate)</li>
        </ul>
        
        <style>
            body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
            h1 {{ color: #1a73e8; }}
            h2 {{ color: #5f6368; margin-top: 1.5em; }}
            ul {{ list-style: none; padding: 0; }}
            li {{ margin: 10px 0; }}
            a {{ 
                display: inline-block;
                padding: 10px 15px;
                background: #f1f3f4;
                border-radius: 4px;
                text-decoration: none;
                color: #202124;
                transition: background 0.2s;
            }}
            a:hover {{ 
                background: #e8eaed;
                text-decoration: none;
            }}
        </style>
        """


# Step 1: send user to Google for OAuth consent
@app.route("/authorize")
def authorize():
    flow = Flow.from_client_secrets_file(
        GOOGLE_CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",  # make sure we get refresh token at least once
    )

    session["state"] = state
    return redirect(authorization_url)


# Step 2: Google redirects back here
@app.route("/oauth2callback")
def oauth2callback():
    state = session.get("state")

    flow = Flow.from_client_secrets_file(
        GOOGLE_CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=state,
        redirect_uri=REDIRECT_URI,
    )

    flow.fetch_token(authorization_response=request.url)

    creds = flow.credentials
    # Store credentials in session (for demo). In production, store in DB.
    session["credentials"] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }

    return redirect(url_for("index"))


def get_calendar_service():
    if "credentials" not in session:
        return None

    creds_info = session["credentials"]
    creds = Credentials(**creds_info)

    # Automatically refresh token if needed & update session
    if creds.expired and creds.refresh_token:
        creds.refresh(requests.Request())
        session["credentials"] = {
            "token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": creds.scopes,
        }

    service = build("calendar", "v3", credentials=creds)
    return service


# Simple form to enter date/title/description
CREATE_FORM_HTML = """
<!doctype html>
<title>Create Event</title>
<h1>Create Google Calendar Event</h1>
<form method="POST">
  <label>Title:<br>
    <input type="text" name="title" required>
  </label><br><br>

  <label>Description:<br>
    <textarea name="description"></textarea>
  </label><br><br>

  <label>Start time (local):<br>
    <input type="datetime-local" name="start" required>
  </label><br><br>

  <label>End time (local):<br>
    <input type="datetime-local" name="end" required>
  </label><br><br>

  <button type="submit">Create Event</button>
</form>
"""
import datetime as dt
from zoneinfo import ZoneInfo  # Python 3.9+; if not, use pytz

@app.route("/create-test-event", methods=["GET", "POST"])
def create_test_event():
    service = get_calendar_service()
    if service is None:
        return redirect(url_for("authorize"))

    if request.method == "GET":
        return render_template_string(CREATE_FORM_HTML)

    # Parse form
    title = request.form["title"]
    description = request.form.get("description", "")

    start_str = request.form["start"]  # e.g. "2025-11-30T15:00"
    end_str = request.form["end"]

    # Your local timezone
    tz = ZoneInfo("America/New_York")  # change if you’re elsewhere

    try:
        # datetime-local → naive datetime
        start_naive = dt.datetime.fromisoformat(start_str)
        end_naive = dt.datetime.fromisoformat(end_str)

        # Attach timezone
        start_dt = start_naive.replace(tzinfo=tz)
        end_dt = end_naive.replace(tzinfo=tz)
    except ValueError as e:
        return f"Error parsing date/time: {e}", 400

    # Build RFC3339 strings with offset, e.g. "2025-11-30T15:00:00-05:00"
    start_rfc3339 = start_dt.isoformat()
    end_rfc3339 = end_dt.isoformat()

    event_body = {
        "summary": title,
        "description": description,
        "start": {
            "dateTime": start_rfc3339,
            "timeZone": "America/New_York",
        },
        "end": {
            "dateTime": end_rfc3339,
            "timeZone": "America/New_York",
        },
    }

    # Debug: see exactly what you're sending
    print("DEBUG event_body:", event_body)

    from googleapiclient.errors import HttpError

    try:
        event = service.events().insert(calendarId="primary", body=event_body).execute()
    except HttpError as e:
        print("HttpError status:", e.status_code)
        print("HttpError content:", e.content)
        return f"Google API error: {e}", 400

    return f'Event created: <a href="{event.get("htmlLink")}" target="_blank">View in Google Calendar</a>'

def get_free_and_busy_for_week(service, tz_str="America/New_York"):
    tz = ZoneInfo(tz_str)
    today = dt.date.today()
    monday = today - dt.timedelta(days=today.weekday())
    next_monday = monday + dt.timedelta(days=7)

    start_dt = dt.datetime.combine(monday, dt.time(0, 0), tzinfo=tz)
    end_dt = dt.datetime.combine(next_monday, dt.time(0, 0), tzinfo=tz)

    body = {
        "timeMin": start_dt.isoformat(),
        "timeMax": end_dt.isoformat(),
        "timeZone": tz_str,
        "items": [{"id": "primary"}],
    }

    freebusy = service.freebusy().query(body=body).execute()
    busy_blocks = freebusy["calendars"]["primary"]["busy"]

    free_slots = compute_free_slots(busy_blocks, start_dt, end_dt)

    return {
        "week_start": start_dt,
        "week_end": end_dt,
        "busy": busy_blocks,
        "free": free_slots,
    }


from flask import jsonify

@app.route("/my-week")
def my_week():
    service = get_calendar_service()
    if service is None:
        return redirect(url_for("authorize"))

    data = get_free_and_busy_for_week(service)
    # Convert datetimes to strings for JSON
    free_slots = [
        {"start": s.isoformat(), "end": e.isoformat()}
        for s, e in data["free"]
    ]

    # Calculate free slots from busy slots
    free_slots_list = compute_free_slots(
        busy_slots=data["busy"],
        start_time=data["week_start"],
        end_time=data["week_end"]
    )
    
    # Convert free slots to the same format as busy slots
    formatted_free_slots = [
        {"start": slot[0].isoformat(), "end": slot[1].isoformat()}
        for slot in free_slots_list
    ]
    
    return jsonify({
        "week_start": data["week_start"].isoformat(),
        "week_end": data["week_end"].isoformat(),
        "busy": data["busy"],
        "free": formatted_free_slots,
    })


@app.route('/clear')
def clear_credentials():
    session.clear()
    return 'Session cleared. <a href="/">Go back</a>'

def compute_free_slots(busy_slots, start_time, end_time):
    """
    Calculate free time slots between busy slots.
    
    Args:
        busy_slots: List of busy time slots as dicts with 'start' and 'end' datetime objects
        start_time: Start of the time range to check (timezone-aware datetime)
        end_time: End of the time range to check (timezone-aware datetime)
        
    Returns:
        List of free time slots as (start, end) datetime tuples
    """
    # Ensure all datetimes are timezone-aware
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=dt.timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=dt.timezone.utc)
    
    # Extract and sort busy periods
    busy_periods = [(slot['start'], slot['end']) for slot in busy_slots]
    busy_periods.sort()
    
    free_slots = []
    previous_end = start_time
    
    for busy_start, busy_end in busy_periods:
        # Ensure busy times are timezone-aware
        if busy_start.tzinfo is None:
            busy_start = busy_start.replace(tzinfo=dt.timezone.utc)
        if busy_end.tzinfo is None:
            busy_end = busy_end.replace(tzinfo=dt.timezone.utc)
            
        # If there's a gap between the previous end and current start, it's free time
        if previous_end < busy_start:
            free_slots.append((previous_end, busy_start))
            
        # Update previous_end to the end of the current busy period
        previous_end = max(previous_end, busy_end)
    
    # Add the free time after the last busy period
    if previous_end < end_time:
        free_slots.append((previous_end, end_time))
    
    return free_slots


def parse_datetime(dt_str):
    """Parse a datetime string from Google Calendar API to timezone-aware datetime"""
    # Remove the 'Z' and parse
    if dt_str.endswith('Z'):
        dt_obj = dt.datetime.fromisoformat(dt_str[:-1] + '+00:00')
    else:
        dt_obj = dt.datetime.fromisoformat(dt_str)
    # Ensure it's timezone-aware
    if dt_obj.tzinfo is None:
        dt_obj = dt_obj.replace(tzinfo=dt.timezone.utc)
    return dt_obj

def find_common_free_time(calendar_ids, start_time, end_time, service):
    """
    Find common free time across multiple calendars.
    
    Args:
        calendar_ids: List of calendar IDs to check
        start_time: Start of the time range to check (timezone-aware datetime)
        end_time: End of the time range to check (timezone-aware datetime)
        service: Google Calendar API service
        
    Returns:
        List of free time slots that are common across all calendars
    """
    # Ensure start_time and end_time are timezone-aware
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=dt.timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=dt.timezone.utc)
    
    all_busy_slots = []
    
    for calendar_id in calendar_ids:
        try:
            # Format time range for the API
            time_min = start_time.isoformat()
            time_max = end_time.isoformat()
            
            # Get free/busy information for this calendar
            body = {
                "timeMin": time_min,
                "timeMax": time_max,
                "items": [{"id": calendar_id}],
                "timeZone": "UTC"  # Request times in UTC for consistency
            }
            
            result = service.freebusy().query(body=body).execute()
            
            if 'calendars' in result and calendar_id in result['calendars']:
                busy = result['calendars'][calendar_id].get('busy', [])
                # Convert all datetimes to timezone-aware
                for slot in busy:
                    slot['start'] = parse_datetime(slot['start'])
                    slot['end'] = parse_datetime(slot['end'])
                all_busy_slots.extend(busy)
                
        except Exception as e:
            print(f"Error fetching busy slots for calendar {calendar_id}: {e}")
    
    # Sort all busy slots by start time
    all_busy_slots.sort(key=lambda x: x['start'])
    
    # Calculate free slots across all calendars
    return compute_free_slots(all_busy_slots, start_time, end_time)


@app.route('/check-availability-form', methods=['GET'])
def check_availability_form():
    """Show form to select calendars for availability check"""
    service = get_calendar_service()
    if service is None:
        return redirect(url_for("authorize"))
    
    try:
        # Get list of calendars
        calendars_result = service.calendarList().list().execute()
        calendars = calendars_result.get('items', [])
        
        if not calendars:
            return 'No calendars found.'
            
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Check Availability</title>
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
                h1 {{ color: #1a73e8; }}
                .calendar-list {{ margin: 20px 0; }}
                .calendar-item {{ 
                    padding: 10px; 
                    margin: 5px 0; 
                    background: #f8f9fa;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                }}
                .calendar-item input {{ margin-right: 10px; }}
                button {{ 
                    background: #1a73e8; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-size: 16px;
                }}
                button:hover {{ background: #1557b0; }}
                .back-link {{ 
                    display: inline-block; 
                    margin-top: 20px; 
                    color: #1a73e8; 
                    text-decoration: none;
                }}
            </style>
        </head>
        <body>
            <h1>Check Availability</h1>
            <p>Select the calendars to check for common free time:</p>
            
            <form action="/check-multiple-availability" method="post">
                <div class="calendar-list">
                    {''.join([
                        f'''<div class="calendar-item">
                            <input type="checkbox" id="cal_{i}" name="calendars" value="{cal['id']}">
                            <label for="cal_{i}">{cal.get('summary', 'Unnamed Calendar')}</label>
                        </div>'''
                        for i, cal in enumerate(calendars)
                    ])}
                </div>
                
                <div>
                    <label for="days">Check availability for next (days):</label>
                    <input type="number" id="days" name="days" min="1" max="30" value="7">
                </div>
                
                <button type="submit">Check Availability</button>
            </form>
            
            <a href="/" class="back-link">← Back to main menu</a>
        </body>
        </html>
        """
        
    except Exception as e:
        return f"An error occurred: {str(e)}"


@app.route('/check-multiple-availability', methods=['POST'])
def check_multiple_availability():
    """Show common free time across selected calendars"""
    if 'calendars' not in request.form:
        return 'No calendars selected', 400
        
    calendar_ids = request.form.getlist('calendars')
    days = int(request.form.get('days', 7))
    
    service = get_calendar_service()
    if service is None:
        return redirect(url_for("authorize"))
    
    try:
        # Set time range with timezone awareness
        now = dt.datetime.now(dt.timezone.utc)
        end_time = now + dt.timedelta(days=days)
        
        # Find common free time
        free_slots = find_common_free_time(calendar_ids, now, end_time, service)
        
        # Format the results
        result = [
            "<h1>Common Free Time</h1>",
            f"<p>Showing free time for the next {days} days across {len(calendar_ids)} selected calendars</p>"
        ]
        
        if free_slots:
            result.append("<h2>Available Time Slots:</h2><ul>")
            for slot in free_slots:
                start, end = slot
                # Ensure we're working with timezone-aware datetimes for display
                if start.tzinfo is None:
                    start = start.replace(tzinfo=dt.timezone.utc)
                if end.tzinfo is None:
                    end = end.replace(tzinfo=dt.timezone.utc)
                    
                duration = end - start
                if duration.total_seconds() >= 1800:  # Only show slots >= 30 minutes
                    # Convert to local time for display
                    local_tz = dt.datetime.now(dt.timezone.utc).astimezone().tzinfo
                    local_start = start.astimezone(local_tz)
                    local_end = end.astimezone(local_tz)
                    
                    result.append(
                        f"<li>{local_start.strftime('%A, %b %d, %I:%M %p')} to {local_end.strftime('%I:%M %p')} "
                        f"({int(duration.total_seconds()/60)} minutes)</li>"
                    )
            result.append("</ul>")
        else:
            result.append("<p>No common free time found in the selected period.</p>")
        
        # Add a link back to the form
        result.append('<p><a href="/check-availability-form">← Check different calendars</a></p>')
        
        return '\n'.join(result)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return f"""
        <h1>Error</h1>
        <p>An error occurred while processing your request:</p>
        <pre>{str(e)}</pre>
        <details>
            <summary>Click for details</summary>
            <pre>{error_details}</pre>
        </details>
        <p><a href="/check-availability-form">← Back to calendar selection</a></p>
        """


@app.route('/calendars')
def list_calendars():
    """List all calendars the user has access to"""
    service = get_calendar_service()
    if service is None:
        return redirect(url_for("authorize"))
    
    try:
        # Get list of calendars
        calendars_result = service.calendarList().list().execute()
        calendars = calendars_result.get('items', [])
        
        if not calendars:
            return 'No calendars found.'
            
        # Format the response as HTML
        result = ['<h1>Your Calendars</h1>']
        
        for calendar in calendars:
            result.append(f"<h2>{calendar['summary']}</h2>")
            result.append(f"<p>ID: {calendar['id']}</p>")
            result.append(f"<p>Description: {calendar.get('description', 'No description')}</p>")
            result.append(f"<p>Time Zone: {calendar.get('timeZone', 'Not specified')}</p>")
            result.append(f"<p>Access Role: {calendar.get('accessRole', 'No access role')}</p>")
            result.append('<hr>')
            
        # Add a link to check free/busy for each calendar
        result.append('<h2>Check Free/Busy</h2>')
        for calendar in calendars:
            result.append(f"<p><a href='/check-availability?calendar_id={calendar['id']}'>Check availability for {calendar['summary']}</a></p>")
            
        return '\n'.join(result)
        
    except Exception as e:
        return f"An error occurred: {str(e)}"


@app.route('/check-availability')
def check_availability():
    """Show free/busy information for a specific calendar"""
    calendar_id = request.args.get('calendar_id')
    if not calendar_id:
        return 'No calendar ID provided', 400
        
    service = get_calendar_service()
    if service is None:
        return redirect(url_for("authorize"))
    
    try:
        # Get the calendar's timezone
        calendar = service.calendars().get(calendarId=calendar_id).execute()
        timezone = calendar.get('timeZone', 'UTC')
        
        # Set time range (next 7 days)
        now = dt.datetime.utcnow()
        week_later = now + dt.timedelta(days=7)
        
        # Format for the API
        time_min = now.isoformat() + 'Z'  # 'Z' indicates UTC time
        time_max = week_later.isoformat() + 'Z'
        
        # Get free/busy information
        body = {
            "timeMin": time_min,
            "timeMax": time_max,
            "items": [{"id": calendar_id}]
        }
        
        events_result = service.freebusy().query(body=body).execute()
        
        # Format the response
        result = [
            f"<h1>Availability for {calendar['summary']}</h1>",
            f"<p>Time Zone: {timezone}</p>",
            f"<p>Checking from {now.strftime('%Y-%m-%d %H:%M')} to {week_later.strftime('%Y-%m-%d %H:%M')}</p>"
        ]
        
        # Show busy periods
        if 'calendars' in events_result and calendar_id in events_result['calendars']:
            busy = events_result['calendars'][calendar_id].get('busy', [])
            if busy:
                result.append("<h2>Busy Periods:</h2><ul>")
                for period in busy:
                    start = dt.datetime.fromisoformat(period['start'].replace('Z', '+00:00'))
                    end = dt.datetime.fromisoformat(period['end'].replace('Z', '+00:00'))
                    result.append(f"<li>{start.strftime('%Y-%m-%d %H:%M')} to {end.strftime('%H:%M')}</li>")
                result.append("</ul>")
            else:
                result.append("<p>No busy periods found in the next 7 days.</p>")
        
        # Add a link back to the calendar list
        result.append('<p><a href="/calendars">Back to calendar list</a></p>')
        
        return '\n'.join(result)
        
    except Exception as e:
        return f"An error occurred: {str(e)}"


if __name__ == "__main__":
    # Clear any existing credentials on startup
    if os.path.exists('token.json'):
        os.remove('token.json')
    app.run(debug=True)
