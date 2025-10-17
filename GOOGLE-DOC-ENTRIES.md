# 📝 Google Doc Entries for HW6 - Copy & Paste Ready

Copy these entries directly into your Design Notebook under appropriate headings.

---

## 🧱 Prototype 1 — CLI Scheduler (Failure)

**Branch:** [`proto1-cli`](https://github.com/cs1060f25/gather-project/tree/proto1-cli)  
**Linear Issue:** GATHER-7 — CLI Scheduler Prototype  
**Deployment:** N/A (local script)

**Description / Reflection:**

A quick **Python CLI** prototype that takes input like "schedule lunch with Ikenna" and prints possible times. It worked functionally but felt sterile and technical—nothing about it conveyed Gatherly's human or social intent. I learned that automation without interaction feels cold; the experience didn't scale beyond a basic shell script and lacked any sense of collaboration. It failed in user experience but clarified why Gatherly must feel conversational, not computational.

**Cursor / AI Prompts Used:**

* "Write a Python CLI that asks for two names and a date, then prints possible lunch times."
* "Simulate a scheduling assistant in the terminal using input() and print()."

---

## ⚙️ Prototype 2 — Flask Form (Failure)

**Branch:** [`proto2-flask`](https://github.com/cs1060f25/gather-project/tree/proto2-flask)  
**Linear Issue:** GATHER-8 — Flask Form Prototype  
**Deployment:** http://localhost:5001 (local)

**Description / Reflection:**

Built a quick **Flask + HTML form** where users enter two names and a date to "schedule lunch." It technically created events but felt detached—just filling out fields and pressing submit. I learned that a plain form can't represent natural scheduling conversation, and the static flow lacked personality. This failure showed how design language and interaction style matter more than backend correctness for Gatherly's vision.

**Cursor / AI Prompts Used:**

* "Build a minimal Flask web app with a form that collects two names and a date."
* "Return a generated event summary page after form submission."

---

## 💻 Prototype 3 — Static React Mock (Failure)

**Branch:** [`proto3-react`](https://github.com/cs1060f25/gather-project/tree/proto3-react)  
**Linear Issue:** GATHER-9 — Static React Mock Prototype  
**Deployment:** http://localhost:5173 (local) or [Netlify/Vercel if deployed]

**Description / Reflection:**

A **React-only static mock** showing screenshots of Gatherly's iMessage flow and calendars. It looked close to the final product but was lifeless—no interaction, no real intelligence. I learned that visuals alone don't express intent; without responsiveness or motion, the experience felt empty. This version helped me define what was missing before building the Framer Motion version.

**Cursor / AI Prompts Used:**

* "Build a React component that shows a chat mockup and static calendar layout."
* "Style it using TailwindCSS but keep everything hardcoded."

---

## 🎬 Prototype 4 — Framer Motion (Success) ✅

**Branch:** [`proto4-framer-motion`](https://github.com/cs1060f25/gather-project/tree/proto4-framer-motion)  
**Linear Issue:** GATHER-10 — Framer Motion Conversational Workflow  
**Deployment:** https://proto4-framer-motion.vercel.app

**Description / Reflection:**

Built a **scroll-driven, ultra-realistic Apple-style product demo** using React + Framer Motion + TailwindCSS that showcases Gatherly's intelligent scheduling workflow. The demo auto-plays a cinematic 25-second experience showing John requesting lunch with Ikenna through Gatherly, with iMessage-style conversations, AI calendar analysis, and automatic calendar integration. This prototype succeeded because it combined conversational UX with rich visual feedback, smooth animations, and realistic interactions. I learned that modern scheduling tools must feel human—blending natural conversation with visual intelligence in platforms users already use.

**Cursor / AI Prompts Used:**

* "Build a scroll-driven, ultra-realistic Apple-style product demo called 'Scheduling Invite Workflow', showing how an intelligent scheduling agent coordinates availability between a Host and Guest directly inside iMessage, with automatic calendar integration."
* "Make it auto-play without scrolling required, with John sending a request to Gatherly to meet with Ikenna for lunch."
* "Add location suggestions like Joe's Pizza in Harvard Square to the conversation flow."
* "Create a visual workflow summary showing just 4 UI states for clean screenshots."

---

## 📊 Summary Comparison Table (for your doc)

| Prototype | Interface | Key Failure | Learning |
|-----------|-----------|-------------|----------|
| **Proto1-CLI** | Terminal | Too technical, no warmth | Automation alone feels cold |
| **Proto2-Flask** | Web Form | Transactional, not conversational | Forms aren't natural for social coordination |
| **Proto3-React** | Static Mockup | No interactivity, lifeless | Visuals need motion to communicate intent |
| **Proto4-Framer** | Interactive Web | ✅ Success! | Conversation + visuals + motion works |

---

## 🎯 Linear Parent Issue Structure

### Main Feature: GATHER (parent issue)

**Title:** Gatherly - Intelligent Scheduling Agent

**Description:** Build an AI-powered scheduling assistant that coordinates lunch meetings through natural conversation in messaging apps.

**Subissues:**
- GATHER-7: CLI Scheduler Prototype (Failed)
- GATHER-8: Flask Form Prototype (Failed)
- GATHER-9: Static React Mock Prototype (Failed)
- GATHER-10: Framer Motion Prototype (Success)

---

## 📝 Individual Linear Subissue Templates

### GATHER-7: CLI Scheduler Prototype (Failure)

**Title:** CLI Scheduler Prototype (Failure)

**Description:** Simple Python CLI prototype exploring command-line interaction for scheduling. Demonstrated technical feasibility but poor UX.

**Test Plan:** Run locally, input "schedule lunch with Ikenna," observe printed results.

**Acceptance Criteria:**
- Branch name `proto1-cli` created
- Code pushed to repository
- Screenshot included in design notebook
- Reflection on why it failed documented

**Status:** ❌ Failed - Too technical and sterile

---

### GATHER-8: Flask Form Prototype (Failure)

**Title:** Flask Form Scheduler Prototype (Failure)

**Description:** Flask prototype testing form-based scheduling workflow. Functioned correctly but lacked conversational UX.

**Test Plan:** Run Flask app locally, submit form with test names, view generated event page.

**Acceptance Criteria:**
- Branch name `proto2-flask` created
- Flask app runs on localhost:5001
- Form submission creates event
- Screenshot showing form-based UX
- Reflection on transactional feel documented

**Status:** ❌ Failed - Too transactional, lacks personality

---

### GATHER-9: Static React Mock Prototype (Failure)

**Title:** Static React Mock Prototype (Failure)

**Description:** Static React mockup visualizing Gatherly's interface without interactivity. Looked accurate but lacked life and responsiveness.

**Test Plan:** Deploy to Vercel/Netlify or run locally, verify layout renders and matches design sketches.

**Acceptance Criteria:**
- Branch `proto3-react` created  
- React app runs on localhost:5173
- Visual design matches target aesthetic
- All components render correctly
- Screenshot showing static nature
- Reflection on lack of motion documented

**Status:** ❌ Failed - Lifeless without interaction

---

### GATHER-10: Framer Motion Prototype (Success)

**Title:** Framer Motion Conversational Workflow Prototype

**Description:** Full interactive demo with auto-playing animations, iMessage-style UI, calendar integration, and location suggestions. Successfully demonstrates Gatherly's vision.

**Test Plan:** 
- Visit deployed URL
- Verify auto-play animation works
- Test all 3 viewing modes (demo, visual, summary)
- Confirm public accessibility (no auth required)

**Acceptance Criteria:**
- Branch `proto4-framer-motion` created and pushed
- Deployed to Vercel with public URL
- All 5 scenes animate correctly
- iMessage UI renders properly
- Location suggestions display
- Calendar integration shown
- vercel-link.txt contains deployment URL
- Full documentation in README

**Status:** ✅ Success - Natural, engaging, demonstrates full vision

---

## 🎬 Demonstration Order for Presentations

1. **Show Proto1** (terminal) - "Started here - too technical"
2. **Show Proto2** (Flask) - "Tried web forms - too transactional"  
3. **Show Proto3** (static) - "Created mockups - looked good but lifeless"
4. **Show Proto4** (live demo) - "Finally got it right - conversation + visuals + motion"

This narrative shows your design iteration process and learning journey.

---

## 📦 Ready to Copy

All text above is formatted for direct copy-paste into:
- ✅ Google Doc design notebook
- ✅ Linear issue descriptions
- ✅ README files
- ✅ Presentation slides

**Every prototype is ready to run locally for screenshots!**

