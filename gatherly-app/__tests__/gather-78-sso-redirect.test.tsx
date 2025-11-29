/**
 * GATHER-78: SSO RedirectTo Preservation Tests
 * 
 * These tests verify that:
 * 1. redirectTo parameter from URL is saved before SSO flow
 * 2. redirectTo is retrieved after SSO callback
 * 3. User is redirected to the original destination (e.g., /invite/abc123) after login
 * 
 * EXPECTED: These tests should FAIL initially to demonstrate the bug
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { saveRedirectTo, getAndClearRedirectTo } from '@/lib/auth/google-auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Next.js navigation
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
  useParams: () => ({
    id: 'abc123',
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('GATHER-78: SSO RedirectTo Preservation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockPush.mockClear();
    mockGet.mockClear();
  });

  describe('localStorage Helper Functions', () => {
    it('should save redirectTo path to localStorage', () => {
      // Act
      saveRedirectTo('/invite/abc123');

      // Assert
      expect(localStorage.getItem('gatherly_redirect_to')).toBe('/invite/abc123');
    });

    it('should retrieve and clear redirectTo from localStorage', () => {
      // Arrange
      localStorage.setItem('gatherly_redirect_to', '/invite/abc123');

      // Act
      const result = getAndClearRedirectTo();

      // Assert
      expect(result).toBe('/invite/abc123');
      expect(localStorage.getItem('gatherly_redirect_to')).toBeNull();
    });

    it('should return null if no redirectTo is stored', () => {
      // Act
      const result = getAndClearRedirectTo();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Login Page redirectTo Handling', () => {
    it('should save redirectTo from URL query param on login page load', async () => {
      // Arrange - Mock URL with redirectTo query param
      mockGet.mockReturnValue('/invite/abc123');

      // Mock auth context as not authenticated
      jest.doMock('@/lib/auth/auth-context', () => ({
        useAuth: () => ({
          isAuthenticated: false,
          loading: false,
          user: null,
        }),
      }));

      // Import after mocking
      const LoginPage = require('@/app/auth/login/page').default;
      
      // Act
      render(<LoginPage />);

      // Assert - redirectTo should be saved
      await waitFor(() => {
        expect(localStorage.getItem('gatherly_redirect_to')).toBe('/invite/abc123');
      });
    });

    it('should preserve redirectTo in signup link', async () => {
      mockGet.mockReturnValue('/invite/abc123');

      jest.doMock('@/lib/auth/auth-context', () => ({
        useAuth: () => ({
          isAuthenticated: false,
          loading: false,
          user: null,
        }),
      }));

      const LoginPage = require('@/app/auth/login/page').default;
      render(<LoginPage />);

      // The signup link should include redirectTo
      const signupLink = screen.getByText('Sign up');
      expect(signupLink).toHaveAttribute(
        'href',
        expect.stringContaining('redirectTo=%2Finvite%2Fabc123')
      );
    });
  });

  describe('Auth Callback redirectTo Handling', () => {
    it('should redirect to stored path after successful SSO', async () => {
      // Arrange - Store redirectTo before callback
      localStorage.setItem('gatherly_redirect_to', '/invite/abc123');
      mockGet.mockReturnValue(null); // No query param

      // Mock as authenticated after SSO
      jest.doMock('@/lib/auth/auth-context', () => ({
        useAuth: () => ({
          isAuthenticated: true,
          loading: false,
          user: { email: 'test@example.com' },
        }),
      }));

      const CallbackPage = require('@/app/auth/callback/page').default;
      
      // Act
      render(<CallbackPage />);

      // Assert - Should redirect to invite page, NOT /app
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/invite/abc123');
      });
    });

    it('should prioritize query param over localStorage', async () => {
      // Arrange - Both sources have redirectTo
      localStorage.setItem('gatherly_redirect_to', '/invite/old-invite');
      mockGet.mockReturnValue('/invite/new-invite');

      jest.doMock('@/lib/auth/auth-context', () => ({
        useAuth: () => ({
          isAuthenticated: true,
          loading: false,
          user: { email: 'test@example.com' },
        }),
      }));

      const CallbackPage = require('@/app/auth/callback/page').default;
      render(<CallbackPage />);

      // Assert - Should use query param value
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/invite/new-invite');
      });
    });

    it('should clear localStorage after reading redirectTo', async () => {
      // Arrange
      localStorage.setItem('gatherly_redirect_to', '/invite/abc123');
      mockGet.mockReturnValue(null);

      jest.doMock('@/lib/auth/auth-context', () => ({
        useAuth: () => ({
          isAuthenticated: true,
          loading: false,
          user: { email: 'test@example.com' },
        }),
      }));

      const CallbackPage = require('@/app/auth/callback/page').default;
      render(<CallbackPage />);

      // Assert - localStorage should be cleared
      await waitFor(() => {
        expect(localStorage.getItem('gatherly_redirect_to')).toBeNull();
      });
    });

    it('should fallback to /app when no redirectTo is available', async () => {
      // Arrange - No redirectTo anywhere
      mockGet.mockReturnValue(null);

      jest.doMock('@/lib/auth/auth-context', () => ({
        useAuth: () => ({
          isAuthenticated: true,
          loading: false,
          user: { email: 'test@example.com' },
        }),
      }));

      const CallbackPage = require('@/app/auth/callback/page').default;
      render(<CallbackPage />);

      // Assert - Should redirect to default /app
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app');
      });
    });
  });

  describe('End-to-End Invite Flow', () => {
    it('should complete full flow: invite → login → SSO → redirect back to invite', async () => {
      // This test simulates the complete user journey:
      // 1. User clicks invite link (/invite/abc123) while logged out
      // 2. Gets redirected to login with redirectTo
      // 3. Signs in with Google SSO
      // 4. Gets redirected back to the invite page

      // Step 1: User visits invite page logged out
      jest.doMock('@/lib/auth/auth-context', () => ({
        useAuth: () => ({
          isAuthenticated: false,
          loading: false,
          user: null,
        }),
      }));

      const InvitePage = require('@/app/invite/[id]/page').default;
      render(<InvitePage />);

      // Should redirect to login with redirectTo preserved
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login?redirectTo=%2Finvite%2Fabc123')
        );
      });

      // Step 2: On login page, redirectTo is saved
      mockGet.mockReturnValue('/invite/abc123');
      saveRedirectTo('/invite/abc123');
      expect(localStorage.getItem('gatherly_redirect_to')).toBe('/invite/abc123');

      // Step 3: After SSO, callback page processes redirect
      mockPush.mockClear();
      
      jest.doMock('@/lib/auth/auth-context', () => ({
        useAuth: () => ({
          isAuthenticated: true,
          loading: false,
          user: { email: 'test@example.com' },
        }),
      }));

      const CallbackPage = require('@/app/auth/callback/page').default;
      render(<CallbackPage />);

      // Step 4: Should redirect back to invite page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/invite/abc123');
      });
    });
  });
});

