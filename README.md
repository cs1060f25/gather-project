# 🤖 Gatherly - Smart Scheduling Demo

An ultra-realistic, auto-playing product demo showcasing Gatherly, an intelligent scheduling agent that coordinates lunch meetings between users through iMessage with automatic calendar integration.

## ✨ Features

- **5 Cinematic Scenes**: Auto-playing storytelling with Apple-grade animations (25 seconds total)
- **Liquid Glass UI**: Glassmorphism effects with backdrop blur and translucency
- **iMessage Integration**: Realistic chat interface with live typing animations
- **Smart Calendar Sync**: Visual representation of AI-powered scheduling intelligence
- **iOS-Native Widgets**: Calendar cards that feel native to iOS
- **Location Suggestions**: AI recommends meeting places (Joe's Pizza in Harvard Square)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- Modern browser with support for CSS backdrop-filter

### Installation

1. Clone or navigate to the project directory:
```bash
cd /Users/milannaropanth/october14
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open your browser and navigate to:
```
http://localhost:5173          # Full interactive demo
http://localhost:5173/?visual  # Clean UI workflow (great for screenshots!)
http://localhost:5173/?summary # Presentation summary slide
```

## 🎬 Demo Experience

### Auto-Play Narrative

The demo **automatically plays** when you visit the website - no scrolling required! Watch the complete story unfold:

1. **Intent** - John types his lunch request to Gatherly: "I want to meet with Ikenna this week for lunch. Find me a time."
2. **Conversation** - Ikenna receives a message from Gatherly with lunch time options and location suggestion (Joe's Pizza)
3. **Intelligence** - AI visualization showing Gatherly analyzing both calendars in real-time
4. **Widget** - iOS-native calendar widget confirming the lunch meeting
5. **Magic** - Dual calendar view showing the synchronized lunch appointment

### Experience Tips

- **Total Duration**: 25 seconds (5 seconds per scene)
- **Auto-start**: Demo begins 1 second after page load
- **No Interaction Required**: Sit back and enjoy the cinematic experience
- **Best viewed on desktop** (1440px width) or larger screens

## 🛠 Tech Stack

- **React 18** with TypeScript
- **Framer Motion** for time-based auto-play animations
- **Tailwind CSS** for styling
- **Vite** for blazing-fast development

## 📱 Design System

### Colors
- System Blue: `#007AFF`
- Glass Effect: `rgba(255, 255, 255, 0.72)`
- Background: `#f8f9fb`

### Typography
- SF Pro Display (headings)
- SF Pro Text (body)
- System font stack fallbacks

### Effects
- Glassmorphism with `backdrop-blur-xl`
- Subtle shadows and borders
- Spring-based animations
- Parallax depth layers

## 🎨 Customization

### Adjusting Animation Speed

Edit scroll ranges in `App.tsx`:
```typescript
const getSceneProgress = (index: number): MotionValue<number> => {
  const start = index * 0.2  // Adjust these values
  const end = (index + 1) * 0.2
  return useTransform(scrollYProgress, [start, end], [0, 1])
}
```

### Modifying Glass Effects

Update Tailwind config or component styles:
```css
.glass-panel {
  @apply bg-glass backdrop-blur-xl rounded-2xl 
         border border-white/20 shadow-glass;
}
```

## 📦 Build for Production

```bash
npm run build
# Preview the production build
npm run preview
```

## 🎯 Performance

- Optimized for 60fps animations
- Lazy loading of heavy animations
- GPU-accelerated transforms
- Efficient scroll listeners with Framer Motion

## 🍎 Apple Design Principles

This demo follows Apple's design philosophy:
- **Clarity**: Clean, focused interface
- **Deference**: Content-first approach
- **Depth**: Layered visual hierarchy
- **Simplicity**: Intuitive interactions
- **Consistency**: Native iOS patterns

## 📄 License

This is a demonstration project showcasing modern web capabilities.

---

**Experience it live:** [http://localhost:5173](http://localhost:5173)

**Narrative**: Watch John request a lunch meeting with Ikenna through Gatherly's intelligent scheduling system, featuring real-time calendar analysis, location suggestions, and seamless iMessage integration.

Built with precision and attention to detail, featuring Apple-grade animations and UX patterns. ✨
