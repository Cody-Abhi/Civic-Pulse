import { describe, it, expect } from "vitest";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("bg-danger");
  });

  it("applies size classes", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("h-8");
  });

  it("forwards disabled attribute", () => {
    render(<Button disabled>No</Button>);
    const btn = screen.getByRole("button", { name: "No" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders as child element when asChild", () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toBeDefined();
    expect(link.tagName).toBe("A");
  });
});
