import os
import datetime as dt
import json
import openai
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from flask import Flask, redirect, url_for, session, request, render_template_string, render_template, jsonify
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load LLM configuration from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
else:
    print("Warning: OPENAI_API_KEY not found in environment variables. LLM features will be disabled.")

# LLM configuration
LLM_MODEL = "gpt-4"  # or "gpt-3.5-turbo" for faster/cheaper results

# IMPORTANT: LLM is disabled by default to avoid quota errors.
# To enable it explicitly, set environment variable ENABLE_LLM=true
_ENABLE_LLM_ENV = os.getenv('ENABLE_LLM', 'true').lower() == 'true'
ENABLE_LLM = bool(OPENAI_API_KEY) and _ENABLE_LLM_ENV

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
            <!DOCTYPE html>
            <html>
            <head>
                <title>Google Calendar Availability Checker</title>
                <link href='https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap' rel='stylesheet'>
                <style>
                    body {
                        font-family: 'Google Sans', Roboto, Arial, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2rem;
                        line-height: 1.6;
                        color: #202124;
                    }
                    h1 {
                        color: #1a73e8;
                        margin-bottom: 1.5rem;
                    }
                    .btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0.75rem 1.5rem;
                        background-color: #1a73e8;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 1rem;
                        font-weight: 500;
                        text-decoration: none;
                        cursor: pointer;
                        transition: background-color 0.2s, box-shadow 0.2s;
                        margin-top: 1rem;
                    }
                    .btn:hover {
                        background-color: #1557b0;
                        box-shadow: 0 1px 2px 0 rgba(26, 115, 232, 0.3), 0 2px 6px 2px rgba(26, 115, 232, 0.15);
                    }
                </style>
            </head>
            <body>
                <h1>Google Calendar Availability Checker</h1>
                <p>Connect your Google Calendar to check your availability and find the best meeting times.</p>
                <a href="/authorize" class="btn">Connect Google Calendar</a>
            </body>
            </html>
        '''
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google Calendar Availability Checker</title>
            <link href='https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap' rel='stylesheet'>
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Round">
            <style>
                body {
                    font-family: 'Google Sans', Roboto, Arial, sans-serif;
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 2rem;
                    line-height: 1.6;
                    color: #202124;
                    background-color: #f8f9fa;
                }
                h1 {
                    color: #1a73e8;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-top: 2rem;
                }
                .feature-card {
                    background: white;
                    border: 1px solid #dadce0;
                    border-radius: 8px;
                    padding: 1.5rem;
                    transition: box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .feature-card:hover {
                    box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
                }
                .feature-card h3 {
                    margin: 0 0 0.75rem 0;
                    color: #1a73e8;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .feature-card p {
                    color: #5f6368;
                    margin: 0 0 1.5rem 0;
                    flex-grow: 1;
                }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.625rem 1.25rem;
                    background-color: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    text-decoration: none;
                    cursor: pointer;
                    transition: background-color 0.2s, box-shadow 0.2s;
                    width: 100%;
                    box-sizing: border-box;
                    text-align: center;
                }
                .btn:hover {
                    background-color: #1557b0;
                    box-shadow: 0 1px 2px 0 rgba(26, 115, 232, 0.3), 0 2px 6px 2px rgba(26, 115, 232, 0.15);
                }
                .btn .material-icons-round {
                    margin-right: 0.5rem;
                    font-size: 1.25rem;
                }
                .header-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 1.5rem;
                }
                .btn-outline {
                    background: transparent;
                    color: #1a73e8;
                    border: 1px solid #dadce0;
                }
                .btn-outline:hover {
                    background: #f1f3f4;
                    border-color: #1a73e8;
                }
            </style>
        </head>
        <body>
            <div class="header-actions">
                <a href="/clear" class="btn btn-outline">
                    <span class="material-icons-round">logout</span>
                    Sign Out
                </a>
            </div>
            
            <h1>
                <span class="material-icons-round" style="color: #1a73e8;">event_available</span>
                Welcome to Calendar Availability
            </h1>
            
            <p>Select an option below to get started:</p>
            
            <div class="features">
                <div class="feature-card">
                    <h3><span class="material-icons-round">search</span> Find Available Times</h3>
                    <p>Let us suggest the best meeting times based on your calendar availability and preferences.</p>
                    <a href="/suggest-times" class="btn">
                        <span class="material-icons-round">schedule</span>
                        Find Times
                    </a>
                </div>
                
                <div class="feature-card">
                    <h3><span class="material-icons-round">calendar_view_week</span> Check Multiple Calendars</h3>
                    <p>View and compare availability across multiple calendars in a visual calendar interface.</p>
                    <a href="/check-availability-form" class="btn">
                        <span class="material-icons-round">compare_arrows</span>
                        Compare Calendars
                    </a>
                </div>
                
                <div class="feature-card">
                    <h3><span class="material-icons-round">list_alt</span> View All Calendars</h3>
                    <p>See a list of all your Google Calendars and manage your calendar subscriptions.</p>
                    <a href="/calendars" class="btn">
                        <span class="material-icons-round">view_list</span>
                        View Calendars
                    </a>
                </div>
            </div>
        </body>
        </html>
    ''')


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
        # Pre-fill form if query params are present
        pre_title = request.args.get("title", "")
        pre_start = request.args.get("start", "")
        pre_end = request.args.get("end", "")
        
        # Simple string replacement to pre-fill values (since it's a string template)
        form_html = CREATE_FORM_HTML
        if pre_title:
            form_html = form_html.replace('name="title" required', f'name="title" value="{pre_title}" required')
        if pre_start:
            form_html = form_html.replace('name="start" required', f'name="start" value="{pre_start}" required')
        if pre_end:
            form_html = form_html.replace('name="end" required', f'name="end" value="{pre_end}" required')
            
        return render_template_string(form_html)

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

