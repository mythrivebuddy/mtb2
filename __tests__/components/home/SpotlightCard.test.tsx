import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotlightCard from "@/components/home/SpotlightCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

// Mock axios
jest.mock("axios");

// Mock react-query
jest.mock("@tanstack/react-query");

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// IntersectionObserver mock
let ioCallback: IntersectionObserverCallback | null = null;
const observeMock = jest.fn();
const disconnectMock = jest.fn(() => {
  ioCallback = null; // Clear callback to simulate disconnect
});

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    ioCallback = callback;
  }
  observe = observeMock;
  disconnect = disconnectMock;
  unobserve = jest.fn();
}
(global as any).IntersectionObserver = MockIntersectionObserver;

describe("SpotlightCard Component", () => {
  const fullData = {
    id: "1",
    user: {
      name: "John Doe",
      userBusinessProfile: [
        {
          featuredWorkTitle: "Developer",
          featuredWorkImage: "/test-image.jpg",
          featuredWorkDesc: "Awesome developer!",
          priorityContactLink: "https://example.com",
        },
      ],
    },
  };

  const partialData = {
    id: "2",
    user: {
      name: "Jane Smith",
      userBusinessProfile: [{}],
    },
  };

  let viewMutateMock: jest.Mock;
  let clickMutateMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    viewMutateMock = jest.fn();
    clickMutateMock = jest.fn();
    // Mock useMutation to distinguish between view and click mutations
    (useMutation as jest.Mock).mockImplementation(({ mutationFn }) => {
      if (mutationFn.toString().includes("VIEW")) {
        return { mutate: viewMutateMock };
      }
      return { mutate: clickMutateMock };
    });
  });

  it("renders loading state", () => {
    (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: true });
    render(<SpotlightCard />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it("renders full spotlight data correctly and fires click mutation", async () => {
    (useQuery as jest.Mock).mockReturnValue({ data: fullData, isLoading: false });
    render(<SpotlightCard />);

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/^Developer$/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Profile/i)).toHaveAttribute("src", "/test-image.jpg");
    expect(screen.getByText(/Awesome developer!/i)).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /Let's Connect/i });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(clickMutateMock).toHaveBeenCalledWith("1");
    expect(clickMutateMock).toHaveBeenCalledTimes(1);
  });

  it("renders fallback values when data is missing", () => {
    (useQuery as jest.Mock).mockReturnValue({ data: partialData, isLoading: false });
    render(<SpotlightCard />);

    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Marketing Coordinator/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/This creates a sense of recognition/i)).toBeInTheDocument();
  });

  it("fires view mutation only once even if IntersectionObserver triggers multiple times", async () => {
    (useQuery as jest.Mock).mockReturnValue({ data: fullData, isLoading: false });
    render(<SpotlightCard />);

    // Trigger IntersectionObserver callback
    await act(async () => {
      ioCallback?.([{ isIntersecting: true } as any], {} as IntersectionObserver);
    });
    // Simulate disconnect and try triggering again
    await act(async () => {
      disconnectMock();
      ioCallback?.([{ isIntersecting: true } as any], {} as IntersectionObserver);
    });

    expect(viewMutateMock).toHaveBeenCalledTimes(1);
    expect(viewMutateMock).toHaveBeenCalledWith("1");
  });
});