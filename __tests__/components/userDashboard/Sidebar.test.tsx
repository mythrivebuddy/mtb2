// // import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// // // Mock next/navigation
// // jest.mock("next-auth/react", () => ({
// //   useSession: () => ({
// //     data: {
// //       user: { name: "Test User", image: null },
// //     },
// //     status: "authenticated",
// //   }),
// // }));

// // jest.mock("next/navigation", () => ({
// //   usePathname: jest.fn(),
// // }));
// // import { usePathname } from "next/navigation";

// // // Mock react-query useQuery
// // jest.mock("@tanstack/react-query", () => ({
// //   useQuery: jest.fn(),
// // }));
// // import { useQuery } from "@tanstack/react-query";
// // import Sidebar from "@/components/dashboard/user/Sidebar";

// // // Mock utils
// // jest.mock("@/utils/getInitials", () => ({
// //   getInitials: (name: string) => name.charAt(0),
// // }));

// // describe("Sidebar", () => {
// //   beforeEach(() => {
// //     jest.clearAllMocks();
// //   });

// //   it("renders with default user name when no user provided", () => {
// //     (usePathname as jest.Mock).mockReturnValue("/");

// //     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

// //     render(<Sidebar />);

// //     expect(screen.getByText("Your Name")).toBeInTheDocument();
// //   });

// //   it("renders with user name when provided", () => {
// //     (usePathname as jest.Mock).mockReturnValue("/");

// //     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

// //     render(<Sidebar user={{ id: "1", name: "Faizan" } as any} />);

// //     expect(screen.getByText("Faizan")).toBeInTheDocument();
// //   });

// //   it("toggles mobile menu open and close", () => {
// //     (usePathname as jest.Mock).mockReturnValue("/");

// //     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

// //     render(<Sidebar />);

// //     const toggleButton = screen.getAllByRole("button")[0];


// // const sidebar = screen.getByRole("complementary", { hidden: true });

// // expect(sidebar).toBeInTheDocument();

// // fireEvent.click(toggleButton);
// // expect(sidebar).toHaveClass("translate-x-0");

// // fireEvent.click(toggleButton);
// // expect(sidebar).toBeInTheDocument();

// //   });

// //   it("highlights active NavItem when pathname matches", () => {
// //     (usePathname as jest.Mock).mockReturnValue("/dashboard");

// //     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

// //     render(<Sidebar />);

// //     const dashboardLink = screen.getByRole("link", { name: "Dashboard" });

// //     expect(dashboardLink).toHaveClass("text-jp-orange");
// //   });

// //   it("shows search dropdown with users", async () => {
// //     (usePathname as jest.Mock).mockReturnValue("/");

// //     (useQuery as jest.Mock).mockReturnValue({
// //       data: [{ id: "u1", name: "Alice", image: "" }],
// //       isLoading: false,
// //     });

// //     render(<Sidebar />);

// //     const input = screen.getByPlaceholderText("Search Anything Here...");

// //     fireEvent.change(input, { target: { value: "Alice" } });

// //     await waitFor(() => {
// //       expect(screen.getByText("Alice")).toBeInTheDocument();
// //     });
// //   });

// //   it("shows loading state in search dropdown", () => {
// //     (usePathname as jest.Mock).mockReturnValue("/");

// //     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: true });

// //     render(<Sidebar />);

// //     const input = screen.getByPlaceholderText("Search Anything Here...");

// //     fireEvent.change(input, { target: { value: "test" } });

// //     expect(screen.getByText("Loading...")).toBeInTheDocument();
// //   });

// //   it("shows no users found in search dropdown", () => {
// //     (usePathname as jest.Mock).mockReturnValue("/");

// //     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

// //     render(<Sidebar />);

// //     const input = screen.getByPlaceholderText("Search Anything Here...");

// //     fireEvent.change(input, { target: { value: "unknown" } });

// //     expect(screen.getByText("No users found")).toBeInTheDocument();
// //   });
// // });














// // My code


// import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// // ✅ useSession must be jest.fn() so we can override it per test
// jest.mock("next-auth/react", () => ({
//   useSession: jest.fn(),
// }));