def ensure_timezone_aware(dt_obj):
    """Ensure a datetime object is timezone-aware, defaulting to UTC if not."""
    if dt_obj is None:
        return None
    if dt_obj.tzinfo is None:
        return dt_obj.replace(tzinfo=dt.timezone.utc)
    return dt_obj

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
    start_time = ensure_timezone_aware(start_time)
    end_time = ensure_timezone_aware(end_time)
    
    # Extract and sort busy periods, ensuring all datetimes are timezone-aware
    busy_periods = []
    for slot in busy_slots:
        busy_start = ensure_timezone_aware(slot.get('start'))
        busy_end = ensure_timezone_aware(slot.get('end'))
        if busy_start and busy_end:  # Only add if both start and end are valid
            busy_periods.append((busy_start, busy_end))
    
    # Sort busy periods by start time
    busy_periods.sort()
    
    free_slots = []
    previous_end = start_time
    
    for busy_start, busy_end in busy_periods:
        # Ensure busy times are timezone-aware (should be already, but just in case)
        busy_start = ensure_timezone_aware(busy_start)
        busy_end = ensure_timezone_aware(busy_end)
        
        # Skip invalid busy periods
        if busy_start is None or busy_end is None:
            continue
            
        # If there's a gap between the previous end and current start, it's free time
        if previous_end < busy_start:
            free_slots.append((previous_end, busy_start))
            
        # Update previous_end to the end of the current busy period
        if busy_end > previous_end:
            previous_end = busy_end
    
    # Add the free time after the last busy period
    if previous_end < end_time:
        free_slots.append((previous_end, end_time))
    
    return free_slots


def parse_datetime(dt_str):
    """Parse a datetime string from Google Calendar API to timezone-aware datetime"""
    try:
        # Handle 'Z' timezone (UTC)
        if dt_str.endswith('Z'):
            dt_obj = dt.datetime.fromisoformat(dt_str[:-1] + '+00:00')
        # Handle datetime with timezone offset (e.g., '+00:00')
        elif '+' in dt_str or dt_str.count('-') > 2:
            dt_obj = dt.datetime.fromisoformat(dt_str)
        # Handle naive datetime (no timezone)
        else:
            dt_obj = dt.datetime.fromisoformat(dt_str)
            # Assume UTC if no timezone is provided
            dt_obj = dt_obj.replace(tzinfo=dt.timezone.utc)
        
        # Ensure it's timezone-aware
        if dt_obj.tzinfo is None:
            dt_obj = dt_obj.replace(tzinfo=dt.timezone.utc)
            
        return dt_obj
    except ValueError as e:
        # Fallback to dateutil's parser if isoformat fails
        try:
            from dateutil import parser
            dt_obj = parser.isoparse(dt_str)
            if dt_obj.tzinfo is None:
                dt_obj = dt_obj.replace(tzinfo=dt.timezone.utc)
            return dt_obj
        except:
            raise ValueError(f"Could not parse datetime string: {dt_str}") from e

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


