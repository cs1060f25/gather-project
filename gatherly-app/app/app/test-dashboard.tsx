'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { getUserService, getEventSessionService, getMessageService } from '@/lib/db/services/client-safe';

export default function TestDashboard() {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message: string;
    data?: any;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDatabaseTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Firebase Connection',
        test: async () => {
          const userService = getUserService();
          return { success: true, message: 'Firebase initialized successfully' };
        }
      },
      {
        name: 'Create Test User',
        test: async () => {
          const userService = getUserService();
          const testUser = await userService.createUser({
            email: `test-${Date.now()}@gatherly.dev`,
            name: 'Test User',
            timezone: 'America/Los_Angeles',
            defaultPreferences: {
              preferredDuration: 30,
              bufferTime: 15,
              workingHours: { start: '09:00', end: '17:00' }
            }
          });
          return { 
            success: true, 
            message: `Created user: ${testUser.email}`,
            data: testUser
          };
        }
      },
      {
        name: 'Create Event Session',
        test: async () => {
          const sessionService = getEventSessionService();
          const session = await sessionService.createSession({
            hostUserId: `test-user-${Date.now()}`,
            inviteeIds: ['invitee1', 'invitee2'],
            title: 'Test Meeting',
            duration: 30,
            status: 'pending',
            proposedTimes: [
              {
                start: new Date(Date.now() + 24 * 60 * 60 * 1000),
                end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
                confidence: 0.95
              }
            ]
          });
          return { 
            success: true, 
            message: `Created session: ${session.id}`,
            data: session
          };
        }
      },
      {
        name: 'Add Message to Session',
        test: async () => {
          const messageService = getMessageService();
          const sessionId = `test-session-${Date.now()}`;
          
          // First create the session
          const sessionService = getEventSessionService();
          await sessionService.createSession({
            hostUserId: 'test-host',
            inviteeIds: [],
            title: 'Message Test',
            duration: 30,
            status: 'pending'
          });

          // Then add a message
          const message = await messageService.addMessage(sessionId, {
            sessionId,
            role: 'user',
            content: 'This is a test message'
          });
          
          return { 
            success: true, 
            message: `Added message to session`,
            data: message
          };
        }
      },
      {
        name: 'Query User Sessions',
        test: async () => {
          const sessionService = getEventSessionService();
          const sessions = await sessionService.getSessionsByUser('test-host');
          return { 
            success: true, 
            message: `Found ${sessions.length} sessions`,
            data: sessions
          };
        }
      }
    ];

    for (const test of tests) {
      setTestResults(prev => [...prev, {
        name: test.name,
        status: 'running',
        message: 'Running test...'
      }]);

      try {
        const result = await test.test();
        setTestResults(prev => 
          prev.map(t => 
            t.name === test.name 
              ? { ...t, status: 'success', message: result.message, data: (result as any).data }
              : t
          )
        );
      } catch (error) {
        setTestResults(prev => 
          prev.map(t => 
            t.name === test.name 
              ? { 
                  ...t, 
                  status: 'error', 
                  message: error instanceof Error ? error.message : 'Test failed'
                }
              : t
          )
        );
      }

      // Small delay between tests for visual effect
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Test Suite</h1>
              <p className="text-gray-600 mt-2">Test Firebase and PostgreSQL connections</p>
            </div>
            <button
              onClick={runDatabaseTests}
              disabled={isRunning}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                isRunning 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  Run All Tests
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <motion.div
                key={result.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200'
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : result.status === 'running'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {result.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {result.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {result.status === 'running' && (
                        <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                      )}
                      <h3 className="font-semibold text-gray-900">{result.name}</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{result.message}</p>
                    {result.data && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                          View test data
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {testResults.length > 0 && !isRunning && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  Open Firebase Console to view your test data
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  Check Firestore for created documents
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  Test the calendar UI with real data
                </li>
              </ul>
              <a
                href="https://console.firebase.google.com/project/gatherly-mvp/firestore"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Firebase Console
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
