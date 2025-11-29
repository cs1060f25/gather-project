/**
 * Signup API Route
 * Linear Task: GATHER-76
 * 
 * Handles email/password signup with proper error codes
 * Returns 409 with EMAIL_ALREADY_EXISTS for duplicate emails
 */

import { NextRequest, NextResponse } from 'next/server';

// Error codes matching frontend
const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_INPUT: 'INVALID_INPUT',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

interface SuccessResponse {
  success: true;
  user: {
    uid: string;
    email: string;
    displayName: string;
  };
}

// In-memory store for demo (in production, this would be Firestore)
const existingEmails = new Set<string>([
  'test@example.com',
  'existing@gatherly.com',
]);

export async function POST(request: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body: SignupRequest = await request.json();
    const { email, password, displayName } = body;

    // Validate input
    if (!email || !password || !displayName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.INVALID_INPUT,
            message: 'Email, password, and name are required.',
          },
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.WEAK_PASSWORD,
            message: 'Password must be at least 6 characters.',
          },
        },
        { status: 400 }
      );
    }

    // GATHER-76: Check for duplicate email and return 409 with structured error
    if (existingEmails.has(email.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
            message: 'An account with this email already exists. Please sign in instead.',
          },
        },
        { status: 409 }
      );
    }

    // Simulate successful signup
    existingEmails.add(email.toLowerCase());
    
    return NextResponse.json(
      {
        success: true,
        user: {
          uid: `user_${Date.now()}`,
          email,
          displayName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    
    // GATHER-76: Don't return generic 500 error
    // Instead, return a structured error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
          message: 'An unexpected error occurred. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}

