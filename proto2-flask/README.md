# Proto2-Flask: Form-based Web Scheduler

## What This Is

This is **proto2-flask** - Gatherly's second prototype attempt. It's a basic Flask web app with HTML forms where users enter two names and a date to schedule lunch.

**This prototype intentionally demonstrates that plain forms don't work for Gatherly.**

## Why This Failed

### ❌ Problems Identified

1. **Form-Filling UX**: Feels like filling out paperwork, not having a conversation about lunch
2. **No Visual Context**: Can't see calendars, availability, or scheduling conflicts
3. **Static & Detached**: Submit button→wait→redirect feels disconnected from real scheduling
4. **No Intelligence**: Just stores data - no smart suggestions or conflict detection
5. **Lacks Personality**: Clean design but no warmth or conversational flow
6. **No Collaboration**: One person fills form - doesn't capture the social nature of coordinating
7. **Poor Error Handling**: Red error messages feel punishing, not helpful
8. **Missing Location Context**: Text field for location without maps, photos, or recommendations
9. **No Real-time Feedback**: Can't see if selected time works for the other person
10. **Doesn't Scale**: Adding features just makes the form longer and more tedious

### 💡 Key Learning

**Design language and interaction style matter more than backend correctness.**

This prototype works functionally - it collects data, validates input, and displays confirmations. But it completely misses what makes scheduling social and natural. The form-based approach treats scheduling as data entry, not as a conversation between people.

### 🎯 What This Taught Us

Forms are great for structured data collection, but **terrible for social coordination**. Gatherly needs:
- Conversational interfaces (chat-like)
- Visual scheduling context (calendars, availability)
- Real-time collaboration (see changes as they happen)
- Intelligent suggestions (AI-powered recommendations)
- Natural language (not rigid fields)

## How to Run This Prototype

### Prerequisites
- Python 3.7 or higher
- pip

### Installation & Setup

```bash
# Navigate to proto2-flask directory
cd /Users/milannaropanth/october14/proto2-flask

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run the App

```bash
# Start the Flask server
python3 app.py

# Or if you made it executable:
chmod +x app.py
./app.py
```

The app will start at: **http://localhost:5001**

### Usage Flow

1. Open http://localhost:5001 in your browser
2. Click "Start Scheduling"
3. Fill out the form:
   - Person 1: John
   - Person 2: Ikenna
   - Date: Pick any date
   - Time: Select from dropdown
   - Location: Joe's Pizza, Harvard Square (optional)
4. Click "Schedule Meeting"
5. See the confirmation page
6. View "All Events" to see scheduled meetings

## Screenshot Instructions

### Key Screens to Capture

1. **Home Page** - Shows the sterile "Start Scheduling" button
2. **Schedule Form** - The plain form with rigid fields
3. **Confirmation Page** - The transactional success message
4. **Events List** - The boring list of scheduled events

### What to Highlight in Screenshots

- The **lack of conversation** - just fields to fill
- The **absence of visual calendars** - no way to see availability
- The **cold, transactional feel** - works but feels empty
- The warning boxes pointing out limitations

## Comparison with Other Prototypes

| Aspect | Proto1-CLI | Proto2-Flask | Proto4-Framer |
|--------|-----------|--------------|---------------|
| **Interface** | Terminal | Web Form | Conversational UI |
| **Visual Feedback** | None | Basic HTML | Rich animations |
| **Personality** | None | Clean but cold | Warm & human |
| **Scheduling Feel** | Data entry | Form filling | Natural conversation |
| **Calendar View** | No | No | Yes (visual) |
| **Location Context** | No | Text field only | Maps & suggestions |
| **Result** | ❌ Too technical | ❌ Too transactional | ✅ Natural & social |

## Key Failures Demonstrated

### 1. Form vs. Conversation
```
Form Approach (Proto2):
- "Enter Person 1 name"
- "Enter Person 2 name"  
- "Select date"
→ Feels like data entry

Conversational (Proto4):
- "I want to meet with Ikenna for lunch"
- "Here are times that work for both of you"
→ Feels like coordinating with a friend
```

### 2. No Visual Schedule
- Can't see calendars
- No availability visualization
- No conflict detection shown visually
- Just picking from a dropdown of times

### 3. Static Flow
- Fill form → Submit → Wait → Redirect
- No progressive disclosure
- No feedback during input
- Feels disconnected

## Local URLs for Screenshots

- Home: `http://localhost:5001/`
- Schedule Form: `http://localhost:5001/schedule`
- Events List: `http://localhost:5001/events`
- (Confirmation appears after submitting form)

## File Structure

```
proto2-flask/
├── app.py                  # Flask application
├── requirements.txt        # Python dependencies
├── README.md              # This file
└── templates/
    ├── base.html          # Base template with styles
    ├── index.html         # Home page
    ├── schedule.html      # Schedule form
    ├── confirmation.html  # Success page
    └── events.html        # Events list
```

## Next Steps After This Failure

This prototype's failure clarified that Gatherly needs:
1. **Proto3**: Static React mockups to visualize the right UI patterns
2. **Proto4**: Full interactive implementation with conversation + visuals

---

**Branch**: `proto2-flask`  
**Linear Issue**: GATHER-8  
**Status**: ❌ Failed (intentionally) - Learned that forms don't work for social scheduling  
**Deploy**: Optional (localhost is fine for screenshots)

