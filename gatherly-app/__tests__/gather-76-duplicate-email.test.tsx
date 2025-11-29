/**
 * GATHER-76: Duplicate Email Signup Error Handling Tests
 * 
 * These tests verify that:
 * 1. Backend returns 409 status with EMAIL_ALREADY_EXISTS error code for duplicate emails
 * 2. Frontend displays a friendly inline error message (not a generic toast)
 * 3. Error message suggests signing in instead
 * 
 * EXPECTED: These tests should FAIL initially to demonstrate the bug
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: null,
  }),
}));

describe('GATHER-76: Duplicate Email Signup Error Handling', () => {
  
  describe('API Route Tests', () => {
    const API_URL = '/api/auth/signup';
    
    it('should return 409 status code for duplicate email signup', async () => {
      // Arrange
      const duplicateEmailPayload = {
        email: 'existing@gatherly.com',
        password: 'password123',
        displayName: 'Test User',
      };

      // Act
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateEmailPayload),
      });

      // Assert - Should NOT be 500 (generic error)
      expect(response.status).not.toBe(500);
      
      // Assert - Should be 409 (Conflict)
      expect(response.status).toBe(409);
    });

    it('should return EMAIL_ALREADY_EXISTS error code in response body', async () => {
      // Arrange
      const duplicateEmailPayload = {
        email: 'existing@gatherly.com',
        password: 'password123',
        displayName: 'Test User',
      };

      // Act
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateEmailPayload),
      });
      const data = await response.json();

      // Assert - Response should have structured error
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should include helpful error message suggesting sign-in', async () => {
      // Arrange
      const duplicateEmailPayload = {
        email: 'existing@gatherly.com',
        password: 'password123',
        displayName: 'Test User',
      };

      // Act
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateEmailPayload),
      });
      const data = await response.json();

      // Assert - Message should guide user to sign in
      expect(data.error.message).toContain('already exists');
      expect(data.error.message.toLowerCase()).toContain('sign in');
    });
  });

  describe('Frontend Error Display Tests', () => {
    
    it('should display inline error message for duplicate email', async () => {
      // This test verifies that the frontend shows an inline error
      // instead of a generic toast notification
      
      // Mock the signup function to return duplicate email error
      const mockSignUp = jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists. Please sign in instead.',
        },
      });

      jest.doMock('@/lib/auth/google-auth', () => ({
        signUpWithEmail: mockSignUp,
        signInWithGoogle: jest.fn(),
        saveRedirectTo: jest.fn(),
        AUTH_ERROR_CODES: {
          EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
        },
      }));

      // Import component after mocking
      const SignupPage = require('@/app/auth/signup/page').default;
      
      render(<SignupPage />);

      // Fill out the form
      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'existing@gatherly.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });

      // Submit the form
      fireEvent.click(screen.getByTestId('email-signup-button'));

      // Wait for error to appear
      await waitFor(() => {
        // Should show inline error, not toast
        const errorElement = screen.getByTestId('signup-error');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('data-error-code', 'EMAIL_ALREADY_EXISTS');
      });
    });

    it('should NOT show a generic "Something went wrong" toast', async () => {
      // This test ensures we don't show generic error messages
      
      const mockSignUp = jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists. Please sign in instead.',
        },
      });

      jest.doMock('@/lib/auth/google-auth', () => ({
        signUpWithEmail: mockSignUp,
        signInWithGoogle: jest.fn(),
        saveRedirectTo: jest.fn(),
        AUTH_ERROR_CODES: {
          EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
        },
      }));

      const SignupPage = require('@/app/auth/signup/page').default;
      render(<SignupPage />);

      // Fill and submit
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'existing@gatherly.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'Test' },
      });
      fireEvent.click(screen.getByTestId('email-signup-button'));

      await waitFor(() => {
        // Error message should NOT be generic
        const errorMessage = screen.getByTestId('auth-error-message');
        expect(errorMessage.textContent).not.toContain('Something went wrong');
        expect(errorMessage.textContent).not.toContain('500');
        expect(errorMessage.textContent).not.toContain('Internal Server Error');
      });
    });

    it('should provide a link to sign in page when duplicate email detected', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists. Please sign in instead.',
        },
      });

      jest.doMock('@/lib/auth/google-auth', () => ({
        signUpWithEmail: mockSignUp,
        signInWithGoogle: jest.fn(),
        saveRedirectTo: jest.fn(),
        AUTH_ERROR_CODES: {
          EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
        },
      }));

      const SignupPage = require('@/app/auth/signup/page').default;
      render(<SignupPage />);

      // Fill and submit
      fireEvent.change(screen.getByTestId('name-input'), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'existing@gatherly.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByTestId('email-signup-button'));

      await waitFor(() => {
        // Should have a link to sign in page
        const signInLink = screen.getByTestId('signin-link');
        expect(signInLink).toBeInTheDocument();
        expect(signInLink).toHaveAttribute('href', expect.stringContaining('/auth/login'));
      });
    });
  });
});

