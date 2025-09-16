// __tests__/JPCard.test.tsx
import JPCard from "@/components/dashboard/JPCard";
import { render, screen } from "@testing-library/react";

import React from "react";

// Mock Next.js Image component
jest.mock("next/image", () => (props: any) => {
  // Return a simple img element with all props
  return <img {...props} />;
});

describe("JPCard Component", () => {
  it("renders value and label correctly", () => {
    render(<JPCard value={100} label="Total JP" />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Total JP")).toBeInTheDocument();
  });

it("renders 0 when value is undefined", () => {
  render(<JPCard value={undefined as unknown as number} label="Total JP" />);

  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getByText("Total JP")).toBeInTheDocument();
});

  it("renders the image with correct src and alt", () => {
    render(<JPCard value={50} label="Points" />);

    const img = screen.getByAltText("Icon") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/Pearls.png");
  });
});
