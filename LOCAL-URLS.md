# 🔗 Local URLs - All Prototypes Running

All 4 Gatherly prototypes are ready for screenshots!

## 📍 Active URLs

### Proto1-CLI (Terminal)
```bash
cd /Users/milannaropanth/october14
python3 proto1-cli.py
```
**Interface:** Terminal window  
**Status:** ✅ Ready - Run command above

---

### Proto2-Flask (Web Form)
**URL:** http://localhost:5001  
**Status:** ✅ Running - Flask server active

**Pages to Screenshot:**
- Home: http://localhost:5001/
- Schedule Form: http://localhost:5001/schedule
- Events List: http://localhost:5001/events
- Confirmation: (appears after form submission)

---

### Proto3-React (Static Mockup)
**URL:** http://localhost:5174  
**Status:** ✅ Running - Vite dev server active

**What to Screenshot:**
- Full page view showing static mockup
- Warning banner at top
- iMessage-style chat (non-interactive)
- Calendar view (hardcoded)
- Red limitations box at bottom

---

### Proto4-Framer-Motion (Success!)
**URL:** https://proto4-framer-motion.vercel.app  
**Status:** ✅ Live - Deployed on Vercel

**Three Modes:**
1. Full Demo: https://proto4-framer-motion.vercel.app/
2. Visual Workflow: https://proto4-framer-motion.vercel.app/?visual  
3. Summary Slide: https://proto4-framer-motion.vercel.app/?summary

---

## 📸 Screenshot Checklist

### Proto1 Screenshots
- [ ] Terminal showing prompts
- [ ] Error handling (try entering bad date)
- [ ] Final confirmation output
- [ ] "Session terminated" message

### Proto2 Screenshots
- [ ] Home page with "Start Scheduling" button
- [ ] Empty form with all fields
- [ ] Form with data filled in
- [ ] Confirmation page after submission
- [ ] Events list view

### Proto3 Screenshots
- [ ] Full page with warning banner
- [ ] Static chat interface zoom-in
- [ ] Static calendar with day 14 highlighted
- [ ] Red limitations box
- [ ] Overall lifeless feel

### Proto4 Screenshots
- [ ] Auto-playing demo (maybe screen recording)
- [ ] Visual workflow (?visual) for clean 4-panel view
- [ ] Summary slide (?summary) for presentations
- [ ] iMessage conversation close-up
- [ ] Calendar confirmation widget

---

## 🎯 Quick Test Commands

### Check All Services
```bash
# Check Proto2 Flask
curl http://localhost:5001

# Check Proto3 React
curl http://localhost:5174

# Check Proto4 Vercel
curl https://proto4-framer-motion.vercel.app
```

### Stop Services
```bash
# Stop Proto2 Flask
lsof -ti:5001 | xargs kill -9

# Stop Proto3 React
lsof -ti:5174 | xargs kill -9
```

---

## 🎨 Screenshot Tips

### For Best Quality
1. **Use browser DevTools** to set consistent viewport size
2. **Disable browser chrome** (F11 fullscreen or screenshot tools)
3. **Consistent timing** - Let Proto4 animations complete before screenshot
4. **High resolution** - Use Retina/4K display if available
5. **Clean background** - Close other tabs/windows

### Recommended Tools
- **macOS**: Cmd+Shift+4 (select area) or Cmd+Shift+5 (screenshot tool)
- **Windows**: Win+Shift+S (Snipping Tool)
- **Browser**: DevTools responsive design mode for consistent sizes
- **Screen Recording**: QuickTime (macOS) or OBS for Proto4 demo

---

## 📝 Next Steps

1. ✅ Proto1 committed to `proto1-cli` branch
2. ⏳ Take screenshots of Proto2 (http://localhost:5001)
3. ⏳ Take screenshots of Proto3 (http://localhost:5174)
4. ⏳ Create `proto2-flask` branch and push
5. ⏳ Create `proto3-react` branch and push
6. ✅ Proto4 already deployed and live

**Once you've taken screenshots, I can help push Proto2 and Proto3 to GitHub!**

