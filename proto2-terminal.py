#!/usr/bin/env python3
"""
Gatherly Proto2-Terminal: Conversational Terminal Simulator
Attempts to be "conversational" but still limited by terminal constraints.
This prototype shows that text-based conversation alone isn't enough.
"""

import sys
import time
from datetime import datetime

def typing_effect(text, delay=0.03):
    """Simulate typing for a more 'conversational' feel"""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def print_message(sender, message, delay=0.02):
    """Print a message with sender label"""
    if sender == "Gatherly":
        print(f"\n💬 {sender}: ", end="")
    else:
        print(f"\n👤 {sender}: ", end="")
    typing_effect(message, delay)
    time.sleep(0.3)

def main():
    print("\n" + "=" * 60)
    print(" " * 15 + "GATHERLY - Smart Scheduling")
    print("=" * 60 + "\n")
    
    time.sleep(0.5)
    
    print_message("Gatherly", "Hi! I'm Gatherly, your scheduling assistant. 👋")
    print_message("Gatherly", "I can help you schedule lunch meetings.")
    
    # Get first name
    print("\n👤 You: ", end="")
    user_input = input().strip()
    
    if not user_input:
        user_input = "I want to schedule lunch with Ikenna"
    
    time.sleep(0.5)
    print_message("Gatherly", "Great! Let me help you with that.")
    
    # Extract or ask for second person
    if "with" in user_input.lower():
        # Try to extract name
        parts = user_input.lower().split("with")
        if len(parts) > 1:
            name2 = parts[1].strip().split()[0].capitalize()
            print_message("Gatherly", f"So you want to meet with {name2}. Got it!")
        else:
            name2 = "your contact"
    else:
        print_message("Gatherly", "Who would you like to meet with?")
        print("\n👤 You: ", end="")
        name2 = input().strip().capitalize()
    
    time.sleep(0.5)
    print_message("Gatherly", "Let me check both calendars...")
    
    # Simulate "thinking"
    print("\n🔄 ", end="")
    for i in range(3):
        sys.stdout.write(". ")
        sys.stdout.flush()
        time.sleep(0.5)
    print()
    
    time.sleep(0.5)
    print_message("Gatherly", "I found some times that work for both of you:")
    
    # Show time options
    print("\n📅 Available Times:")
    print("-" * 60)
    options = [
        "Tuesday, March 12 at 12:30 PM",
        "Wednesday, March 13 at 1:00 PM", 
        "Thursday, March 14 at 1:00 PM (Recommended)",
        "Friday, March 15 at 12:00 PM"
    ]
    
    for i, option in enumerate(options, 1):
        print(f"  {i}. {option}")
    print("-" * 60)
    
    # Get selection
    print_message("Gatherly", "Which time works best? (Enter 1-4)")
    print("\n👤 You: ", end="")
    
    while True:
        try:
            choice = input().strip()
            if not choice:
                choice = "3"
            slot = int(choice)
            if 1 <= slot <= 4:
                break
            print("\n💬 Gatherly: ", end="")
            typing_effect("Please enter a number between 1 and 4.")
            print("\n👤 You: ", end="")
        except ValueError:
            print("\n💬 Gatherly: ", end="")
            typing_effect("Please enter a number between 1 and 4.")
            print("\n👤 You: ", end="")
    
    selected_time = options[slot - 1]
    
    time.sleep(0.5)
    print_message("Gatherly", f"Perfect! I'll book {selected_time}.")
    
    time.sleep(0.5)
    print_message("Gatherly", "Should I suggest a location for lunch?")
    print("\n👤 You: ", end="")
    location_response = input().strip().lower()
    
    if not location_response or location_response in ['yes', 'y', 'sure', 'ok']:
        time.sleep(0.5)
        print_message("Gatherly", "How about Joe's Pizza in Harvard Square?")
        print_message("Gatherly", "It's got great reviews and is convenient for both of you!")
        location = "Joe's Pizza, Harvard Square"
    else:
        location = "[To be decided]"
    
    # Final confirmation
    print("\n" + "=" * 60)
    print(" " * 20 + "✅ MEETING CONFIRMED")
    print("=" * 60)
    print(f"\n  👥 Attendees: You & {name2}")
    print(f"  📅 When: {selected_time}")
    print(f"  📍 Where: {location}")
    print("\n" + "=" * 60)
    
    time.sleep(0.5)
    print_message("Gatherly", "All set! I'll send calendar invites to both of you.")
    print_message("Gatherly", "Have a great lunch! 🍕")
    
    print("\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n💬 Gatherly: No problem! Feel free to come back anytime.\n")
        sys.exit(0)

