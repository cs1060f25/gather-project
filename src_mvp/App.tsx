import React, { useState } from 'react'
import { SchedulingService } from './services/schedulingService'

function App() {
  const [view, setView] = useState('landing') // 'landing', 'signin', 'signup', 'success', 'onboarding', 'chat'
  const [step, setStep] = useState(0)
  const [isCalendarConnected, setIsCalendarConnected] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  
  const [messages, setMessages] = useState<Array<{
    id: number;
    type: 'user' | 'bot';
    text: string;
    slots?: string[];
    reviewCard?: {
      attendees: string[];
      duration: number;
      method: string;
      location?: string;
      constraints?: string;
      proposedSlots: string[];
    };
  }>>([
    { id: 1, type: 'bot', text: 'Hi! I\'m here to help you schedule meetings. Just tell me who you want to meet with and when!' }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [schedulingService] = useState(() => new SchedulingService())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 0) {
      setStep(1)
    } else if (step === 1 && isCalendarConnected) {
      setStep(2)
    } else if (step === 2) {
      setView('chat')
    }
  }

  const handleGoogleCalendar = () => {
    // Simulate Google OAuth flow
    setTimeout(() => {
      setIsCalendarConnected(true)
      alert('Google Calendar connected successfully!')
    }, 1000)
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Sign in successful!')
    setView('chat')
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setView('success')
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    // Add user message
    const userMessage = { id: Date.now(), type: 'user' as const, text: inputMessage }
    setMessages(prev => [...prev, userMessage])
    const currentInput = inputMessage
    setInputMessage('')
    setIsProcessing(true)

    try {
      // Use OpenAI service for proper extraction
      const response = await schedulingService.processSchedulingRequest(currentInput)
      
      if (response.status === 'complete' && response.reviewCard) {
        // Complete request - show review card
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot' as const,
          text: 'Perfect! I\'ve extracted the details from your request. Please review and confirm:',
          reviewCard: response.reviewCard
        }
        setMessages(prev => [...prev, botResponse])
      } else {
        // Missing details - ask for clarification
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot' as const,
          text: response.nextQuestion || 'I need more information to schedule your meeting.'
        }
        setMessages(prev => [...prev, botResponse])
      }
    } catch (error) {
      console.error('Error processing scheduling request:', error)
      // Fallback to simple response
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot' as const,
        text: 'I had trouble processing your request. Could you tell me who you want to meet with and when?'
      }
      setMessages(prev => [...prev, botResponse])
    }
    
    setIsProcessing(false)
  }

  const handleSlotSelection = (slot: string) => {
    const confirmMessage = {
      id: Date.now(),
      type: 'bot' as const,
      text: `Great! I'll send invitations for ${slot}. All attendees will receive an SMS with the meeting details.`
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const handleConfirmEvent = (reviewCard: any) => {
    const confirmMessage = {
      id: Date.now(),
      type: 'bot' as const,
      text: `Perfect! I've created your meeting and sent invitations to all attendees. They'll receive an SMS with the meeting details and can respond with their availability.`
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const handleEditEvent = () => {
    const editMessage = {
      id: Date.now(),
      type: 'bot' as const,
      text: `What would you like to change? You can tell me and I'll update the meeting details.`
    }
    setMessages(prev => [...prev, editMessage])
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Welcome to Gatherly</h1>
        
        {/* Step indicator - only show during onboarding */}
        {view === 'onboarding' && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              {['Account', 'Calendar', 'Preferences'].map((label, i) => (
                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: i <= step ? '#007AFF' : '#E5E5EA',
                    margin: '0 auto 8px'
                  }} />
                  <div style={{
                    fontSize: '12px',
                    color: i <= step ? '#007AFF' : '#999',
                    fontWeight: i === step ? '600' : '400'
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              height: '2px',
              backgroundColor: '#E5E5EA',
              borderRadius: '1px',
              marginBottom: '1rem'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#007AFF',
                borderRadius: '1px',
                width: `${((step + 1) / 3) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Landing Page */}
        {view === 'landing' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: '#666' }}>Schedule meetings effortlessly</h2>
            <div style={{ marginBottom: '2rem' }}>
              <button 
                onClick={() => setView('signup')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#007AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '12px',
                  cursor: 'pointer'
                }}
              >
                Sign Up
              </button>
              <button 
                onClick={() => setView('signin')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#007AFF',
                  border: '1px solid #007AFF',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Sign In Form */}
        {view === 'signin' && (
          <form onSubmit={handleSignIn}>
            <h2 style={{ marginBottom: '1rem' }}>Sign In</h2>
            <input 
              type="email" 
              placeholder="Email" 
              style={{ width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px' }}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              style={{ width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px' }}
              required
            />
            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                marginTop: '1rem',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => setView('landing')}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'transparent',
                color: '#666',
                border: 'none',
                fontSize: '14px',
                marginTop: '8px',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          </form>
        )}

        {/* Sign Up & Onboarding Flow */}
        {(view === 'signup' || view === 'onboarding') && (
          <form onSubmit={view === 'signup' ? handleSignUp : handleSubmit}>
          {(step === 0 || view === 'signup') && (
            <div>
              <h2>{view === 'signup' ? 'Create Account' : 'Account Details'}</h2>
              <input 
                type="text" 
                placeholder="Name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px' }}
                required
              />
              <input 
                type="email" 
                placeholder="Email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{ width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px' }}
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={{ width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px' }}
                required
              />
            </div>
          )}

          {step === 1 && view === 'onboarding' && (
            <div>
              <h2>Connect Calendar</h2>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Connect your Google Calendar to enable scheduling</p>
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem' }}>
                <p>📅 View your calendar</p>
                <p>✏️ Create events</p>
                <p>✉️ Send invitations</p>
              </div>
              
              {!isCalendarConnected ? (
                <button 
                  type="button"
                  onClick={handleGoogleCalendar}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🔗</span> Connect Google Calendar
                </button>
              ) : (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  color: '#155724'
                }}>
                  ✅ Google Calendar Connected
                </div>
              )}
            </div>
          )}

          {step === 2 && view === 'onboarding' && (
            <div>
              <h2>Set Preferences</h2>
              <label>Working Hours:</label>
              <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
                <input type="time" defaultValue="09:00" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="time" defaultValue="17:00" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <label>Default Duration:</label>
              <select style={{ width: '100%', padding: '8px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '4px' }}>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          )}

          <button 
            type="submit"
            disabled={step === 1 && !isCalendarConnected}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: (step === 1 && !isCalendarConnected) ? '#ccc' : '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              marginTop: '1rem',
              cursor: (step === 1 && !isCalendarConnected) ? 'not-allowed' : 'pointer'
            }}
          >
            {view === 'signup' ? 'Create Account' : 
             step === 2 ? 'Complete Setup' : 'Next'}
          </button>
          
          {view === 'signup' && (
            <button 
              type="button"
              onClick={() => setView('landing')}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'transparent',
                color: '#666',
                border: 'none',
                fontSize: '14px',
                marginTop: '8px',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          )}
        </form>
        )}

        {/* Success Page */}
        {view === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#34C759',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              fontSize: '40px'
            }}>
              ✅
            </div>
            
            <h2 style={{ color: '#34C759', marginBottom: '1rem' }}>Account Created Successfully!</h2>
            
            <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
              Welcome to Gatherly, {formData.name}! <br/>
              Let's finish setting up your account to start scheduling meetings.
            </p>
            
            <button 
              onClick={() => setView('onboarding')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Continue Setup
            </button>
          </div>
        )}

        {/* Chat Interface */}
        {view === 'chat' && (
          <div style={{ width: '100%', maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #E5E5EA',
              backgroundColor: 'white',
              borderRadius: '12px 12px 0 0'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Schedule a Meeting</h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>Tell me who you want to meet with and when</p>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {messages.map((message) => (
                <div key={message.id} style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: message.type === 'user' ? '#007AFF' : 'white',
                    color: message.type === 'user' ? 'white' : '#333',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {message.text}
                    
                    {/* Review Card */}
                    {message.reviewCard && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid #e9ecef'
                      }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '600' }}>Meeting Details</h4>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <strong>Attendees:</strong> {message.reviewCard.attendees.join(', ')}
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <strong>Duration:</strong> {message.reviewCard.duration} minutes
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <strong>Method:</strong> {message.reviewCard.method}
                          {message.reviewCard.location && ` at ${message.reviewCard.location}`}
                        </div>
                        
                        {message.reviewCard.constraints && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Preferences:</strong> {message.reviewCard.constraints}
                          </div>
                        )}
                        
                        <div style={{ marginBottom: '16px' }}>
                          <strong>Proposed Times:</strong>
                          <div style={{ marginTop: '8px' }}>
                            {message.reviewCard.proposedSlots.map((slot: string, i: number) => (
                              <div key={i} style={{
                                padding: '8px 12px',
                                margin: '4px 0',
                                backgroundColor: 'white',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                fontSize: '14px'
                              }}>
                                {slot}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleConfirmEvent(message.reviewCard)}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            ✓ Confirm & Send Invites
                          </button>
                          <button
                            onClick={handleEditEvent}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            ✏️ Edit Details
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Legacy slot selection (for backward compatibility) */}
                    {message.slots && !message.reviewCard && (
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ margin: '0 0 8px', fontWeight: '600', fontSize: '14px' }}>Suggested times:</p>
                        {message.slots.map((slot: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => handleSlotSelection(slot)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '8px 12px',
                              margin: '4px 0',
                              backgroundColor: message.type === 'user' ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: message.type === 'user' ? 'white' : '#333'
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '18px 18px 18px 4px',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #E5E5EA',
              backgroundColor: 'white',
              borderRadius: '0 0 12px 12px'
            }}>
              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="e.g., Schedule lunch with Sarah tomorrow at 1pm"
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #E5E5EA',
                    borderRadius: '20px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isProcessing}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: (!inputMessage.trim() || isProcessing) ? '#ccc' : '#007AFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: (!inputMessage.trim() || isProcessing) ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
