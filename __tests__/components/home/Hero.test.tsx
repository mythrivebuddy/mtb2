// __tests__/Hero.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hero from '@/components/home/Hero';

// Mock useRedirectDashboard
jest.mock('@/hooks/use-redirect-dashboard', () => jest.fn());

// Mock SpotlightCard since it’s rendered inside Hero
jest.mock('@/components/home/SpotlightCard', () => () => <div>Mocked SpotlightCard</div>);

// Mock CardGrid
jest.mock('@/components/CardDesign', () => () => <div>Mocked CardGrid</div>);

describe('Hero Component', () => {
  it('renders both headings', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { name: /Solopreneurship/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Made Amazing/i })).toBeInTheDocument();
  });

  it('renders all category tags', () => {
    render(<Hero />);
    const tags = ['Trainer','Coach','Healer','Consultant','Designer','Developer','Astrologer'];
    tags.forEach(tag => {
      expect(screen.getByRole('button', { name: tag })).toBeInTheDocument();
    });
  });

  it('renders mocked child components', () => {
    render(<Hero />);
    expect(screen.getByText('Mocked SpotlightCard')).toBeInTheDocument();
    expect(screen.getByText('Mocked CardGrid')).toBeInTheDocument();
  });
});