// jest.mock("next/navigation", () => ({
//   usePathname: jest.fn(),
// }));

// jest.mock("@tanstack/react-query", () => ({
//   useQuery: jest.fn(),
// }));

// jest.mock("@/utils/getInitials", () => ({
//   getInitials: (name: string) => name.charAt(0),
// }));

// import { usePathname } from "next/navigation";
// import { useQuery } from "@tanstack/react-query";
// import { useSession } from "next-auth/react";
// import Sidebar from "@/components/dashboard/user/Sidebar";

// // ✅ Default session used by all tests unless overridden
// const defaultSession = {
//   data: { user: { name: "Test User", image: null, userType: "USER" } },
//   status: "authenticated",
// };

// describe("Sidebar", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     (useSession as jest.Mock).mockReturnValue(defaultSession);
//     (usePathname as jest.Mock).mockReturnValue("/");
//     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
//   });

//   it("renders with default user name when no user provided", () => {
//     render(<Sidebar />);
//     expect(screen.getByText("Your Name")).toBeInTheDocument();
//   });

//   it("renders with user name when provided", () => {
//     render(<Sidebar user={{ id: "1", name: "Faizan" } as any} />);
//     expect(screen.getByText("Faizan")).toBeInTheDocument();
//   });

//   it("toggles mobile menu open and close", () => {
//     render(<Sidebar />);

//     const toggleButton = screen.getAllByRole("button")[0];
//     const sidebar = screen.getByRole("complementary", { hidden: true });

//     expect(sidebar).toBeInTheDocument();

//     fireEvent.click(toggleButton);
//     expect(sidebar).toHaveClass("translate-x-0");

//     fireEvent.click(toggleButton);
//     expect(sidebar).toBeInTheDocument();
//   });

//   it("highlights active NavItem when pathname matches", () => {
//     (usePathname as jest.Mock).mockReturnValue("/dashboard");

//     render(<Sidebar />);

//     const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
//     expect(dashboardLink).toHaveClass("text-jp-orange");
//   });

//   it("shows search dropdown with users", async () => {
//     (useQuery as jest.Mock).mockReturnValue({
//       data: [{ id: "u1", name: "Alice", image: "" }],
//       isLoading: false,
//     });

//     render(<Sidebar />);

//     const input = screen.getByPlaceholderText("Search Anything Here...");
//     fireEvent.change(input, { target: { value: "Alice" } });

//     await waitFor(() => {
//       expect(screen.getByText("Alice")).toBeInTheDocument();
//     });
//   });

//   it("shows loading state in search dropdown", () => {
//     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: true });

//     render(<Sidebar />);

//     const input = screen.getByPlaceholderText("Search Anything Here...");
//     fireEvent.change(input, { target: { value: "test" } });

//     expect(screen.getByText("Loading...")).toBeInTheDocument();
//   });

//   it("shows no users found in search dropdown", () => {
//     render(<Sidebar />);

//     const input = screen.getByPlaceholderText("Search Anything Here...");
//     fireEvent.change(input, { target: { value: "unknown" } });

//     expect(screen.getByText("No users found")).toBeInTheDocument();
//   });
// });

// describe("Sidebar - Coach/Solopreneur nav section", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     (usePathname as jest.Mock).mockReturnValue("/");
//     (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
//   });

//   it("does NOT show coach/solopreneur nav section for regular users", () => {
//     (useSession as jest.Mock).mockReturnValue({
//       data: { user: { name: "Regular User", userType: "USER" } },
//       status: "authenticated",
//     });

//     render(<Sidebar />);

//     expect(screen.queryByText("For Coach/Solopreneur")).not.toBeInTheDocument();
//     expect(screen.queryByText("Get a Spotlight")).not.toBeInTheDocument();
//     expect(screen.queryByText("Setup Business Profile")).not.toBeInTheDocument();
//     expect(screen.queryByText("Apply for a Grant")).not.toBeInTheDocument();
//     expect(screen.queryByText("Manage Store")).not.toBeInTheDocument();
//   });

//   it("shows coach/solopreneur nav section for COACH userType", () => {
//     (useSession as jest.Mock).mockReturnValue({
//       data: { user: { name: "Coach User", userType: "COACH" } },
//       status: "authenticated",
//     });

