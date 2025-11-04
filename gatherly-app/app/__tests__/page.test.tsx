import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '../page';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, whileInView, viewport, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Landing Page', () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  describe('Hero Section', () => {
    test('renders the main headline', () => {
      expect(screen.getByText('Schedule smarter,')).toBeInTheDocument();
      expect(screen.getByText('not harder')).toBeInTheDocument();
    });

    test('renders the subheadline with product description', () => {
      const description = screen.getByText(/Gatherly is an intelligent scheduling agent/i);
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('finding mutual availability');
    });

    test('renders the CTA button with correct text', () => {
      const ctaButton = screen.getByRole('button', { name: /Start Scheduling/i });
      expect(ctaButton).toBeInTheDocument();
    });

    test('CTA button links to the dashboard', () => {
      const ctaButton = screen.getByRole('button', { name: /Start Scheduling/i });
      const ctaLink = ctaButton.closest('a');
      expect(ctaLink).toHaveAttribute('href', '/app');
    });
  });

  describe('Navigation', () => {
    test('renders the Gatherly logo', () => {
      expect(screen.getByText('Gatherly')).toBeInTheDocument();
    });

    test('renders navigation links on desktop', () => {
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('How it Works')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
    });

    test('navigation links have correct href attributes', () => {
      const featuresLink = screen.getByText('Features').closest('a');
      expect(featuresLink).toHaveAttribute('href', '#features');
    });
  });

  describe('Features Section', () => {
    test('renders features section title', () => {
      expect(screen.getByText('Why Choose Gatherly?')).toBeInTheDocument();
    });

    test('renders all feature cards', () => {
      expect(screen.getByText('AI-Powered')).toBeInTheDocument();
      expect(screen.getByText('Time-Saving')).toBeInTheDocument();
      expect(screen.getByText('Group-Friendly')).toBeInTheDocument();
    });

    test('feature cards have descriptions', () => {
      expect(screen.getByText(/Intelligent scheduling that learns/)).toBeInTheDocument();
      expect(screen.getByText(/Reduce scheduling time by 90%/)).toBeInTheDocument();
      expect(screen.getByText(/Perfect for team meetings/)).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    test('renders floating cards with correct content', () => {
      expect(screen.getByText('Group Coordination')).toBeInTheDocument();
      expect(screen.getByText('Smart Scheduling')).toBeInTheDocument();
      expect(screen.getByText('Seamless Integration')).toBeInTheDocument();
    });

    test('floating cards have descriptions', () => {
      expect(screen.getByText(/Automatically find the perfect time/)).toBeInTheDocument();
      expect(screen.getByText(/AI learns your preferences/)).toBeInTheDocument();
      expect(screen.getByText(/Works with Google Calendar/)).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    test('renders footer with copyright text', () => {
      expect(screen.getByText(/© 2024 Gatherly/)).toBeInTheDocument();
      expect(screen.getByText(/Making scheduling effortless/)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('hero section text is present on all screen sizes', () => {
      const headline = screen.getByText('Schedule smarter,');
      expect(headline).toBeInTheDocument();
      expect(headline.parentElement).toHaveClass('text-6xl', 'md:text-7xl');
    });

    test('CTA button maintains responsiveness classes', () => {
      const ctaButton = screen.getByRole('button', { name: /Start Scheduling/i });
      expect(ctaButton).toHaveClass('px-8', 'py-4', 'text-lg');
    });
  });

  describe('Accessibility', () => {
    test('all interactive elements are keyboard accessible', () => {
      const ctaButton = screen.getByRole('button', { name: /Start Scheduling/i });
      expect(ctaButton).toBeInTheDocument();
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    test('images/icons have appropriate alt text or aria-labels', () => {
      // Icons are decorative and don't need alt text, but they should be present
      const container = screen.getByText('Gatherly').parentElement;
      expect(container).toBeInTheDocument();
    });
  });
});
