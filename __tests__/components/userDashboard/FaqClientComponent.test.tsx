import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';

import { Faq } from '@/types/client/faq';
import FaqClientComponent from '@/components/dashboard/user/FaqClientComponent';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Utility to wrap component with React Query provider
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('FaqClientComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeletons when loading', () => {
    mockedAxios.get.mockReturnValueOnce(new Promise(() => {})); // never resolves
    renderWithQueryClient(<FaqClientComponent />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders error alert when API fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
    renderWithQueryClient(<FaqClientComponent />);
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load FAQs. Please try again later.')
      ).toBeInTheDocument();
    });
  });

  it('renders FAQs and toggles accordion', async () => {
    const faqs: Faq[] = [
      { id: '1', question: 'Question 1?', answer: '<p>Answer 1</p>' },
      { id: '2', question: 'Question 2?', answer: '<p>Answer 2</p>' },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data: faqs });
    renderWithQueryClient(<FaqClientComponent/>);

    // Wait for FAQs to render
    await waitFor(() => {
      expect(screen.getByText('Question 1?')).toBeInTheDocument();
      expect(screen.getByText('Question 2?')).toBeInTheDocument();
    });

    // Initially answers should be hidden (check parent div via aria-hidden)
// Initially answers should be hidden
faqs.forEach((faq) => {
  const answerDiv = screen.getByTestId(`faq-answer-${faq.id}`);
  expect(answerDiv).toHaveAttribute('aria-hidden', 'true');
});

// Click first FAQ
fireEvent.click(screen.getByText('Question 1?'));
await waitFor(() => {
  const answerDiv = screen.getByTestId('faq-answer-1');
  expect(answerDiv).toHaveAttribute('aria-hidden', 'false');
});

// Click again to close
fireEvent.click(screen.getByText('Question 1?'));
await waitFor(() => {
  const answerDiv = screen.getByTestId('faq-answer-1');
  expect(answerDiv).toHaveAttribute('aria-hidden', 'true');
});

  });
});