def suggest_optimal_times(
    free_slots: list,
    duration_minutes: int,
    event_title: str = "meeting",
    num_suggestions: int = 3
) -> list:
    """
    Use LLM to suggest optimal meeting times from free slots.
    
    Args:
        free_slots: List of free time slots
        duration_minutes: Duration of the meeting in minutes
        event_title: Title/type of the event
        num_suggestions: Number of time suggestions to return
        
    Returns:
        Dict containing:
        - suggestions: List of suggested times with explanations
        - status: 'success' or 'error'
        - message: Additional status information
    """
    def create_fallback_suggestions(slots, message):
        """Create fallback suggestions with the given message"""
        return {
            'suggestions': [
                {
                    'time': f"{slot['start'].strftime('%A, %b %d at %I:%M %p')} - {slot['end'].strftime('%I:%M %p')}",
                    'explanation': f'Available time slot ({message})'
                }
                for slot in sorted(slots, key=lambda x: x['start'])[:num_suggestions]
            ],
            'status': 'success' if not message else 'warning',
            'message': message or 'Using fallback time suggestions'
        }
    
    # Input validation
    if not free_slots:
        return {
            'suggestions': [{'time': 'No available slots', 'explanation': 'No free time slots found.'}],
            'status': 'error',
            'message': 'No free time slots available in the selected range'
        }
    
    # Check if LLM is enabled
    if not ENABLE_LLM:
        print("LLM not enabled, using fallback time suggestions")
        return {
            **create_fallback_suggestions(free_slots, 'LLM not enabled'),
            'llm_enabled': False
        }
    
    # Format the free slots for the LLM
    formatted_slots = []
    for slot in free_slots:
        try:
            start = slot['start']
            end = slot['end']
            duration = (end - start).total_seconds() / 60  # in minutes
            
            if duration >= duration_minutes:
                formatted_slots.append({
                    'start': start.strftime('%A, %B %d at %I:%M %p'),
                    'end': end.strftime('%I:%M %p'),
                    'duration_minutes': duration,
                    'original_start': start,
                    'original_end': end
                })
        except Exception as e:
            print(f"Error formatting slot: {e}")
            continue
    
    if not formatted_slots:
        return {
            'suggestions': [{'time': 'No suitable slots', 'explanation': 'No time slots long enough for the meeting.'}],
            'status': 'error',
            'message': 'No time slots meet the duration requirement',
            'llm_enabled': True
        }
    
    try:
        # Prepare the prompt for the LLM
        prompt = f"""You are an AI assistant that helps schedule meetings. Given the following available time slots, 
suggest the {min(num_suggestions, 5)} best times for a {duration_minutes}-minute {event_title}. 
Consider typical work hours, time of day, and day of week preferences.

Available time slots:
{json.dumps(formatted_slots, indent=2, default=str)}

Respond with a JSON array of objects, each with 'time' and 'explanation' keys.
Example:
[
    {{
        "time": "Monday, Jan 1 at 2:00 PM - 2:30 PM",
        "explanation": "Early afternoon is often a productive time for meetings."
    }}
]"""
        
        print("Sending request to LLM...")
        start_time = datetime.now()
        
        # Call the LLM with timeout
        response = openai.ChatCompletion.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant that helps schedule meetings. Respond with a JSON array of suggested times."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500,
            request_timeout=15  # 15 second timeout
        )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        print(f"Received LLM response in {processing_time:.2f} seconds")
        
        if not response.choices or not response.choices[0].message.content:
            raise ValueError("Empty response from LLM")
            
        content = response.choices[0].message.content
        print(f"LLM Response (first 200 chars): {content[:200]}...")
        
        # Try to parse the JSON response
        try:
            # Clean the response to extract JSON
            content = content.strip()
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].strip()
            
            # Parse the JSON
            suggestions = json.loads(content)
            
            # Validate the response format
            if not isinstance(suggestions, list):
                suggestions = [suggestions]  # Handle single object response
                
            valid_suggestions = []
            for s in suggestions:
                if isinstance(s, dict) and 'time' in s and 'explanation' in s:
                    valid_suggestions.append({
                        'time': str(s['time']),
                        'explanation': str(s['explanation'])
                    })
                if len(valid_suggestions) >= num_suggestions:
                    break
            
            if not valid_suggestions:
                raise ValueError("No valid suggestions in response")
                
            return {
                'suggestions': valid_suggestions[:num_suggestions],
                'status': 'success',
                'message': f'Found {len(valid_suggestions)} suggestions',
                'llm_enabled': True,
                'processing_time': processing_time
            }
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error parsing LLM response: {e}")
            print(f"Raw response (first 500 chars): {content[:500]}")
            return {
                **create_fallback_suggestions(free_slots, 'Error parsing LLM response'),
                'llm_enabled': True,
                'error': str(e)
            }
            
    except Exception as e:
        error_msg = f"LLM Error: {str(e)}"
        print(error_msg)
        return {
            **create_fallback_suggestions(free_slots, 'LLM service unavailable'),
            'llm_enabled': True,
            'error': error_msg
        }


