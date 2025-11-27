// Debug lunch timing test
import dotenv from 'dotenv';
import { generateSchedule } from "./index.js";

// Load environment variables
dotenv.config({ path: '../../.env' });

async function debugLunchTest() {
  console.log("🔍 Debugging Lunch Timing Test\n");
  
  try {
    const result = await generateSchedule({
      text: "Grab lunch with Jamie at the Spangler Cafe on Tuesday",
      freeBusy: [],
      preferences: { duration_minutes: 60 },
    });
    
    console.log("Result:");
    console.log(JSON.stringify(result, null, 2));
    
    console.log("\n🕐 Analyzing slot times:");
    result.slots.forEach((slot, index) => {
      const date = new Date(slot);
      const hour = date.getUTCHours();
      const localTime = date.toLocaleString();
      console.log(`Slot ${index + 1}: ${slot} (UTC hour: ${hour}, Local: ${localTime})`);
    });
    
    const isLunchTime = result.slots.some(s => {
      const hour = new Date(s).getUTCHours();
      return hour >= 11 && hour <= 13; // 11AM-1PM UTC
    });
    
    console.log(`\n📊 Test validation:`);
    console.log(`- Lunch time slots (11AM-1PM UTC): ${isLunchTime}`);
    console.log(`- Expected: true (at least one slot should be 11AM-1PM UTC)`);
    
  } catch (e) {
    console.log("❌ ERROR:", e);
  }
}

debugLunchTest();
