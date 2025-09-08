// __tests__/Home.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page';
import { SessionProvider } from 'next-auth/react';

// Mock the image import
jest.mock('@/public/avtar.png', () => 'test-file-stub');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      spotlight: {
        user: {
          userBusinessProfile: [{ featuredWorkImage: '/test-image.jpg' }],
        },
      },
    },
    isLoading: false,
    error: null,
  }),
  useMutation: () => ({ mutate: jest.fn(), isLoading: false }),
}));

describe('Home', () => {
  it('renders the main heading', () => {
    render(
      <SessionProvider session={null}>
        <Home />
      </SessionProvider>
    );

    const heading = screen.getByRole('heading', { name: /Solopreneurship/i, level: 1 });
    expect(heading).toBeInTheDocument();
  });
});