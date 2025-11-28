import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingCard from '../components/onboarding/OnboardingCard'
import StepIndicator from '../components/onboarding/StepIndicator'
import SignupForm from '../components/onboarding/SignupForm'
import CalendarConnect from '../components/onboarding/CalendarConnect'
import PreferencesForm from '../components/onboarding/PreferencesForm'
import ErrorMessage from '../components/common/ErrorMessage'

const ONBOARDING_STEPS = [
  {
    title: 'Create Account',
    description: 'First, let\'s set up your Gatherly account'
  },
  {
    title: 'Connect Calendar',
    description: 'Connect your Google Calendar to enable scheduling'
  },
  {
    title: 'Set Preferences',
    description: 'Configure your scheduling preferences'
  }
];

export default function Onboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Step 1: Sign Up
  const handleSignup = async (data: { name: string; email: string; password: string }) => {
    setIsLoading(true)
    try {
      // TODO: Call backend to create account
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setCurrentStep(1)
    } catch (error) {
      console.error('Signup failed:', error)
      setError('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Google Calendar
  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      // TODO: Call backend to get OAuth URL
      const response = await fetch('http://localhost:5000/api/auth/google/url')
      const { url } = await response.json()
      
      // Open Google OAuth in popup
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      const popup = window.open(
        url,
        'Connect Google Calendar',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Poll for completion
      const pollInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollInterval)
          setIsLoading(false)
          setCurrentStep(2)
        }
      }, 500)

    } catch (error) {
      console.error('Google Calendar connection failed:', error)
      setError('Failed to connect Google Calendar. Please try again.')
      setIsLoading(false)
    }
  }

  // Step 3: Preferences
  const handlePreferences = async (data: {
    workingHoursStart: string
    workingHoursEnd: string
    timezone: string
    defaultDuration: number
  }) => {
    setIsLoading(true)
    try {
      // TODO: Call backend to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      navigate('/')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingCard
      title="Welcome to Gatherly"
      description="Let's get your account set up to start scheduling meetings effortlessly."
    >
      <StepIndicator
        currentStep={currentStep}
        steps={ONBOARDING_STEPS}
      />

      {error && (
        <ErrorMessage
          message={error}
        />
      )}

      {/* Step 1: Sign Up */}
      {currentStep === 0 && (
        <SignupForm
          onSubmit={handleSignup}
          isLoading={isLoading}
        />
      )}

      {/* Step 2: Google Calendar */}
      {currentStep === 1 && (
        <CalendarConnect
          onConnect={handleGoogleAuth}
          isConnecting={isLoading}
        />
      )}

      {/* Step 3: Preferences */}
      {currentStep === 2 && (
        <PreferencesForm
          onSubmit={handlePreferences}
          isLoading={isLoading}
        />
      )}
    </OnboardingCard>
  )
}
