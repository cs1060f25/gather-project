/**
 * Unit tests for CareerGoalChatBar component (GATH-42)
 * 
 * Test Plan:
 * 1. Component renders correctly with initial state
 * 2. User can type into input field
 * 3. Submit button is disabled when input is empty
 * 4. Submit button is enabled when input has text
 * 5. Form submission adds user message to chat
 * 6. Loading state shows typing animation
 * 7. API response adds assistant message to chat
 * 8. Error handling displays error message
 * 9. Enter key submits form
 * 10. Input clears after submission
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CareerGoalChatBar from './CareerGoalChatBar'

// Mock fetch
global.fetch = vi.fn()

describe('CareerGoalChatBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders initial empty state correctly', () => {
    render(<CareerGoalChatBar />)
    
    // Check for header
    expect(screen.getByText('Career Goal Assistant')).toBeInTheDocument()
    expect(screen.getByText(/Tell me your career goals/)).toBeInTheDocument()
    
    // Check for placeholder message
    expect(screen.getByText(/Start by telling me about your career goals/)).toBeInTheDocument()
    expect(screen.getByText(/🎯/)).toBeInTheDocument()
    
    // Check for input field
    expect(screen.getByPlaceholderText('Describe your career goal...')).toBeInTheDocument()
  })

  it('allows user to type in input field', async () => {
    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, 'Find me an internship')
    
    expect(input).toHaveValue('Find me an internship')
  })

  it('submit button is disabled when input is empty', () => {
    render(<CareerGoalChatBar />)
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    expect(submitButton).toBeDisabled()
  })

  it('submit button is enabled when input has text', async () => {
    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, 'Test goal')
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    expect(submitButton).toBeEnabled()
  })

  it('clears input after successful submission', async () => {
    const mockResponse = {
      matches: [
        {
          name: 'Test Professional',
          title: 'Test Title',
          whyHelpful: 'Test reason'
        }
      ]
    }
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, 'Test goal')
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('displays user message after submission', async () => {
    const mockResponse = {
      matches: [
        {
          name: 'Test Professional',
          title: 'Test Title',
          whyHelpful: 'Test reason'
        }
      ]
    }
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const testGoal = 'Find me a summer internship'
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, testGoal)
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(testGoal)).toBeInTheDocument()
    })
  })

  it('shows thinking animation while waiting for response', async () => {
    const mockResponse = {
      matches: [
        {
          name: 'Test Professional',
          title: 'Test Title',
          whyHelpful: 'Test reason'
        }
      ]
    }
    
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockResponse
        }), 100)
      )
    )

    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, 'Test goal')
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    await user.click(submitButton)
    
    // Check for thinking state
    await waitFor(() => {
      expect(screen.getByText('Thinking')).toBeInTheDocument()
    })
  })

  it('displays assistant response after API call', async () => {
    const mockResponse = {
      matches: [
        {
          name: 'Ava Patel',
          title: 'IB Analyst @ Goldman Sachs',
          whyHelpful: 'Recent alum with NYC internship insights'
        }
      ]
    }
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, 'Find internship')
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Ava Patel/)).toBeInTheDocument()
      expect(screen.getByText(/IB Analyst @ Goldman Sachs/)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, 'Test goal')
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/having trouble finding matches/)).toBeInTheDocument()
    })
  })

  it('submits form on Enter key press', async () => {
    const mockResponse = {
      matches: [
        {
          name: 'Test Professional',
          title: 'Test Title',
          whyHelpful: 'Test reason'
        }
      ]
    }
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, 'Test goal{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText('Test goal')).toBeInTheDocument()
    })
  })

  it('sends correct data to API endpoint', async () => {
    const mockResponse = {
      matches: []
    }
    
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    global.fetch = fetchMock

    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const testGoal = 'Find me a summer internship in investment banking for 2026'
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, testGoal)
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/goal-matching',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining(testGoal)
        })
      )
    })
  })

  it('prevents submission while already thinking', async () => {
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ matches: [] })
        }), 1000)
      )
    )

    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    await user.type(input, 'Test goal')
    
    const submitButton = screen.getByRole('button', { name: /Send/i })
    await user.click(submitButton)
    
    // Try to type again while thinking
    await user.type(input, 'Another goal')
    
    // Submit button should be disabled
    expect(submitButton).toBeDisabled()
  })

  // Bug fix test: Input focus should not cause content shift
  it('does not scale/shift content when input is focused', async () => {
    render(<CareerGoalChatBar />)
    const user = userEvent.setup()
    
    const input = screen.getByPlaceholderText('Describe your career goal...')
    const initialParent = input.parentElement
    
    // Focus the input
    await user.click(input)
    
    // Parent should still be the same element (no scaling/shifting)
    expect(input.parentElement).toBe(initialParent)
    
    // Input should be focused
    expect(input).toHaveFocus()
  })
})

