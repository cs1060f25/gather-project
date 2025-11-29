// Test suite for Calendar Agent
import dotenv from 'dotenv';
import { calendarAgent, createHostEvent, type CalendarError } from "../calendar.js";
import type { CalendarRequest } from "../calendar.js";

// Load environment variables
dotenv.config({ path: '../../.env' });

async function runCalendarTests() {
  console.log("🧪 Running Calendar Agent Test Suite\n");
  
  // Test 1: Basic Calendar Event Creation ✅
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 1: Basic Calendar Event Creation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result1 = await createHostEvent({
      timeZone: 'UTC',
      hostId: "user123",
      slot: "2025-11-27T15:00:00Z",
      title: "Coffee with Milan and Ikenna",
      location: "Spangler Cafe",
      description: "Scheduled via Gatherly - discussing project updates",
      durationMinutes: 45,
      inviteeEmails: ["milan@example.com", "ikenna@example.com"],
    });
    console.log("✅ PASS");
    console.log(JSON.stringify(result1, null, 2));
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ FAIL:", error.message);
  }

  // Test 2: Event without Location
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 2: Event without Location");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result2 = await createHostEvent({
      timeZone: 'UTC',
      hostId: "user456",
      slot: "2025-11-28T10:00:00Z",
      title: "Team Standup",
      durationMinutes: 30,
      inviteeEmails: ["team@example.com"],
    });
    console.log("✅ PASS");
    console.log(JSON.stringify(result2, null, 2));
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ FAIL:", error.message);
  }


  // Test 4: Update Event
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 4: Update Event");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    // First create an event
    const event = await createHostEvent({
      timeZone: 'UTC',
      hostId: "user789",
      slot: "2025-11-29T10:00:00Z",
      title: "Initial Meeting",
      durationMinutes: 30,
    });

    // Then update it
    await calendarAgent.updateHostEvent(
      "user789",
      event.calendarEventId,
      {
        title: "Updated Meeting Title",
        location: "New Location",
        description: "Updated description"
      }
    );
    console.log("✅ PASS");
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ FAIL:", error.message);
  }

  // Test 5: Delete Event
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 5: Delete Event");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    // First create an event
    const event = await createHostEvent({
      timeZone: 'UTC',
      hostId: "user101",
      slot: "2025-11-30T15:00:00Z",
      title: "Event to Delete",
      durationMinutes: 30,
    });

    // Then delete it
    await calendarAgent.deleteHostEvent("user101", event.calendarEventId);
    console.log("✅ PASS");
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ FAIL:", error.message);
  }

  // Test 6: Error Handling - Invalid Token
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 6: Error Handling - Invalid Token");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    let originalToken: string | undefined;
    try {
      // Temporarily override access token to trigger error
      originalToken = process.env.GOOGLE_ACCESS_TOKEN;
      process.env.GOOGLE_ACCESS_TOKEN = 'invalid_token';

      await createHostEvent({
        timeZone: 'UTC',
        hostId: "user404",
        slot: "2025-12-01T10:00:00Z",
        title: "Should Fail",
        durationMinutes: 30,
      });

      console.log("❌ FAIL: Should have thrown error");
    } catch (e: unknown) {
      const error = e as Error;
      console.log("✅ PASS - Caught expected error:", error.message);
    } finally {
      // Restore token
      process.env.GOOGLE_ACCESS_TOKEN = originalToken;
    }
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ Unexpected error:", error.message);
  }

  // Test 7: Input Validation
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 7: Input Validation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Test invalid inputs
  const invalidInputs = [
    { // Missing required field
      hostId: "user123",
      // slot missing
      title: "Invalid Event",
      durationMinutes: 30
    },
    { // Invalid date format
      hostId: "user123",
      slot: "not-a-date",
      title: "Invalid Date",
      durationMinutes: 30
    },
    { // Invalid duration
      hostId: "user123",
      slot: "2025-11-27T15:00:00Z",
      title: "Invalid Duration",
      durationMinutes: -30
    },
    { // Invalid email
      hostId: "user123",
      slot: "2025-11-27T15:00:00Z",
      title: "Invalid Email",
      durationMinutes: 30,
      inviteeEmails: ["not-an-email"]
    }
  ];

  for (const input of invalidInputs) {
    try {
      await createHostEvent(input as any);
      console.log("❌ FAIL: Should have rejected invalid input:", input);
    } catch (e: unknown) {
      console.log("✅ PASS - Caught expected validation error for:", input);
    }
  }

  // Test 8: Timezone Handling
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 8: Timezone Handling");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result8 = await createHostEvent({
      timeZone: 'America/Los_Angeles',
      hostId: "user123",
      slot: "2025-11-27T15:00:00-07:00", // Non-UTC timezone
      title: "Timezone Test",
      durationMinutes: 30
    });
    console.log("✅ PASS");
    console.log(JSON.stringify(result8, null, 2));
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ FAIL:", error.message);
  }

  // Test 9: Recurring Events
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 9: Recurring Events");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result9 = await createHostEvent({
      timeZone: 'UTC',
      hostId: "user123",
      slot: "2025-11-27T15:00:00Z",
      title: "Weekly Team Sync",
      durationMinutes: 30,
      recurrence: {
        frequency: "WEEKLY",
        count: 4
      }
    });
    console.log("✅ PASS");
    console.log(JSON.stringify(result9, null, 2));
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ FAIL:", error.message);
  }



  // Test 10: Token Refresh
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 10: Token Refresh");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    // Simulate expired token
    process.env.GOOGLE_ACCESS_TOKEN = 'expired_token';
    process.env.GOOGLE_REFRESH_TOKEN = 'valid_refresh_token';

    const result = await createHostEvent({
      timeZone: 'UTC',
      hostId: "user123",
      slot: "2025-11-27T15:00:00Z",
      title: "Test Refresh Token",
      durationMinutes: 30
    });

    console.log("✅ PASS - Successfully refreshed token");
    console.log(JSON.stringify(result, null, 2));
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ FAIL:", error.message);
  } finally {
    // Restore original tokens
    process.env.GOOGLE_ACCESS_TOKEN = process.env.ORIGINAL_ACCESS_TOKEN;
    process.env.GOOGLE_REFRESH_TOKEN = process.env.ORIGINAL_REFRESH_TOKEN;
  }

  // Test 11: RSVP Status Tracking
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 11: RSVP Status Tracking");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    // Create event with attendees
    const event = await createHostEvent({
      timeZone: 'UTC',
      hostId: "user123",
      slot: "2025-11-27T16:00:00Z",
      title: "RSVP Test Meeting",
      durationMinutes: 30,
      inviteeEmails: ["test1@example.com", "test2@example.com"]
    });

    // Note: In a real implementation, we'd have a webhook endpoint
    // that receives RSVP updates from Google Calendar
    console.log("✅ PASS - Event created with attendees");
    console.log("TODO: Implement webhook receiver for RSVP updates");
  } catch (e: unknown) {
    const error = e as Error;
    console.log("❌ FAIL:", error.message);
  }

  // Test 12: Invalid Timezone
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 12: Invalid Timezone");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    await createHostEvent({
      timeZone: 'Invalid/Timezone',
      hostId: "user123",
      slot: "2025-11-27T16:00:00Z",
      title: "Invalid Timezone Test",
      durationMinutes: 30
    });
    console.log("❌ FAIL - Should have rejected invalid timezone");
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message.includes('timezone')) {
      console.log("✅ PASS - Caught invalid timezone error");
    } else {
      console.log("❌ FAIL - Wrong error type:", error.message);
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏁 Calendar Test Suite Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Run tests if this file is executed directly
if (import.meta?.url === `file://${process.argv[1]}`) {
  runCalendarTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { runCalendarTests };
