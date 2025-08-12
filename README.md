Working Project Link (Netlify) : https://hostel-booking-app-booking.netlify.app/

Github Link: https://github.com/sweetysingh1609/hostel-booking-app

Google DOC: https://docs.google.com/document/d/1I31o6M7KareU2VxGhjTAWJCQMxaVHV7a1PQImGnYr8s/edit?usp=sharing



1. Project Overview
This is a Hostel Room Reservation Web App built in React, designed to simulate and manage room reservations with features like:
Booking 1–5 rooms at once.

Optimal room selection algorithm to minimize travel time.


Undo, Reset, Random Occupancy, and Export JSON features.


Interactive UI with Framer Motion animations.


The app is composed of:
UI logic (App.js) — manages state, user actions, and display.


Pure booking logic (bookingLogic.js) — implements selection algorithm.
2. Algorithmic Approach
2.1 Main Problem
Given:
A multi-floor hostel with rooms marked available, occupied, or booked.


A request to book k rooms (1 ≤ k ≤ 5).


Goal:
Prefer: Same-floor contiguous rooms (best for guest convenience).


Otherwise: Choose rooms that minimize combined vertical + horizontal travel time.



2.2 Algorithms Used
A. Same-Floor Contiguous Selection
Type: Sliding Window (Greedy + Minimal Span Search)
On a floor, rooms are represented by their index positions.


Sliding window of size k checks all possible contiguous segments.


Span = (max index − min index) → smallest span = best placement.


Why greedy works here: For same-floor selection, smallest contiguous span directly minimizes walking distance.


B. Multi-Floor Optimal Selection
Type: Exhaustive Search + Combinatorics
Uses compositions(k, n, maxPerFloor) to generate all ways of distributing k rooms across candidate floors (n = number of floors with available rooms).


For each distribution:


Picks the best contiguous block per floor using the same sliding window logic.


Calculates cost = travel time using calculateTravelTime():


Vertical cost: 2 × (maxFloor - minFloor)


Horizontal cost: sum of (max idx − min idx) per floor.


Keeps track of best overall combination.


This ensures globally optimal selection rather than greedy-only selection.
C. Fallback Greedy (Full Hotel)
Type: Global Sliding Window Across All Rooms
If exhaustive search fails (edge cases with scattered availability),


Sort all available rooms by (floor, index),


Run a sliding window of size k over the entire list,


Choose the set with the smallest travel time.



2.3 Additional Logic
Random Occupancy Generator:


Shuffles available rooms (Fisher–Yates shuffle).


Occupies a percentage p of them randomly.


Undo Functionality:


Maintains a history stack (historyRef) with actions (random, toggle, booking).


Reverts the last change based on action type.


Export Booking:


Collects all booked rooms and travel time into a JSON file.



3. UI & State Management
React Hooks Used:


useMemo: For hotel model + initial map (performance).


useState: For tracking roomMap, booking count, last booking, etc.


useRef: For undo history storage (avoids re-renders).


Accessibility:


aria-label for screen readers.


Keyboard navigation via onKeyDown.


Animations:


Framer Motion for hover/tap effects & modal transitions.



4. Booking Priority Rules
Rule 1: Same floor, contiguous block of rooms.


Rule 2: If not possible, minimize combined travel distance across multiple floors.


Rule 3: If no optimal found, use greedy fallback.



5. Deployment Links
Working App: [Your Deployed Link Here]


Source Code Repository: [Your GitHub Link Here]


Google Doc: (this document link)



6. File Structure


/src
  App.js              # Main UI & interaction logic
  bookingLogic.js     # Pure algorithms for room selection & travel time
  styles.css          # Styling

🚀 How to Run Locally
git clone https://github.com/sweetysingh1609/hostel-booking-app.git
cd hostel-booking-app

npm install

npm start


