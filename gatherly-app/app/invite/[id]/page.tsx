'use client';

/**
 * Invite Page
 * Linear Task: GATHER-78
 * 
 * Protected page that requires authentication
 * Used to test redirectTo preservation after SSO
 */

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { Calendar, Users, Clock, MapPin } from 'lucide-react';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading, user } = useAuth();
  const inviteId = params.id as string;

  // Redirect to login if not authenticated (preserving redirectTo)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = `/invite/${inviteId}`;
      router.push(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, loading, router, inviteId]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #5b7fa8 0%, #6b8fb8 50%, #7ba3c8 100%)',
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Mock invite data
  const inviteData = {
    id: inviteId,
    title: 'Coffee Chat with Team',
    host: 'Alex Johnson',
    date: 'Tuesday, Dec 5th',
    time: '2:00 PM - 3:00 PM',
    location: 'Zoom Meeting',
    attendees: ['Alex Johnson', 'You', '+2 others'],
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #5b7fa8 0%, #6b8fb8 50%, #7ba3c8 100%)',
      padding: '40px 20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#5b7fa8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Calendar style={{ color: 'white', width: '24px', height: '24px' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: 0,
            }}>
              {inviteData.title}
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              margin: 0,
            }}>
              Hosted by {inviteData.host}
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#F3F4F6',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Clock style={{ width: '20px', height: '20px', color: '#6B7280' }} />
            <div>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>{inviteData.date}</p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{inviteData.time}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <MapPin style={{ width: '20px', height: '20px', color: '#6B7280' }} />
            <p style={{ fontSize: '16px', color: '#1a1a1a', margin: 0 }}>{inviteData.location}</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users style={{ width: '20px', height: '20px', color: '#6B7280' }} />
            <p style={{ fontSize: '16px', color: '#1a1a1a', margin: 0 }}>
              {inviteData.attendees.join(', ')}
            </p>
          </div>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          Signed in as {user?.email}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              fontSize: '15px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            Decline
          </button>
          <button
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#10B981',
              fontSize: '15px',
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Accept
          </button>
        </div>

        <p style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#9CA3AF',
          textAlign: 'center',
        }} data-testid="invite-id">
          Invite ID: {inviteId}
        </p>
      </motion.div>
    </div>
  );
}

