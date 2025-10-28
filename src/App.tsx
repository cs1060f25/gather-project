import { useEffect, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import SceneIntent from './components/SceneIntent'
import SceneConversation from './components/SceneConversation'
import SceneIntelligence from './components/SceneIntelligence'
import SceneWidget from './components/SceneWidget'
import SceneMagic from './components/SceneMagic'
import WorkflowSummary from './components/WorkflowSummary'
import VisualWorkflow from './components/VisualWorkflow'

export default function App() {
  // Check URL for different modes
  const [showSummary] = useState(window.location.search.includes('summary'))
  const [showVisual] = useState(window.location.search.includes('visual'))

  if (showSummary) {
    return <WorkflowSummary />
  }
  
  if (showVisual) {
    return <VisualWorkflow />
  }
  const [, setGlobalProgress] = useState(0)
  
  // Create motion values for each scene
  const scene1Progress = useMotionValue(0)
  const scene2Progress = useMotionValue(0)
  const scene3Progress = useMotionValue(0)
  const scene4Progress = useMotionValue(0)
  const scene5Progress = useMotionValue(0)

  useEffect(() => {
    // Auto-play timeline - total duration 25 seconds
    const totalDuration = 25000 // 25 seconds
    
    const startTime = Date.now()
    
    const animationLoop = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / totalDuration, 1)
      
      setGlobalProgress(progress)
      
      // Calculate individual scene progress
      const sceneIndex = Math.floor(progress * 5)
      const sceneProgress = (progress * 5) % 1
      
      // Reset all scenes
      scene1Progress.set(0)
      scene2Progress.set(0)
      scene3Progress.set(0)
      scene4Progress.set(0)
      scene5Progress.set(0)
      
      // Set current scene progress
      if (sceneIndex === 0) scene1Progress.set(sceneProgress)
      else if (sceneIndex === 1) scene2Progress.set(sceneProgress)
      else if (sceneIndex === 2) scene3Progress.set(sceneProgress)
      else if (sceneIndex === 3) scene4Progress.set(sceneProgress)
      else if (sceneIndex === 4) scene5Progress.set(sceneProgress)
      
      // Keep previous scenes at 100% if we've passed them
      if (sceneIndex > 0) scene1Progress.set(1)
      if (sceneIndex > 1) scene2Progress.set(1)
      if (sceneIndex > 2) scene3Progress.set(1)
      if (sceneIndex > 3) scene4Progress.set(1)
      if (sceneIndex > 4) scene5Progress.set(1)
      
      if (progress < 1) {
        requestAnimationFrame(animationLoop)
      }
    }
    
    // Start after a brief delay
    const timeout = setTimeout(() => {
      requestAnimationFrame(animationLoop)
    }, 1000)
    
    return () => clearTimeout(timeout)
  }, [scene1Progress, scene2Progress, scene3Progress, scene4Progress, scene5Progress])

  return (
    <div className="relative min-h-screen bg-[#f8f9fb] overflow-hidden">
      {/* Ambient gradient background */}
      <motion.div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 gradient-glow" />
        <div className="absolute top-20 left-20 w-96 h-96 gradient-orb blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-40 right-20 w-[500px] h-[500px] gradient-orb blur-3xl animate-pulse-soft" 
             style={{ animationDelay: '1.5s' }} />
      </motion.div>

      {/* All scenes render simultaneously, controlled by individual progress */}
      <SceneIntent progress={scene1Progress} />
      <SceneConversation progress={scene2Progress} />
      <SceneIntelligence progress={scene3Progress} />
      <SceneWidget progress={scene4Progress} />
      <SceneMagic progress={scene5Progress} />
      
      {/* Toggle Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
        <motion.button
          className="bg-white/80 backdrop-blur-xl rounded-full p-3 shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-300"
          onClick={() => window.location.href = '?visual'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          title="Visual Workflow"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </motion.button>
        
        <motion.button
          className="bg-white/80 backdrop-blur-xl rounded-full p-3 shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-300"
          onClick={() => window.location.href = '?summary'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          title="Summary Slide"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}
