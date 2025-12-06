---
description: How to use and test the Suggest Times feature
---

1. Start the Flask application:
   ```bash
   python3 app.py
   ```

2. Open your browser and navigate to `http://127.0.0.1:5000`.

3. Click on "Check Multiple Calendars" (or "Compare Calendars").
   - You will be redirected to Google Sign-in if not already authenticated.
   - Select the calendars you want to check and click "Check Availability".

4. On the Calendar View page:
   - Click the "Get Time Suggestions" button at the top right.
   - In the modal:
     - Enter an **Event Title** (e.g., "Team Sync").
     - Enter a **Duration** (e.g., 30 minutes).
     - Select a **Time Range**:
       - **Current View**: Uses the visible date range on the calendar.
       - **Next Week**: Looks for times in the upcoming week.
       - **Specific Dates**: Allows you to pick a custom start and end date.
   - Click "Get Suggestions".

5. View and Schedule:
   - The system will display up to 3 optimal time slots suggested by the LLM (or fallback logic).
   - Click the **Schedule** button next to a suggestion.
   - This will open the "Create Event" page with the title, start time, and end time pre-filled.
   - Review the details and click "Create Event" to add it to your calendar.

**Note**: To use the LLM features, ensure you have set the `OPENAI_API_KEY` and `ENABLE_LLM=true` in your environment (or `.env` file). If not, the system will use a fallback algorithm to find the first available slots.