//     render(<Sidebar />);

//     expect(screen.getByText("For Coach/Solopreneur")).toBeInTheDocument();
//     expect(screen.getByText("Get a Spotlight")).toBeInTheDocument();
//     expect(screen.getByText("Setup Business Profile")).toBeInTheDocument();
//     expect(screen.getByText("Apply for a Grant")).toBeInTheDocument();
//     expect(screen.getByText("Get a Profile Audit")).toBeInTheDocument();
//     expect(screen.getByText("Manage Store")).toBeInTheDocument();
//   });

//   it("shows coach/solopreneur nav section for SOLOPRENEUR userType", () => {
//     (useSession as jest.Mock).mockReturnValue({
//       data: { user: { name: "Solo User", userType: "SOLOPRENEUR" } },
//       status: "authenticated",
//     });

//     render(<Sidebar />);

//     expect(screen.getByText("For Coach/Solopreneur")).toBeInTheDocument();
//     expect(screen.getByText("Get a Spotlight")).toBeInTheDocument();
//     expect(screen.getByText("Setup Business Profile")).toBeInTheDocument();
//     expect(screen.getByText("Apply for a Grant")).toBeInTheDocument();
//     expect(screen.getByText("Get a Profile Audit")).toBeInTheDocument();
//     expect(screen.getByText("Manage Store")).toBeInTheDocument();
//   });

//   it("does NOT show coach/solopreneur section when session is unauthenticated", () => {
//     (useSession as jest.Mock).mockReturnValue({
//       data: null,
//       status: "unauthenticated",
//     });

//     render(<Sidebar />);

//     expect(screen.queryByText("For Coach/Solopreneur")).not.toBeInTheDocument();
//     expect(screen.queryByText("Get a Spotlight")).not.toBeInTheDocument();
//   });

//   it("coach section nav links point to correct hrefs", () => {
//     (useSession as jest.Mock).mockReturnValue({
//       data: { user: { name: "Coach User", userType: "COACH" } },
//       status: "authenticated",
//     });

//     render(<Sidebar />);

//     expect(screen.getByRole("link", { name: "Get a Spotlight" })).toHaveAttribute("href", "/dashboard/spotlight");
//     expect(screen.getByRole("link", { name: "Setup Business Profile" })).toHaveAttribute("href", "/dashboard/business-profile");
//     expect(screen.getByRole("link", { name: "Apply for a Grant" })).toHaveAttribute("href", "/dashboard/prosperity");
//     expect(screen.getByRole("link", { name: "Get a Profile Audit" })).toHaveAttribute("href", "/dashboard/buddy-lens");
//     expect(screen.getByRole("link", { name: "Manage Store" })).toHaveAttribute("href", "/dashboard/manage-store");
//   });

//   it("shows coming-soon items for COACH", () => {
//     (useSession as jest.Mock).mockReturnValue({
//       data: { user: { name: "Coach User", userType: "COACH" } },
//       status: "authenticated",
//     });

//     render(<Sidebar />);

//     expect(screen.getByText("Promote Discovery Calls")).toBeInTheDocument();
//     expect(screen.getByText("Promote Webinars")).toBeInTheDocument();
//     expect(screen.getByText("Promote Mini Mastery Programs")).toBeInTheDocument();
//   });
// });


import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ✅ useSession must be jest.fn() so we can override it per test
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/utils/getInitials", () => ({
  getInitials: (name: string) => name.charAt(0),
}));

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/dashboard/user/Sidebar";

