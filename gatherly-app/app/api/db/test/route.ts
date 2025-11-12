/**
 * API Route for Database Testing
 * This runs on the server side where PostgreSQL can work
 */

import { NextResponse } from 'next/server';
import { getUserService, getEventSessionService, getMessageService, getPreferenceService, getSchedulingEventService } from '@/lib/db/services';

export async function POST() {
  try {
    const results = [];

    // Test Firebase User Service
    try {
      const userService = getUserService();
      const testUser = await userService.createUser({
        email: `api-test-${Date.now()}@gatherly.dev`,
        name: 'API Test User',
        timezone: 'America/Los_Angeles',
      });
      results.push({
        service: 'User Service',
        status: 'success',
        data: testUser
      });
    } catch (error) {
      results.push({
        service: 'User Service',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Firebase Session Service
    try {
      const sessionService = getEventSessionService();
      const session = await sessionService.createSession({
        hostUserId: `test-host-${Date.now()}`,
        inviteeIds: ['test-invitee'],
        title: 'API Test Meeting',
        duration: 30,
        status: 'pending',
      });
      results.push({
        service: 'Session Service',
        status: 'success',
        data: session
      });
    } catch (error) {
      results.push({
        service: 'Session Service',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test PostgreSQL Preference Service (if configured)
    try {
      const preferenceService = getPreferenceService();
      const profile = await preferenceService.computeProfile(`test-user-${Date.now()}`);
      results.push({
        service: 'Preference Service (PostgreSQL)',
        status: 'success',
        data: profile
      });
    } catch (error) {
      results.push({
        service: 'Preference Service (PostgreSQL)',
        status: 'warning',
        message: 'PostgreSQL not configured (this is OK for now)',
        error: error instanceof Error ? error.message : 'Not configured'
      });
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Database tests completed'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to run database tests'
  });
}
