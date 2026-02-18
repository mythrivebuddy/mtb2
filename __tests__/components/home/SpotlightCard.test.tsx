import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotlightCard from "@/components/home/SpotlightCard";
import { useQuery, useMutation } from "@tanstack/react-query";

jest.mock("@tanstack/react-query");

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

let ioCallback: IntersectionObserverCallback | null = null;
let isDisconnected = false;

class MockIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb;
    isDisconnected = false;
  }
  observe = jest.fn();
  disconnect = jest.fn(() => {
    isDisconnected = true;
  });
}
(global as any).IntersectionObserver = MockIntersectionObserver;

describe("SpotlightCard Component", () => {
  const fullData = {
    id: "1",
    user: {
      name: "John Doe",
      userBusinessProfile: {
        featuredWorkTitle: "Marketing Coordinator",
        featuredWorkImage: "/test-image.jpg",
        featuredWorkDesc: "Awesome developer!",
        priorityContactLink: "https://example.com",
      },
    },
  };

  let viewMutateMock: jest.Mock;
  let clickMutateMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    viewMutateMock = jest.fn();
    clickMutateMock = jest.fn();

    let call = 0;
    (useMutation as jest.Mock).mockImplementation(() => {
      call++;
      return {
        mutate: call === 1 ? viewMutateMock : clickMutateMock,
      };
    });
  });

  it("fires view mutation only once", async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: fullData,
      isLoading: false,
    });

    render(<SpotlightCard />);

    await act(async () => {
      if (!isDisconnected) {
        ioCallback?.([{ isIntersecting: true } as any], {} as any);
      }
      if (!isDisconnected) {
        ioCallback?.([{ isIntersecting: true } as any], {} as any);
      }
    });

    expect(viewMutateMock).toHaveBeenCalledTimes(1);
    expect(viewMutateMock).toHaveBeenCalledWith("1");
  });
});
