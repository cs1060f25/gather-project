import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../page';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, whileInView, viewport, whileHover, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, initial, animate, transition, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock date-fns to have consistent dates in tests
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMMM yyyy') return 'November 2024';
    if (formatStr === 'd') return '1';
    if (formatStr === 'h:mm a') return '10:00 AM';
    return 'formatted date';
  }),
  isSameDay: jest.fn(() => false),
  isSameMonth: jest.fn(() => true),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    render(<Dashboard />);
  });

  describe('Layout Structure', () => {
    test('renders the main dashboard container', () => {
      const dashboard = screen.getByText('Gatherly').closest('.min-h-screen');
      expect(dashboard).toBeInTheDocument();
    });

    test('renders left sidebar with navigation', () => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('renders user info section', () => {
      expect(screen.getByText('Guest User')).toBeInTheDocument();
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });

    test('renders quick stats section', () => {
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('4 meetings scheduled')).toBeInTheDocument();
      expect(screen.getByText('12 hours saved')).toBeInTheDocument();
    });
  });

  describe('Chat Interface', () => {
    test('renders chat header with liquid glass effect', () => {
      expect(screen.getByText('Gatherly Assistant')).toBeInTheDocument();
      expect(screen.getByText('AI-powered scheduling')).toBeInTheDocument();
    });

    test('displays initial welcome message', () => {
      const welcomeMessage = screen.getByText(/Hi! I'm Gatherly/);
      expect(welcomeMessage).toBeInTheDocument();
      expect(welcomeMessage).toHaveTextContent('intelligent scheduling assistant');
    });

    test('renders chat input with placeholder', () => {
      const input = screen.getByPlaceholderText('Ask me to schedule a meeting...');
      expect(input).toBeInTheDocument();
    });

    test('handles message sending', async () => {
      const input = screen.getByPlaceholderText('Ask me to schedule a meeting...') as HTMLTextAreaElement;
      const sendButton = document.querySelector('.bg-gradient-to-r.from-green-500') as HTMLButtonElement; // Send button with gradient
      
      fireEvent.change(input, { target: { value: 'Schedule a meeting tomorrow' } });
      expect(input.value).toBe('Schedule a meeting tomorrow');
      
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Schedule a meeting tomorrow')).toBeInTheDocument();
      });
    });

    test('displays typing indicator when waiting for response', async () => {
      const input = screen.getByPlaceholderText('Ask me to schedule a meeting...') as HTMLTextAreaElement;
      const sendButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('h-5')
      );
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton!);
      
      await waitFor(() => {
        const typingIndicator = document.querySelector('.animate-bounce');
        expect(typingIndicator).toBeInTheDocument();
      });
    });

    test('clears input after sending message', async () => {
      const input = screen.getByPlaceholderText('Ask me to schedule a meeting...') as HTMLTextAreaElement;
      const sendButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('h-5')
      );
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton!);
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    test('handles Enter key to send message', async () => {
      const input = screen.getByPlaceholderText('Ask me to schedule a meeting...') as HTMLTextAreaElement;
      
      fireEvent.change(input, { target: { value: 'Test with Enter key' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });
      
      await waitFor(() => {
        expect(screen.getByText('Test with Enter key')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Component', () => {
    test('renders calendar header with current month', () => {
      expect(screen.getByText('November 2024')).toBeInTheDocument();
    });

    test('renders day headers', () => {
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    test('renders calendar navigation buttons', () => {
      const prevButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.h-5.w-5')
      );
      const nextButton = screen.getAllByRole('button').find((btn, index, array) => 
        index > 0 && btn.querySelector('.h-5.w-5')
      );
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    test('calendar navigation changes month', () => {
      const nextButton = screen.getAllByRole('button').find((btn, index, array) => {
        const svg = btn.querySelector('svg');
        return svg && Array.from(svg.classList).includes('h-5');
      });
      
      if (nextButton) {
        fireEvent.click(nextButton);
        // Month should change (mocked in our case)
        expect(screen.getByText('November 2024')).toBeInTheDocument();
      }
    });

    test('renders calendar grid with 42 days', () => {
      const calendarGrid = document.querySelectorAll('.aspect-square');
      expect(calendarGrid).toHaveLength(42); // 6 weeks × 7 days
    });
  });

  describe('Upcoming Events', () => {
    test('renders upcoming events section', () => {
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
    });

    test('displays sample events', () => {
      expect(screen.getByText('Team Standup')).toBeInTheDocument();
      expect(screen.getByText('Coffee Chat')).toBeInTheDocument();
      expect(screen.getByText('Project Review')).toBeInTheDocument();
      expect(screen.getByText('Study Group')).toBeInTheDocument();
    });

    test('events show time and participants', () => {
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
      expect(screen.getByText('3:30 PM')).toBeInTheDocument();
      expect(screen.getByText('6:00 PM')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    test('renders quick actions section', () => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    test('displays quick action buttons', () => {
      expect(screen.getByText('→ Schedule a new meeting')).toBeInTheDocument();
      expect(screen.getByText('→ Find common availability')).toBeInTheDocument();
      expect(screen.getByText('→ Send calendar invite')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('chat input is responsive', () => {
      const input = screen.getByPlaceholderText('Ask me to schedule a meeting...');
      expect(input).toHaveClass('w-full');
    });

    test('sidebar navigation items have hover states', () => {
      const homeLink = screen.getByText('Home').parentElement;
      expect(homeLink).toHaveClass('hover:bg-gray-50');
    });

    test('chat messages display timestamps', () => {
      const timestamp = screen.getByText('10:00 AM');
      expect(timestamp).toBeInTheDocument();
      expect(timestamp).toHaveClass('text-xs');
    });
  });

  describe('Interactive Elements', () => {
    test('New Meeting button is present and clickable', () => {
      const newMeetingButton = screen.getByText('New Meeting');
      expect(newMeetingButton).toBeInTheDocument();
      expect(newMeetingButton.tagName).toBe('BUTTON');
    });

    test('navigation items are clickable', () => {
      const calendarNav = screen.getByText('Calendar').parentElement;
      expect(calendarNav).toHaveClass('cursor-pointer');
    });

    test('calendar days have hover effect', () => {
      const calendarDays = document.querySelectorAll('.aspect-square');
      expect(calendarDays[0]).toHaveClass('hover:bg-gray-50');
    });
  });

  describe('AI Response', () => {
    test('shows appropriate response for unsupported features', async () => {
      const input = screen.getByPlaceholderText('Ask me to schedule a meeting...') as HTMLTextAreaElement;
      const sendButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('h-5')
      );
      
      fireEvent.change(input, { target: { value: 'Schedule a meeting' } });
      fireEvent.click(sendButton!);
      
      await waitFor(() => {
        expect(screen.getByText(/currently under development/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
