# Natural Language Parsing - Test Cases & Expected Results

## How to Test
1. Open Gatherly app
2. Type in the chat bar at the bottom of Create Event panel
3. Observe which fields get populated

---

## Test Category 1: Basic Event Creation (Empty Form)

### Test 1.1: Simple event with time
**Input:** `Coffee tomorrow at 2pm`
**Expected:**
- Title: "Coffee"
- Dates: Tomorrow, Day after, 2 days from now
- Times: 14:00 for all (explicit time given)
- Duration: 45 min (coffee default)
- Location: TBD
- Google Meet: OFF

### Test 1.2: Event with person
**Input:** `Lunch with John on Friday`
**Expected:**
- Title: "Lunch with John"
- Dates: Friday, Saturday, Sunday (spread out)
- Times: 12:00, 12:30, 13:00 (lunch times)
- Duration: 60 min
- Participants: John (if in contacts)

### Test 1.3: Virtual meeting
**Input:** `Video call with Sarah next week`
**Expected:**
- Title: "Video Call with Sarah"
- Dates: Mon, Tue, Wed of next week
- Times: 10:00, 14:00, 16:00 (call times)
- Duration: 60 min
- Location: Google Meet
- Google Meet: ON
- Participants: Sarah (if in contacts)

### Test 1.4: Event with location
**Input:** `Dinner at Shake Shack on Saturday at 7pm`
**Expected:**
- Title: "Dinner at Shake Shack"
- Dates: Saturday (all 3 on Sat or spread)
- Times: 19:00
- Duration: 90 min (dinner default)
- Location: Shake Shack, [address]
- Google Meet: OFF

### Test 1.5: Study session
**Input:** `Study session at Lamont for 2 hours`
**Expected:**
- Title: "Study Session"
- Duration: 120 min
- Location: Lamont Library, Harvard University (expanded)
- Times: 10:00, 14:00, 16:00 (study defaults)

---

## Test Category 2: Time Inference from Event Type

### Test 2.1: Breakfast
**Input:** `Breakfast meeting`
**Expected Times:** 08:00, 08:30, 09:00

### Test 2.2: Brunch
**Input:** `Brunch with parents`
**Expected Times:** 10:30, 11:00, 11:30
**Expected Duration:** 90 min

### Test 2.3: Happy Hour
**Input:** `Happy hour with team`
**Expected Times:** 17:00, 17:30, 18:00
**Expected Duration:** 90 min

### Test 2.4: Dinner
**Input:** `Dinner date`
**Expected Times:** 18:30, 19:00, 19:30
**Expected Duration:** 90 min

---

## Test Category 3: Multi-Turn Conversations (Building on Form)

### Test 3.1: Add location to existing
**Setup:** Form has "Coffee with John", dates/times set
**Input:** `at Starbucks`
**Expected:**
- Title: UNCHANGED (Coffee with John)
- Dates/Times: UNCHANGED
- Location: Starbucks, [address]

### Test 3.2: Change duration
**Setup:** Form has "Meeting", 60 min duration
**Input:** `make it 30 minutes`
**Expected:**
- All fields: UNCHANGED
- Duration: 30 min

### Test 3.3: Add participant
**Setup:** Form has "Lunch", no participants
**Input:** `add Sarah`
**Expected:**
- All fields: UNCHANGED
- Participants: Sarah added

### Test 3.4: Change specific time option
**Setup:** Form has 3 options, option 2 is on Sunday
**Input:** `move the Sunday one to Monday`
**Expected:**
- Option 2 date: Changed to Monday
- Options 1 and 3: UNCHANGED

### Test 3.5: Change to virtual
**Setup:** Form has "Meeting at Office"
**Input:** `make it a video call instead`
**Expected:**
- Location: Google Meet
- Google Meet: ON
- Other fields: UNCHANGED

---

## Test Category 4: Conflict Avoidance

### Test 4.1: Don't schedule during busy time
**Setup:** Calendar shows 2-3pm meeting on Monday
**Input:** `Meeting on Monday at 2:30pm`
**Expected:**
- Should NOT suggest 2:30pm on Monday
- Should pick 1pm or 4pm instead, OR different day

### Test 4.2: Pending Gatherly events respected
**Setup:** Pending event on Tuesday 10-11am
**Input:** `Coffee Tuesday at 10am`
**Expected:**
- Should NOT suggest 10am Tuesday
- Should suggest different time or day

---

## Test Category 5: Weekend Handling

### Test 5.1: This weekend
**Input:** `This weekend`
**Expected Dates:** Saturday, Sunday of this week

### Test 5.2: Next weekend
**Input:** `Next weekend`
**Expected Dates:** Saturday, Sunday of NEXT week

### Test 5.3: Specific day
**Input:** `Saturday afternoon`
**Expected:**
- Date: This Saturday
- Time: 14:00 (afternoon)

---

## Test Category 6: Duration Parsing

### Test 6.1: Explicit minutes
**Input:** `30 minute meeting`
**Expected Duration:** 30 min

### Test 6.2: Explicit hours
**Input:** `2 hour study session`
**Expected Duration:** 120 min

### Test 6.3: Quick meeting
**Input:** `Quick sync`
**Expected Duration:** 30 min

### Test 6.4: Default by type
**Input:** `Coffee chat`
**Expected Duration:** 45 min (coffee default)

---

## Debugging

If parsing isn't working as expected:

1. Check browser console for `[Gatherly] Sending busy slots` logs
2. Check Network tab for `/api/parse-scheduling` request/response
3. Verify OpenAI API key is set in environment

## Model Notes

Currently using `gpt-4o-mini` with temperature=0.2 for consistency.
If results are inconsistent, consider:
- Lowering temperature to 0.1
- Switching to `gpt-4o` for better reasoning
- Adding more explicit examples in prompt

