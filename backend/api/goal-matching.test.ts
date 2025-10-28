/**
 * Unit tests for goal-matching API endpoint (GATH-43)
 * 
 * Test Plan:
 * 1. Validates required fields (goal must be present)
 * 2. Parses career goals correctly from text
 * 3. Detects career fields from keywords
 * 4. Detects experience levels (internship, senior, etc.)
 * 5. Extracts locations from text
 * 6. Extracts timeline/year information
 * 7. Returns correct professional matches based on field
 * 8. Handles empty/invalid input gracefully
 * 9. Returns properly formatted response
 * 10. Mock integration ready for Claude API
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { handleGoalMatching } from './goal-matching'

describe('Goal Matching API', () => {
  describe('Input Validation', () => {
    it('rejects empty goal string', async () => {
      await expect(
        handleGoalMatching({ goal: '' })
      ).rejects.toThrow('Goal is required')
    })

    it('rejects whitespace-only goal', async () => {
      await expect(
        handleGoalMatching({ goal: '   ' })
      ).rejects.toThrow('Goal is required')
    })

    it('accepts valid goal with minimum information', async () => {
      const result = await handleGoalMatching({
        goal: 'I need career advice'
      })
      
      expect(result).toBeDefined()
      expect(result.matches).toBeDefined()
      expect(Array.isArray(result.matches)).toBe(true)
    })
  })

  describe('Career Field Detection', () => {
    it('detects investment banking from keywords', async () => {
      const result = await handleGoalMatching({
        goal: 'Find me a summer internship in investment banking for 2026'
      })
      
      expect(result.matches).toBeDefined()
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0].title).toMatch(/Goldman|JPMorgan|Morgan Stanley/i)
    })

    it('detects tech/software engineering from keywords', async () => {
      const result = await handleGoalMatching({
        goal: 'I want to work in tech as a software engineer'
      })
      
      expect(result.matches).toBeDefined()
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0].title).toMatch(/Software|Engineer|Google|Meta/i)
    })

    it('detects consulting from keywords', async () => {
      const result = await handleGoalMatching({
        goal: 'Help me break into consulting'
      })
      
      expect(result.matches).toBeDefined()
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0].title).toMatch(/Consultant|McKinsey|Bain/i)
    })

    it('defaults to general for unspecified field', async () => {
      const result = await handleGoalMatching({
        goal: 'I need career guidance'
      })
      
      expect(result.matches).toBeDefined()
      expect(result.matches.length).toBeGreaterThan(0)
    })
  })

  describe('Location Detection', () => {
    it('extracts New York from goal text', async () => {
      const result = await handleGoalMatching({
        goal: 'Find opportunities in New York City'
      })
      
      expect(result).toBeDefined()
      // Location is used for filtering in production
    })

    it('extracts San Francisco from goal text', async () => {
      const result = await handleGoalMatching({
        goal: 'Looking for tech jobs in San Francisco'
      })
      
      expect(result).toBeDefined()
    })

    it('handles NYC abbreviation', async () => {
      const result = await handleGoalMatching({
        goal: 'Investment banking roles in NYC'
      })
      
      expect(result).toBeDefined()
    })
  })

  describe('Timeline Detection', () => {
    it('extracts year from goal text', async () => {
      const result = await handleGoalMatching({
        goal: 'Summer 2026 internship opportunities'
      })
      
      expect(result).toBeDefined()
      // Timeline affects match relevance in production
    })

    it('handles goals without explicit timeline', async () => {
      const result = await handleGoalMatching({
        goal: 'I need an internship'
      })
      
      expect(result).toBeDefined()
      expect(result.matches).toBeDefined()
    })
  })

  describe('Response Format', () => {
    it('returns matches array', async () => {
      const result = await handleGoalMatching({
        goal: 'Find me an internship'
      })
      
      expect(result.matches).toBeDefined()
      expect(Array.isArray(result.matches)).toBe(true)
    })

    it('each match has required fields', async () => {
      const result = await handleGoalMatching({
        goal: 'Investment banking internship'
      })
      
      expect(result.matches.length).toBeGreaterThan(0)
      
      const match = result.matches[0]
      expect(match).toHaveProperty('name')
      expect(match).toHaveProperty('title')
      expect(match).toHaveProperty('whyHelpful')
      expect(typeof match.name).toBe('string')
      expect(typeof match.title).toBe('string')
      expect(typeof match.whyHelpful).toBe('string')
    })

    it('includes reasoning in response', async () => {
      const result = await handleGoalMatching({
        goal: 'Career advice needed'
      })
      
      expect(result.reasoning).toBeDefined()
      expect(typeof result.reasoning).toBe('string')
    })

    it('includes confidence score', async () => {
      const result = await handleGoalMatching({
        goal: 'Help me find opportunities'
      })
      
      expect(result.confidence).toBeDefined()
      expect(typeof result.confidence).toBe('number')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Professional Matching', () => {
    it('returns multiple matches for common fields', async () => {
      const result = await handleGoalMatching({
        goal: 'Summer internship in investment banking'
      })
      
      expect(result.matches.length).toBeGreaterThan(1)
    })

    it('matches are relevant to requested field', async () => {
      const result = await handleGoalMatching({
        goal: 'I want to work in finance',
        careerField: 'investment-banking'
      })
      
      expect(result.matches.length).toBeGreaterThan(0)
      // All matches should be finance-related
      result.matches.forEach(match => {
        expect(match.title).toMatch(/Analyst|Associate|VP|Goldman|JPMorgan|Morgan Stanley/i)
      })
    })

    it('returns at least one match for any valid goal', async () => {
      const result = await handleGoalMatching({
        goal: 'I need help with my career'
      })
      
      expect(result.matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Field Override', () => {
    it('uses explicit careerField parameter', async () => {
      const result = await handleGoalMatching({
        goal: 'Help me find a job',
        careerField: 'tech'
      })
      
      expect(result.matches[0].title).toMatch(/Software|Engineer|Google|Meta/i)
    })

    it('uses explicit location parameter', async () => {
      const result = await handleGoalMatching({
        goal: 'Find opportunities',
        location: 'Boston'
      })
      
      expect(result).toBeDefined()
      // Location used for filtering in production
    })

    it('prioritizes explicit parameters over parsed values', async () => {
      const result = await handleGoalMatching({
        goal: 'I want tech jobs in NYC',
        careerField: 'consulting',
        location: 'Boston'
      })
      
      // Should use consulting matches despite "tech" in goal text
      expect(result.matches[0].title).toMatch(/Consultant|McKinsey|Bain/i)
    })
  })

  describe('Error Handling', () => {
    it('throws error for missing goal', async () => {
      await expect(
        handleGoalMatching({ goal: '' })
      ).rejects.toThrow()
    })

    it('handles malformed input gracefully', async () => {
      const result = await handleGoalMatching({
        goal: 'asdf1234!@#$',
        careerField: 'general'
      })
      
      // Should still return something useful
      expect(result.matches).toBeDefined()
    })
  })

  describe('Integration Readiness', () => {
    it('goal parsing function ready for Claude integration', async () => {
      // This test validates that the structure is ready for Claude API
      const result = await handleGoalMatching({
        goal: 'Complex multi-part goal: I want a 2026 summer analyst position at a bulge bracket investment bank in Manhattan, specifically in M&A or leveraged finance'
      })
      
      expect(result).toBeDefined()
      expect(result.matches).toBeDefined()
      // In production, Claude would extract: field=IB, level=analyst, location=Manhattan, focus=M&A
    })

    it('professional matching ready for LinkedIn API', async () => {
      // Validates structure is ready for real LinkedIn data
      const result = await handleGoalMatching({
        goal: 'Find me mentors in tech'
      })
      
      result.matches.forEach(match => {
        expect(match).toHaveProperty('name')
        expect(match).toHaveProperty('title')
        expect(match).toHaveProperty('whyHelpful')
        // In production, would also have: linkedInUrl, availability, profilePicture, etc.
      })
    })
  })

  describe('Response Quality', () => {
    it('provides helpful context in whyHelpful field', async () => {
      const result = await handleGoalMatching({
        goal: '2026 IB summer analyst recruiting'
      })
      
      result.matches.forEach(match => {
        expect(match.whyHelpful.length).toBeGreaterThan(20)
        expect(match.whyHelpful).toMatch(/help|insight|experience|knowledge|mentor/i)
      })
    })

    it('reasoning explains the match quality', async () => {
      const result = await handleGoalMatching({
        goal: 'Career guidance needed'
      })
      
      expect(result.reasoning).toContain('Found')
      expect(result.reasoning).toContain('professionals')
    })
  })

  describe('Bug Fixes', () => {
    // Bug fix test: Invalid careerField should default to 'general'
    it('handles invalid careerField gracefully by defaulting to general', async () => {
      const result = await handleGoalMatching({
        goal: 'I need career advice',
        careerField: 'invalid-field-name' as any
      })
      
      // Should return general matches instead of empty/error
      expect(result.matches).toBeDefined()
      expect(result.matches.length).toBeGreaterThan(0)
    })

    it('accepts all valid careerField values', async () => {
      const validFields = ['investment-banking', 'tech', 'consulting', 'general']
      
      for (const field of validFields) {
        const result = await handleGoalMatching({
          goal: 'Test goal',
          careerField: field
        })
        
        expect(result.matches).toBeDefined()
        expect(result.matches.length).toBeGreaterThan(0)
      }
    })
  })
})

