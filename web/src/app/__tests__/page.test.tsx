/* eslint-disable @next/next/no-img-element */
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePage from "../page";
import { useQuery } from "@tanstack/react-query";

// Mock useQuery
jest.mock("@tanstack/react-query", () => ({
    useQuery: jest.fn(),
}));

// Mock next/image
jest.mock("next/image", () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

// Mock next/link
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock API
jest.mock("@/lib/api", () => ({
    getStatsSummary: jest.fn(),
}));

// Mock d3
jest.mock("d3", () => ({
    select: jest.fn(() => ({
        selectAll: jest.fn().mockReturnThis(),
        remove: jest.fn().mockReturnThis(),
        append: jest.fn().mockReturnThis(),
        attr: jest.fn().mockReturnThis(),
        data: jest.fn().mockReturnThis(),
        enter: jest.fn().mockReturnThis(),
    })),
    scaleBand: jest.fn().mockReturnValue({
        domain: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        padding: jest.fn().mockReturnThis(),
        bandwidth: jest.fn().mockReturnValue(10),
    }),
    scaleLinear: jest.fn().mockReturnValue({
        domain: jest.fn().mockReturnThis(),
        nice: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        max: jest.fn().mockReturnValue(100),
    }),
    max: jest.fn(() => 100),
}));

describe("HomePage", () => {
    it("renders correctly with loaded stats", async () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: { total_conflicts: 123, total_casualties_best: 5000000 },
            isLoading: false,
        });

        await act(async () => {
            render(<HomePage />);
        });

        expect(screen.getByText("A Visual History")).toBeInTheDocument();

        // Check if StatsChart receives data (implicit check via D3 rendering which is hard in integration, 
        // but at least we check if the component didn't crash). 
        // We can check for "Events Documented" text if it's rendered by StatsChart? 
        // StatsChart renders SVG rects.
        // Let's verify the main title is present.
        expect(screen.getByText("The Conflicts of")).toBeInTheDocument();
    });
});
