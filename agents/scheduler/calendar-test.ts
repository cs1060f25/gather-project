// Test suite for Calendar Agent
import dotenv from 'dotenv';
import { calendarAgent, createHostEvent } from "./calendar.js";

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
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 2: Event without Location
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 2: Event without Location");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result2 = await createHostEvent({
      hostId: "user456",
      slot: "2025-11-28T10:00:00Z",
      title: "Team Standup",
      durationMinutes: 30,
      inviteeEmails: ["team@example.com"],
    });
    console.log("✅ PASS");
    console.log(JSON.stringify(result2, null, 2));
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 3: Get Host Busy Periods
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 3: Get Host Busy Periods");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const busyPeriods = await calendarAgent.getHostBusy({
      hostId: "user123",
      timeMin: "2025-11-27T00:00:00Z",
      timeMax: "2025-11-27T23:59:59Z",
    });
    console.log("✅ PASS");
    console.log("Busy periods:", JSON.stringify(busyPeriods, null, 2));
  } catch (e) {
    console.log("❌ FAIL:", e);
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
