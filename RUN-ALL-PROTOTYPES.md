# 🚀 Run All Gatherly Prototypes - Quick Start Guide

This guide shows you how to run all 4 Gatherly prototypes locally for screenshots and demonstrations.

## 📋 Quick Reference Table

| Proto | Type | Port/URL | Start Command | Branch |
|-------|------|----------|---------------|--------|
| **Proto1** | Python CLI | Terminal | `python3 proto1-cli.py` | `proto1-cli` |
| **Proto2** | Flask Web | http://localhost:5001 | `python3 proto2-flask/app.py` | `proto2-flask` (coming) |
| **Proto3** | React Static | http://localhost:5173 | `cd proto3-react && npm run dev` | `proto3-react` (coming) |
| **Proto4** | Framer Motion | https://proto4-framer-motion.vercel.app | Live on Vercel ✅ | `proto4-framer-motion` |

---

## 🐍 Proto1-CLI: Terminal Scheduler

### Quick Start
```bash
cd /Users/milannaropanth/october14
python3 proto1-cli.py
```

### Demo Flow
```
When prompted, enter:
Person 1 name: John
Person 2 name: Ikenna
Preferred date (YYYY-MM-DD): 2024-03-14
Select time slot (1-6): 4
```

### Screenshot
Take terminal screenshot showing the cold, technical prompts and output.

**Key Learning**: Automation without interaction feels cold ❌

---

## 🌐 Proto2-Flask: Web Form Scheduler

### Quick Start
```bash
cd /Users/milannaropanth/october14/proto2-flask

# Install dependencies (first time only)
pip install -r requirements.txt

# Run the app
python3 app.py
```

### Open Browser
**http://localhost:5001**

### Demo Flow
1. Click "Start Scheduling"
2. Fill form:
   - Person 1: John
   - Person 2: Ikenna
   - Date: Any date
   - Time: 1:00 PM
   - Location: Joe's Pizza, Harvard Square
3. Submit and see confirmation

### Screenshots
- Home page
- Schedule form
- Confirmation page
- Events list

**Key Learning**: Forms can't represent natural conversation ❌

---

## ⚛️ Proto3-React: Static Mockup

### Quick Start
```bash
cd /Users/milannaropanth/october14/proto3-react

# Install dependencies (first time only)
npm install
# or: yarn install
# or: pnpm install

# Run dev server
npm run dev
```

### Open Browser
**http://localhost:5173**

### What You'll See
- iMessage-style chat (static, no clicks work)
- Time selection cards (look interactive but aren't)
- Calendar view (hardcoded highlighting)
- Warning explaining limitations

### Screenshots
- Full page view
- Chat mockup close-up
- Calendar section
- Limitations notice

**Key Learning**: Visuals alone don't express intent - needs motion ❌

---

## 🎬 Proto4-Framer-Motion: The Success

### Already Live! ✅
**https://proto4-framer-motion.vercel.app**

### Three Viewing Modes
1. **Full Demo**: `https://proto4-framer-motion.vercel.app/`
2. **Visual Workflow**: `https://proto4-framer-motion.vercel.app/?visual`
3. **Summary Slide**: `https://proto4-framer-motion.vercel.app/?summary`

### What Works
- ✅ Auto-playing cinematic animation
- ✅ iMessage-style conversation
- ✅ Visual calendar integration
- ✅ Location suggestions
- ✅ Smooth transitions and motion
- ✅ Feels human and collaborative

**Key Learning**: Conversation + visuals + motion = natural scheduling ✅

---

## 📸 Screenshot Strategy for HW6

### Individual Screenshots

**Proto1 (Terminal)**
```bash
python3 proto1-cli.py
# Screenshot: Shows sterile command-line interface
```

**Proto2 (Flask)**
```bash
python3 proto2-flask/app.py
# Visit: http://localhost:5001
# Screenshot: Form-based scheduling page
```

**Proto3 (React)**
```bash
cd proto3-react && npm run dev
# Visit: http://localhost:5173
# Screenshot: Static mockup with warning
```

**Proto4 (Live)**
```
Visit: https://proto4-framer-motion.vercel.app
Screenshot: Auto-playing interactive demo
```

### Comparison Screenshot

Create a 4-panel comparison showing the evolution:

```
┌─────────────────────────────────────────────────────┐
│         Evolution of Gatherly Prototypes            │
├──────────────┬──────────────┬──────────────┬────────┤
│   Proto1     │   Proto2     │   Proto3     │ Proto4 │
│              │              │              │        │
│  [Terminal]  │  [Web Form]  │  [Static UI] │ [Live] │
│              │              │              │        │
│ ❌ Cold/Tech │ ❌ Transactional│ ❌ Lifeless │ ✅ Living│
└──────────────┴──────────────┴──────────────┴────────┘
```

---

## 🏃 Running Everything at Once

### Terminal 1: Proto1 (when needed)
```bash
python3 proto1-cli.py
```

### Terminal 2: Proto2 Flask
```bash
python3 proto2-flask/app.py
# Runs on port 5001
```

### Terminal 3: Proto3 React
```bash
cd proto3-react && npm run dev
# Runs on port 5173
```

### Browser: Proto4 (already deployed)
```
https://proto4-framer-motion.vercel.app
```

**All 4 prototypes running simultaneously!** ✨

---

## 📝 For Your Google Doc Notebook

### Entry Template

For each prototype, copy this structure:

```markdown
**Branch:** [link]
**Linear Issue:** GATHER-X
**Deployment:** [URL or "N/A (local)"]

**Description / Reflection:**
[What you built and why it failed - see individual READMEs]

**Cursor / AI Prompts Used:**
• "Prompt 1"
• "Prompt 2"
```

---

## 🔗 Linear Subissues to Create

Create these 4 subissues under your main GATHER feature:

1. **GATHER-7**: CLI Scheduler Prototype (Failure)
2. **GATHER-8**: Flask Form Prototype (Failure) 
3. **GATHER-9**: Static React Mock Prototype (Failure)
4. **GATHER-10**: Framer Motion Prototype (Success) ✅

---

## ⚡ Troubleshooting

### Proto1: Python not found
```bash
python3 --version  # Check if installed
# On Windows: python --version
```

### Proto2: Flask not installed
```bash
pip install Flask
# or: pip3 install Flask
```

### Proto3: npm not found
```bash
node --version  # Check Node.js installed
npm --version   # Check npm installed
```

### Port Already in Use
```bash
# Find and kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

---

## 🎯 Success Checklist

Before submitting HW6, verify:

- [ ] Proto1 CLI runs in terminal
- [ ] Proto2 Flask runs on localhost:5001
- [ ] Proto3 React runs on localhost:5173
- [ ] Proto4 accessible at Vercel URL
- [ ] Screenshots taken of all 4
- [ ] All branches pushed to GitHub
- [ ] Linear issues created and linked
- [ ] Google Doc entries complete with reflections
- [ ] Cursor/AI prompts documented

---

## 📚 Additional Resources

- **Proto1 README**: `PROTO1-README.md`
- **Proto2 README**: `proto2-flask/README.md`
- **Proto3 README**: `proto3-react/README.md`
- **Proto4 Info**: Main `README.md`
- **Overall Guide**: `PROTOTYPES-GUIDE.md`

---

**Current Status:**
- ✅ Proto1 complete and committed
- ⏳ Proto2 code ready (need branch/push)
- ⏳ Proto3 code ready (need branch/push)
- ✅ Proto4 deployed and live

**Next Steps:** Create branches for Proto2 and Proto3, then push all to GitHub!
