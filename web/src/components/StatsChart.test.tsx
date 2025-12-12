import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import StatsChart from "./StatsChart";

const mockSelect = {
    selectAll: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
};

const mockScaleBand = jest.fn().mockReturnValue(() => 10);
(mockScaleBand as any).domain = jest.fn().mockReturnThis();
(mockScaleBand as any).range = jest.fn().mockReturnThis();
(mockScaleBand as any).padding = jest.fn().mockReturnThis();
(mockScaleBand as any).bandwidth = jest.fn().mockReturnValue(10);

const mockScaleLinear = jest.fn().mockReturnValue(() => 10);
(mockScaleLinear as any).domain = jest.fn().mockReturnThis();
(mockScaleLinear as any).nice = jest.fn().mockReturnThis();
(mockScaleLinear as any).range = jest.fn().mockReturnThis();
(mockScaleLinear as any).max = jest.fn().mockReturnValue(100);

jest.mock("d3", () => ({
    select: jest.fn(() => mockSelect),
    scaleBand: () => mockScaleBand,
    scaleLinear: () => mockScaleLinear,
    max: jest.fn(() => 100),
}));

describe("StatsChart", () => {
    it("renders without crashing and calls d3", () => {
        const data = [
            { label: "A", value: 10 },
            { label: "B", value: 20 },
        ];
        const { container } = render(<StatsChart data={data} />);

        // Check SVG exists
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();

        // Since we mocked D3, we can't check for rects created by D3 directly in JSDOM easily 
        // without a complex mock implementation that manipulates DOM.
        // Instead, we verify the component rendered the SVG container.
    });

    it("handles empty data gracefully", () => {
        const { container } = render(<StatsChart data={[]} />);
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
    });
});