def get_busy_slots(calendar_ids, start_time, end_time, service):
    """Get all busy slots from the specified calendars"""
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
    return all_busy_slots

@app.route('/suggest-times', methods=['GET'])
def suggest_times_page():
    """Render the suggest times page"""
    if 'credentials' not in session:
        return redirect('/')
        
    # Handle case where credentials might already be a dict or a JSON string
    credentials = session['credentials']
    if isinstance(credentials, str):
        try:
            credentials = json.loads(credentials)
        except json.JSONDecodeError:
            return 'Invalid credentials format', 401
    
    if not credentials or not isinstance(credentials, dict) or 'token' not in credentials:
        return 'Invalid credentials', 401
        
    return render_template('suggest_times.html')

@app.route('/api/suggest-times', methods=['POST'])
def suggest_times():
    """API endpoint to get suggested meeting times with LLM optimization"""
    if 'credentials' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
        
    # Handle case where credentials might already be a dict or a JSON string
    credentials = session['credentials']
    if isinstance(credentials, str):
        try:
            credentials = json.loads(credentials)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid credentials format'}), 401
    
    if not credentials or not isinstance(credentials, dict) or 'token' not in credentials:
        return jsonify({'error': 'Invalid credentials'}), 401
        
    try:
        data = request.get_json()
        duration = int(data.get('duration', 30))  # Default to 30 minutes
        time_range = data.get('time_range', 'this_week')
        event_title = data.get('event_title', 'meeting')
        calendar_ids = data.get('calendar_ids', [])  # Get selected calendar IDs
        
        # Handle date range - prefer explicit start/end dates if provided
        # Use timezone-aware UTC "now" to avoid naive/aware comparison issues
        now = dt.datetime.now(dt.timezone.utc)
        
        # Check if custom dates are provided
        if 'start_date' in data and 'end_date' in data:
            try:
                if isinstance(data['start_date'], str):
                    start_date = parse_datetime(data['start_date'])
                else:
                    start_date = now
                
                if isinstance(data['end_date'], str):
                    end_date = parse_datetime(data['end_date'])
                else:
                    end_date = now + timedelta(days=7)  # Default to one week if end date not provided
            except (ValueError, TypeError) as e:
                print(f"Error parsing dates: {e}")
                return jsonify({
                    'status': 'error',
                    'message': f'Invalid date format: {str(e)}',
                    'llm_enabled': ENABLE_LLM
                }), 400
        else:
            # Fall back to time_range if no explicit dates provided
            start_date = now
            
            if time_range == 'today':
                end_date = now.replace(hour=23, minute=59, second=59)
            elif time_range == 'tomorrow':
                start_date = now + timedelta(days=1)
                start_date = start_date.replace(hour=0, minute=0, second=0)
                end_date = start_date.replace(hour=23, minute=59, second=59)
            elif time_range == 'this_week':
                end_date = now + timedelta(days=(6 - now.weekday()) % 7)  # End of week
                end_date = end_date.replace(hour=23, minute=59, second=59)
            elif time_range == 'next_week':
                start_date = now + timedelta(days=(7 - now.weekday()))  # Next Monday
                start_date = start_date.replace(hour=0, minute=0, second=0)
                end_date = start_date + timedelta(days=6)  # Next Sunday
                end_date = end_date.replace(hour=23, minute=59, second=59)
            elif time_range == 'next_two_weeks':
                end_date = now + timedelta(days=14)
                end_date = end_date.replace(hour=23, minute=59, second=59)
            else:  # Default to one week
                end_date = now + timedelta(days=7)
                end_date = end_date.replace(hour=23, minute=59, second=59)

        # Ensure all key datetimes are timezone-aware
        start_date = ensure_timezone_aware(start_date)
        end_date = ensure_timezone_aware(end_date)
        now = ensure_timezone_aware(now)

        # Ensure start_date is in the future
        if start_date < now:
            start_date = now
        
        # Get calendar service
        try:
            calendar_service = get_calendar_service()
            
            # Get list of calendars if none provided, otherwise filter by provided IDs
            calendars_result = calendar_service.calendarList().list().execute()
            all_calendars = calendars_result.get('items', [])
            
            # If specific calendar IDs are provided, filter the calendars
            if calendar_ids:
                all_calendars = [cal for cal in all_calendars if cal['id'] in calendar_ids]
            
            calendar_ids = [cal['id'] for cal in all_calendars]
            
            if not calendar_ids:
                return jsonify({
                    'suggestions': [{
                        'time': 'No calendars found',
                        'explanation': 'Please select at least one calendar to find available times.'
                    }],
                    'status': 'error',
                    'message': 'No calendars found or selected',
                    'llm_enabled': ENABLE_LLM
                })
            
            # Get busy slots
            busy_slots = get_busy_slots(calendar_ids, start_date, end_date, calendar_service)
            
            # Sort busy slots by start time
            busy_slots.sort(key=lambda x: x['start'])
            
            # Find free slots (inverse of busy slots)
            free_slots = []
            current_time = start_date
            
            for busy in busy_slots:
                busy_start = busy['start'] if isinstance(busy['start'], datetime) else parse_datetime(busy['start'])
                busy_end = busy['end'] if isinstance(busy['end'], datetime) else parse_datetime(busy['end'])

                # Ensure busy times are timezone-aware
                busy_start = ensure_timezone_aware(busy_start)
                busy_end = ensure_timezone_aware(busy_end)
                current_time = ensure_timezone_aware(current_time)
                end_date = ensure_timezone_aware(end_date)
                
                # If there's a gap between current_time and busy_start, it's free
                if current_time < busy_start:
                    free_slots.append({
                        'start': current_time,
                        'end': busy_start
                    })
                
                # Move current_time to the end of this busy slot
                if busy_end > current_time:
                    current_time = busy_end
            
            # Add the remaining time as free
            if current_time < end_date:
                free_slots.append({
                    'start': current_time,
                    'end': end_date
                })
            
            # Filter free slots that are at least as long as the requested duration
            duration_td = timedelta(minutes=duration)
            suitable_slots = [
                {
                    'start': slot['start'],
                    'end': slot['end'],
                    'duration_minutes': (slot['end'] - slot['start']).total_seconds() / 60
                }
                for slot in free_slots 
                if (slot['end'] - slot['start']) >= duration_td
            ]
            
            if not suitable_slots:
                return jsonify({
                    'suggestions': [{
                        'time': 'No available slots',
                        'explanation': 'No suitable time slots found for the given duration.'
                    }],
                    'status': 'error',
                    'message': 'No available time slots found',
                    'llm_enabled': ENABLE_LLM
                })
            
            # Limit the number of slots to process to avoid excessive LLM usage
            max_slots_to_process = 20  # Limit to prevent excessive LLM usage
            if len(suitable_slots) > max_slots_to_process:
                # Take a sample of the slots to avoid hitting rate limits
                import random
                suitable_slots = random.sample(suitable_slots, max_slots_to_process)
                
                # Sort the sampled slots by start time
                suitable_slots.sort(key=lambda x: x['start'])
            
            try:
                # Get LLM-suggested optimal times
                llm_result = suggest_optimal_times(
                    suitable_slots,
                    duration_minutes=duration,
                    event_title=event_title,
                    num_suggestions=min(3, len(suitable_slots) or 1)  # Don't ask for more suggestions than available slots
                )
                
                # If LLM is disabled or returned an error, use a simple fallback
                if not llm_result.get('suggestions') or llm_result.get('status') != 'success':
                    return jsonify({
                        'suggestions': [{
                            'time': 'No suggestions available',
                            'explanation': 'Could not generate time suggestions. Please try different parameters.'
                        }],
                        'status': 'error',
                        'message': llm_result.get('message', 'Failed to generate suggestions'),
                        'llm_enabled': ENABLE_LLM,
                        'time_range': {
                            'start': start_date.isoformat(),
                            'end': end_date.isoformat()
                        },
                        'total_free_slots': len(suitable_slots)
                    })
                
                # Convert datetime objects to ISO format for JSON serialization
                for suggestion in llm_result.get('suggestions', []):
                    if 'start' in suggestion and isinstance(suggestion['start'], datetime):
                        suggestion['start'] = suggestion['start'].isoformat()
                    if 'end' in suggestion and isinstance(suggestion['end'], datetime):
                        suggestion['end'] = suggestion['end'].isoformat()
                
                return jsonify({
                    **llm_result,
                    'time_range': {
                        'start': start_date.isoformat(),
                        'end': end_date.isoformat()
                    },
                    'total_free_slots': len(suitable_slots)
                })
                
            except Exception as e:
                print(f"Error in LLM suggestion: {str(e)}")
                # Return a helpful error message with the available slots
                return jsonify({
                    'suggestions': [{
                        'time': 'Error generating suggestions',
                        'explanation': f'An error occurred: {str(e)[:200]}...'  # Truncate long error messages
                    }],
                    'status': 'error',
                    'message': f'Error generating suggestions: {str(e)[:200]}',
                    'llm_enabled': ENABLE_LLM,
                    'time_range': {
                        'start': start_date.isoformat(),
                        'end': end_date.isoformat()
                    },
                    'total_free_slots': len(suitable_slots)
                })
            
        except Exception as e:
            print(f"Error in calendar operations: {str(e)}")
            return jsonify({
                'suggestions': [{
                    'time': 'Error',
                    'explanation': f'Failed to fetch calendar data: {str(e)}'
                }],
                'status': 'error',
                'message': str(e),
                'llm_enabled': ENABLE_LLM
            }), 500
            
    except Exception as e:
        print(f"Error in suggest_times: {str(e)}")
        return jsonify({
            'suggestions': [{
                'time': 'Error',
                'explanation': f'An error occurred: {str(e)}'
            }],
            'status': 'error',
            'message': str(e),
            'llm_enabled': ENABLE_LLM
        }), 500

