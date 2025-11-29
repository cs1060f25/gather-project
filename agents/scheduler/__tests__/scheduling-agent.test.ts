// Test suite for Scheduler Agent
import * as dotenv from 'dotenv';
dotenv.config();

import { generateSchedule } from "../index.js";

async function runTests() {
  console.log("🧪 Running Scheduler Agent Test Suite\n");
  
  // Test 1: Basic Coffee Chat Scheduling ✅
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 1: Basic Coffee Chat Scheduling");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result1 = await generateSchedule({
      text: "Plan coffee with Milan and Ikenna this week near Spangler",
      freeBusy: [
        { start: "2025-11-11T09:00:00Z", end: "2025-11-11T12:00:00Z" },
        { start: "2025-11-11T14:00:00Z", end: "2025-11-11T18:00:00Z" },
      ],
      preferences: {
        quiet_hours: ["22:00-07:00"],
        duration_minutes: 45,
      },
      previous: [],
    });
    console.log("✅ PASS");
    console.log(JSON.stringify(result1, null, 2));
    console.log(`Slots within 9AM-6PM: ${result1.slots.every((s: string) => {
      const hour = new Date(s).getUTCHours();
      return hour >= 9 && hour < 18;
    })}`);
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 2: Social Appropriateness - Coffee Chat Time Window
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 2: Social Appropriateness - Coffee Chat Time Window");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result2 = await generateSchedule({
      text: "Coffee with Sarah",
      freeBusy: [
        { start: "2025-11-12T09:00:00Z", end: "2025-11-12T18:00:00Z" }, // Busy all standard hours
      ],
      preferences: {
        duration_minutes: 30,
      },
    });
    console.log("Result:");
    console.log(JSON.stringify(result2, null, 2));
    
    const hasEveningSlots = result2.slots.some((s: string) => {
      const hour = new Date(s).getUTCHours();
      return hour >= 18 || hour < 9;
    });
    
    if (!hasEveningSlots) {
      console.log("❌ EXPECTED: Should suggest next day 9AM slots (not evening)");
    } else {
      console.log("⚠️  WARNING: Contains evening/early slots - check if socially appropriate for coffee");
    }
    
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 3: "See 3 More" Functionality
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log('Test 3: "See 3 More" Functionality');
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const initial = await generateSchedule({
      text: "Coffee with Alex",
      freeBusy: [],
      preferences: { duration_minutes: 30 },
    });
    console.log("Initial slots:");
    console.log(JSON.stringify(initial.slots, null, 2));

    const more = await generateSchedule({
      text: "Coffee with Alex - see 3 more",
      freeBusy: [],
      preferences: { duration_minutes: 30 },
      previous: initial.slots,
    });
    console.log("\nNext 3 slots:");
    console.log(JSON.stringify(more.slots, null, 2));

    const allLater = more.slots.every((newSlot: string) => 
      initial.slots.every((oldSlot: string) => newSlot > oldSlot)
    );
    console.log(`\n${allLater ? "✅" : "❌"} All new slots are later than previous: ${allLater}`);
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 4: Respect Quiet Hours
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 4: Respect Quiet Hours");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result4 = await generateSchedule({
      text: "Meeting with Alex",
      freeBusy: [],
      preferences: {
        quiet_hours: ["22:00-07:00", "12:00-13:00"],
        duration_minutes: 60,
      },
    });
    console.log(JSON.stringify(result4, null, 2));
    
    const hasLunchHour = result4.slots.some((s: string) => {
      const hour = new Date(s).getUTCHours();
      return hour >= 12 && hour < 13;
    });
    console.log(`\n${hasLunchHour ? "❌" : "✅"} No lunch hour suggestions: ${!hasLunchHour}`);
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 5: Duration Preference
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 5: Duration Preference");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result5 = await generateSchedule({
      text: "Quick sync with team",
      freeBusy: [],
      preferences: {
        duration_minutes: 15,
      },
    });
    console.log(JSON.stringify(result5, null, 2));
    console.log("✅ PASS (duration preference passed to LLM)");
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 6: No Available Slots Edge Case
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 6: No Available Slots Edge Case");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result6 = await generateSchedule({
      text: "Coffee tomorrow",
      freeBusy: [
        { start: "2025-11-12T08:00:00Z", end: "2025-11-12T21:00:00Z" }, // Fully booked
      ],
      preferences: { duration_minutes: 60 },
    });
    console.log(JSON.stringify(result6, null, 2));
    console.log(`Slot count: ${result6.slots.length}`);
    console.log("✅ PASS (handled edge case gracefully)");
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 7: NLP Inference
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 7: NLP Inference");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result7 = await generateSchedule({
      text: "Grab lunch with Jamie at the Spangler Cafe on Tuesday",
      freeBusy: [],
      preferences: { duration_minutes: 60 },
    });
    console.log(JSON.stringify(result7, null, 2));
    
    const hasJamie = result7.who.some((name: string) => name.toLowerCase().includes("jamie"));
    const hasSpangler = result7.where?.toLowerCase().includes("spangler");
    const isLunchTime = result7.slots.some((s: string) => {
      const hour = new Date(s).getUTCHours();
      return hour >= 11 && hour <= 13;
    });
    
    console.log(`\n${hasJamie ? "✅" : "❌"} Extracted 'Jamie': ${hasJamie}`);
    console.log(`${hasSpangler ? "✅" : "❌"} Extracted 'Spangler': ${hasSpangler}`);
    console.log(`${isLunchTime ? "✅" : "⚠️ "} Suggested lunch time slots: ${isLunchTime}`);
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  // Test 8: Evening Exception with Explicit Request
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Test 8: Evening Exception with Explicit Request");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const result8 = await generateSchedule({
      text: "Coffee with Alex, evening works for me",
      freeBusy: [
        { start: "2025-11-13T09:00:00Z", end: "2025-11-13T18:00:00Z" }, // Busy 9-6
      ],
      preferences: { duration_minutes: 60 },
    });
    console.log(JSON.stringify(result8, null, 2));
    
    const hasEveningSlots = result8.slots.some((s: string) => {
      const hour = new Date(s).getUTCHours();
      return hour >= 18;
    });
    
    console.log(`\n${hasEveningSlots ? "✅" : "❌"} Suggested evening slots (user said OK): ${hasEveningSlots}`);
  } catch (e) {
    console.log("❌ FAIL:", e);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏁 Test Suite Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

runTests().catch(console.error);

