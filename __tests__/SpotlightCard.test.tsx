// __tests__/SpotlightCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpotlightCard from '@/components/home/SpotlightCard';
import { useQuery, useMutation } from '@tanstack/react-query';

// Mock axios
jest.mock('axios');

// Mock react-query
jest.mock('@tanstack/react-query');

// IntersectionObserver mock
beforeAll(() => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

describe('SpotlightCard Component', () => {
  const mockData = {
    id: '1',
    user: {
      name: 'John Doe',
      userBusinessProfile: [
        {
          featuredWorkTitle: 'Developer',
          featuredWorkImage: '/test-image.jpg',
          featuredWorkDesc: 'Awesome developer!',
          priorityContactLink: 'https://example.com',
        },
      ],
    },
  };

  it('renders loading state', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: true });

    render(<SpotlightCard />);

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders spotlight data', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: mockData, isLoading: false });

    render(<SpotlightCard />);

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/^Developer$/i)).toBeInTheDocument(); // 👈 exact match
    expect(screen.getByAltText(/Profile/i)).toHaveAttribute('src', '/test-image.jpg');
    expect(screen.getByText(/Awesome developer!/i)).toBeInTheDocument();
  });

  it('calls click mutation when button is clicked', () => {
    const mutate = jest.fn();
    (useQuery as jest.Mock).mockReturnValue({ data: mockData, isLoading: false });
    (useMutation as jest.Mock).mockReturnValue({ mutate });

    render(<SpotlightCard />);

    const button = screen.getByRole('button', { name: /Let's Connect/i }); // 👈 fixed apostrophe
    fireEvent.click(button);

    expect(mutate).toHaveBeenCalledWith('1');
  });
});
