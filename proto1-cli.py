#!/usr/bin/env python3
"""
Gatherly Proto1-CLI: Basic Scheduling Assistant
A deliberately simple, sterile command-line interface for scheduling.
This prototype intentionally lacks warmth and conversational flow.
"""

import sys
from datetime import datetime, timedelta

def main():
    print("=" * 50)
    print("GATHERLY SCHEDULING ASSISTANT v0.1")
    print("=" * 50)
    print()
    
    # Get user input
    print("Enter scheduling details:")
    print("-" * 50)
    
    name1 = input("Person 1 name: ").strip()
    if not name1:
        print("ERROR: Name required")
        sys.exit(1)
    
    name2 = input("Person 2 name: ").strip()
    if not name2:
        print("ERROR: Name required")
        sys.exit(1)
    
    date_str = input("Preferred date (YYYY-MM-DD): ").strip()
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        print("ERROR: Invalid date format")
        sys.exit(1)
    
    print()
    print("-" * 50)
    print("PROCESSING REQUEST...")
    print("-" * 50)
    print()
    
    # Generate time slots (hardcoded, no actual intelligence)
    print(f"Scheduling lunch for: {name1} and {name2}")
    print(f"Date: {target_date.strftime('%A, %B %d, %Y')}")
    print()
    print("Available time slots:")
    print("-" * 50)
    
    # Just print some generic lunch times
    times = [
        ("11:30 AM", "Available"),
        ("12:00 PM", "Available"),
        ("12:30 PM", "Conflict detected"),
        ("1:00 PM", "Available"),
        ("1:30 PM", "Available"),
        ("2:00 PM", "Available")
    ]
    
    for i, (time, status) in enumerate(times, 1):
        status_marker = "[X]" if "Conflict" in status else "[ ]"
        print(f"{i}. {time:15} {status_marker} {status}")
    
    print()
    print("-" * 50)
    
    # Force user to pick a number
    while True:
        try:
            choice = input("Select time slot (1-6): ").strip()
            slot_num = int(choice)
            if 1 <= slot_num <= 6:
                if slot_num == 3:
                    print("ERROR: Selected time has conflict. Choose another.")
                    continue
                break
            else:
                print("ERROR: Invalid selection. Enter 1-6.")
        except ValueError:
            print("ERROR: Must enter a number.")
    
    selected_time = times[slot_num - 1][0]
    
    print()
    print("=" * 50)
    print("MEETING SCHEDULED")
    print("=" * 50)
    print(f"Participants: {name1}, {name2}")
    print(f"Date: {target_date.strftime('%Y-%m-%d')}")
    print(f"Time: {selected_time}")
    print(f"Location: [Not specified]")
    print("=" * 50)
    print()
    print("Calendar invite will be sent via email.")
    print("Session terminated.")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled.")
        sys.exit(0)

