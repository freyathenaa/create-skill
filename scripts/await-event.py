#!/usr/bin/env python3
import sys
import os
import time

def main():
    if len(sys.argv) < 2:
        print("Usage: await-event.py <events_file_path> [timeout_seconds]", file=sys.stderr)
        sys.exit(1)

    events_file = sys.argv[1]
    timeout = int(sys.argv[2]) if len(sys.argv) > 2 else 300 # Default 5 min

    # Get initial file size
    initial_size = 0
    if os.path.exists(events_file):
        initial_size = os.path.getsize(events_file)

    start_time = time.monotonic()
    
    while True:
        if time.monotonic() - start_time > timeout:
            print("Timeout waiting for event", file=sys.stderr)
            sys.exit(1)

        if os.path.exists(events_file):
            current_size = os.path.getsize(events_file)
            if current_size > initial_size:
                # File grew! Read the new line(s)
                with open(events_file, 'r') as f:
                    f.seek(initial_size)
                    new_content = f.read()
                    print(new_content.strip())
                sys.exit(0)
        
        time.sleep(0.5)

if __name__ == '__main__':
    main()