@app.route('/check-multiple-availability', methods=['GET', 'POST'])
def check_multiple_availability():
    """Show common free time across selected calendars with calendar view option"""
    # Handle both form submission and direct GET requests
    if request.method == 'POST':
        if 'calendars' not in request.form:
            return 'No calendars selected', 400
        calendar_ids = request.form.getlist('calendars')
        days = int(request.form.get('days', 7))
        view = request.form.get('view', 'list')
    else:  # GET request
        calendar_ids = request.args.getlist('calendars')
        if not calendar_ids:
            return redirect(url_for('check_availability_form'))
        days = int(request.args.get('days', 7))
        view = request.args.get('view', 'list')  # 'list' or 'calendar'
    
    service = get_calendar_service()
    if service is None:
        return redirect(url_for("authorize"))
    
    try:
        # Set time range with timezone awareness
        now = dt.datetime.now(dt.timezone.utc)
        end_time = now + dt.timedelta(days=days)
        
        # Get busy slots from all selected calendars
        busy_slots = get_busy_slots(calendar_ids, now, end_time, service)
        
        # Find common free time
        free_slots = compute_free_slots(busy_slots, now, end_time)
        
        # Format times for display
        def format_for_display(dt_obj):
            if dt_obj.tzinfo is None:
                dt_obj = dt_obj.replace(tzinfo=dt.timezone.utc)
            return dt_obj.isoformat()
        
        # Prepare data for the template
        formatted_busy_slots = [
            {
                'start': format_for_display(slot['start']),
                'end': format_for_display(slot['end'])
            }
            for slot in busy_slots
        ]
        
        formatted_free_slots = [
            {
                'start': format_for_display(slot[0]),
                'end': format_for_display(slot[1])
            }
            for slot in free_slots if (slot[1] - slot[0]).total_seconds() >= 1800  # Only include slots >= 30 minutes
        ]
        
        # If calendar view is requested, render the calendar template
        if view == 'calendar':
            from flask import render_template
            return render_template(
                'calendar_view.html',
                busy_slots=formatted_busy_slots,
                free_slots=formatted_free_slots,
                days=days,
                calendar_count=len(calendar_ids),
                calendar_ids=calendar_ids
            )
        
        # Otherwise, show the list view
        # Create URL parameters for the calendar view
        calendar_params = '&'.join([f'calendars={cal_id}' for cal_id in calendar_ids])
        result = [
            "<h1>Common Free Time</h1>",
            f"<p>Showing free time for the next {days} days across {len(calendar_ids)} selected calendars</p>",
            f"<p><a href='/check-multiple-availability?{calendar_params}&days={days}&view=calendar' class='button'>View as Calendar</a></p>"
        ]
        
        if free_slots:
            result.append("<h2>Available Time Slots:</h2><ul>")
            for slot in free_slots:
                start, end = slot
                if start.tzinfo is None:
                    start = start.replace(tzinfo=dt.timezone.utc)
                if end.tzinfo is None:
                    end = end.replace(tzinfo=dt.timezone.utc)
                    
                duration = end - start
                if duration.total_seconds() >= 1800:  # Only show slots >= 30 minutes
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
