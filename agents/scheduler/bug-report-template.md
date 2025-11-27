# Scheduler Agent Bug Report

## Test Run Date: [DATE]
## Environment: [Development/Production]
## Tester: [YOUR_NAME]

---

## Test Results Summary

| Test Case | Status | Issues Found |
|-----------|--------|--------------|
| Basic Coffee Chat Scheduling | ⏳ | - |
| Social Appropriateness | ⏳ | - |
| "See 3 More" Functionality | ⏳ | - |
| Respect Quiet Hours | ⏳ | - |
| Duration Preference | ⏳ | - |
| No Available Slots Edge Case | ⏳ | - |
| NLP Inference | ⏳ | - |
| Evening Exception | ⏳ | - |

**Legend:** ✅ Pass | ❌ Fail | ⚠️ Partial | ⏳ Not Tested

---

## Bug Report Template (Assignment Format)

### Bug Description: [Brief Title - e.g., "Scheduler Agent suggests inappropriate evening slots for coffee chats"]

**Description:** [A clear, detailed description of (a) the behavior you see and (b) (ideally) the expected behavior.]

When I run the scheduler agent with a coffee chat request and all daytime slots are busy, it suggests evening slots (7PM-9PM) instead of moving to the next available day. The expected behavior is that coffee chats should only be scheduled between 9AM-6PM for social appropriateness, and if no slots are available in that window, it should suggest slots on the next day within appropriate hours.

**Impact:** This could cause users to schedule socially inappropriate meeting times, potentially damaging professional relationships and violating the social norms the system is designed to respect.

**Steps to Reproduce:** 
1. Set up scheduler agent with OpenAI API key
2. Call generateSchedule() with coffee chat text and freeBusy blocking 9AM-6PM
3. Observe that returned slots are outside appropriate coffee chat hours
4. Example input: `{ text: "Coffee with Sarah", freeBusy: [{ start: "2025-11-12T09:00:00Z", end: "2025-11-12T18:00:00Z" }] }`

**Environment:** 
- Node.js v24.9.0
- TypeScript 5.5.3
- OpenAI API (gpt-4o-mini model)
- macOS [version]
- Test file: `/agents/scheduler/schedule-test.ts`

**Frequency:** Persistent

**Predictability:** Always occurs when daytime slots are unavailable for coffee chats

**Desired behavior:** When all appropriate coffee chat hours (9AM-6PM) are busy, suggest slots on the next available day within the same time window, or return fewer than 3 slots if necessary.

### Triage
This is a **[sev2/sev3]** severity bug, and **[Medium/High]** priority because it violates core business logic around social appropriateness but doesn't break core functionality.

### Tests
Test case found in `/agents/scheduler/schedule-test.ts` - "Test 2: Social Appropriateness - Coffee Chat Time Window". Additional edge case testing needed for multi-day scenarios.

### Fixes
**Potential fix locations:**
- `/agents/scheduler/prompt.md` - Strengthen social appropriateness rules
- `/agents/scheduler/index.ts` - Add post-processing validation
- Consider adding time window validation in schema

### AI Attempt #1
We tried [AI tool/approach] and [result/outcome]

### AI Attempt #2  
We tried [AI tool/approach] and [result/outcome]

### AI Attempt #3
We tried [AI tool/approach] and [result/outcome]

[If AI attempts failed: "All 3 AI attempts failed, so we fixed manually"]
[If AI succeeded: "AI Attempt #X succeeded with the following approach:"]

**And here's how we did it:** [Manual fix description or successful AI approach]

### Review
[Someone else should review the fix, test, etc. and sign off on it.]

---

## Example Bug Report

### Bug Description: Scheduler Agent ignores quiet hours preference

**Description:** When I specify quiet hours in preferences (e.g., "12:00-13:00" for lunch), the scheduler agent still suggests meeting slots during those blocked times. The expected behavior is that no slots should be suggested during user-defined quiet hours.

**Impact:** Users may get scheduled during their explicitly blocked times (lunch, personal time, etc.), causing scheduling conflicts and poor user experience.

**Steps to Reproduce:**
1. Run scheduler with quiet_hours: ["12:00-13:00"] in preferences
2. Provide freeBusy data that leaves 12:00-13:00 as the only available window
3. Observe that scheduler suggests slots during the quiet hour period
4. Test case: "Test 4: Respect Quiet Hours" in test-all.ts

**Environment:**
- Node.js v24.9.0
- Scheduler Agent v1.0
- OpenAI gpt-4o-mini model
- Test environment: local development

**Frequency:** Persistent

**Predictability:** Always occurs when quiet hours overlap with available time slots

**Desired behavior:** Scheduler should never suggest slots during quiet hours, even if it means returning fewer than 3 options or suggesting slots on different days.

### Triage
This is a **sev2** severity bug, and **High** priority because it directly violates user preferences and core scheduling logic.

### Tests
Test case: "Test 4: Respect Quiet Hours" in `/agents/scheduler/schedule-test.ts`

### Fixes
Likely fix in `/agents/scheduler/prompt.md` - need to strengthen the quiet hours enforcement in the system prompt.

### AI Attempt #1
[To be filled during testing]

### Review
[To be completed after fix implementation]
