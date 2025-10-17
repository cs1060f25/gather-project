# Proto1-CLI: Basic Command-Line Scheduling Assistant

## What This Is

This is **proto1-cli** - Gatherly's first prototype attempt. It's a simple Python CLI that asks for two names and a date, then prints possible lunch times.

**This prototype intentionally demonstrates what NOT to do.**

## Why This Failed

### ❌ Problems Identified

1. **Sterile & Technical**: The experience feels like filling out a government form, not scheduling lunch with a friend
2. **No Conversational Flow**: Cold prompts like "Person 1 name:" lack any warmth or context
3. **Rigid Input Format**: Forces users into specific date formats (YYYY-MM-DD) with no flexibility
4. **No Intelligence**: Just prints hardcoded time slots - no actual calendar checking
5. **Error-Heavy**: Focuses on validation errors rather than helping users succeed
6. **No Social Context**: Treats scheduling as a computational task, not a social interaction
7. **Doesn't Scale**: Adding features would just make it more complex, not more useful
8. **No Location Intelligence**: Doesn't suggest where to meet
9. **Terminal-Only**: Can't integrate with real calendars or messaging apps
10. **Lacks Personality**: Feels like a shell script, not an assistant

### 💡 Key Learning

**Automation without interaction feels cold.** 

This prototype works functionally - it successfully captures input and outputs time slots. But it completely misses Gatherly's core purpose: making scheduling feel natural, social, and effortless. The experience doesn't convey any sense of:
- Human warmth
- Social awareness
- Conversational intelligence
- Collaborative scheduling

### 🎯 What This Taught Us

Gatherly must feel **conversational, not computational**. Users shouldn't feel like they're operating a machine; they should feel like they're talking to an intelligent assistant that understands the social nature of scheduling.

This failure clarified our direction: we needed to move toward natural language interfaces, visual feedback, and conversational interactions.

## How to Run This Prototype

### Prerequisites
- Python 3.6 or higher

### Run It
```bash
# Navigate to the project directory
cd /Users/milannaropanth/october14

# Make it executable (optional)
chmod +x proto1-cli.py

# Run the prototype
python3 proto1-cli.py
```

### Example Session
```
==================================================
GATHERLY SCHEDULING ASSISTANT v0.1
==================================================

Enter scheduling details:
--------------------------------------------------
Person 1 name: John
Person 2 name: Ikenna
Preferred date (YYYY-MM-DD): 2024-03-14

--------------------------------------------------
PROCESSING REQUEST...
--------------------------------------------------

Scheduling lunch for: John and Ikenna
Date: Thursday, March 14, 2024

Available time slots:
--------------------------------------------------
1. 11:30 AM        [ ] Available
2. 12:00 PM        [ ] Available
3. 12:30 PM        [X] Conflict detected
4. 1:00 PM         [ ] Available
5. 1:30 PM         [ ] Available
6. 2:00 PM         [ ] Available

--------------------------------------------------
Select time slot (1-6): 4

==================================================
MEETING SCHEDULED
==================================================
Participants: John, Ikenna
Date: 2024-03-14
Time: 1:00 PM
Location: [Not specified]
==================================================

Calendar invite will be sent via email.
Session terminated.
```

## Screenshot Instructions

1. Run `python3 proto1-cli.py`
2. Take a screenshot of the terminal showing:
   - The cold, technical prompts
   - The rigid input format
   - The sterile output format
3. This screenshot demonstrates **what not to do** in scheduling UX

## Next Steps

This prototype's failure led us to explore:
- **Proto2**: Natural language processing
- **Proto3**: Web-based conversational UI
- **Proto4**: Rich visual interface with Framer Motion (current implementation)

---

**Status**: ❌ Failed (intentionally) - Learned that automation without warmth doesn't work for social tools like Gatherly