// ✅ Default session used by all tests unless overridden
const defaultSession = {
  data: { user: { name: "Test User", image: null, userType: "USER" } },
  status: "authenticated",
};

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue(defaultSession);
    (usePathname as jest.Mock).mockReturnValue("/");
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
  });

  it("renders with default user name when no user provided", () => {
    render(<Sidebar />);
    expect(screen.getByText("Your Name")).toBeInTheDocument();
  });

  it("renders with user name when provided", () => {
    render(<Sidebar user={{ id: "1", name: "Faizan" } as any} />);
    expect(screen.getByText("Faizan")).toBeInTheDocument();
  });

  it("toggles mobile menu open and close", () => {
    render(<Sidebar />);

    const toggleButton = screen.getAllByRole("button")[0];
    const sidebar = screen.getByRole("complementary", { hidden: true });

    expect(sidebar).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(sidebar).toHaveClass("translate-x-0");

    fireEvent.click(toggleButton);
    expect(sidebar).toBeInTheDocument();
  });

  it("highlights active NavItem when pathname matches", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard");

    render(<Sidebar />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveClass("text-jp-orange");
  });

  it("shows search dropdown with users", async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [{ id: "u1", name: "Alice", image: "" }],
      isLoading: false,
    });

    render(<Sidebar />);

    const input = screen.getByPlaceholderText("Search Anything Here...");
    fireEvent.change(input, { target: { value: "Alice" } });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  it("shows loading state in search dropdown", () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: true });

    render(<Sidebar />);

    const input = screen.getByPlaceholderText("Search Anything Here...");
    fireEvent.change(input, { target: { value: "test" } });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows no users found in search dropdown", () => {
    render(<Sidebar />);

    const input = screen.getByPlaceholderText("Search Anything Here...");
    fireEvent.change(input, { target: { value: "unknown" } });

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });
});

describe("Sidebar - Coach/Solopreneur nav section", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue("/");
    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
  });

  it("does NOT show coach/solopreneur nav section for regular users", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Regular User", userType: "USER" } },
      status: "authenticated",
    });

    render(<Sidebar />);

    expect(screen.queryByText("For Coach/Solopreneur")).not.toBeInTheDocument();
    expect(screen.queryByText("Get a Spotlight")).not.toBeInTheDocument();
    expect(screen.queryByText("Setup Business Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Apply for a Grant")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage Your Store")).not.toBeInTheDocument();
  });

  it("shows coach/solopreneur nav section for COACH userType", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Coach User", userType: "COACH" } },
      status: "authenticated",
    });

    render(<Sidebar />);

    expect(screen.getByText("For Coach/Solopreneur")).toBeInTheDocument();
    expect(screen.getByText("Get a Spotlight")).toBeInTheDocument();
    expect(screen.getByText("Setup Business Profile")).toBeInTheDocument();
    expect(screen.getByText("Apply for a Grant")).toBeInTheDocument();
    expect(screen.getByText("Get a Profile Audit")).toBeInTheDocument();
    expect(screen.getByText("Manage Your Store")).toBeInTheDocument();
  });

  it("shows coach/solopreneur nav section for SOLOPRENEUR userType", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Solo User", userType: "SOLOPRENEUR" } },
      status: "authenticated",
    });

    render(<Sidebar />);

    expect(screen.getByText("For Coach/Solopreneur")).toBeInTheDocument();
    expect(screen.getByText("Get a Spotlight")).toBeInTheDocument();
    expect(screen.getByText("Setup Business Profile")).toBeInTheDocument();
    expect(screen.getByText("Apply for a Grant")).toBeInTheDocument();
    expect(screen.getByText("Get a Profile Audit")).toBeInTheDocument();
    expect(screen.getByText("Manage Your Store")).toBeInTheDocument();
  });

  it("does NOT show coach/solopreneur section when session is unauthenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<Sidebar />);

    expect(screen.queryByText("For Coach/Solopreneur")).not.toBeInTheDocument();
    expect(screen.queryByText("Get a Spotlight")).not.toBeInTheDocument();
  });

  it("coach section nav links point to correct hrefs", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Coach User", userType: "COACH" } },
      status: "authenticated",
    });

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Get a Spotlight" })).toHaveAttribute("href", "/dashboard/spotlight");
    expect(screen.getByRole("link", { name: "Setup Business Profile" })).toHaveAttribute("href", "/dashboard/business-profile");
    expect(screen.getByRole("link", { name: "Apply for a Grant" })).toHaveAttribute("href", "/dashboard/prosperity");
    expect(screen.getByRole("link", { name: "Get a Profile Audit" })).toHaveAttribute("href", "/dashboard/buddy-lens");
    expect(screen.getByRole("link", { name: "Manage Your Store" })).toHaveAttribute("href", "/dashboard/manage-store");
  });
});