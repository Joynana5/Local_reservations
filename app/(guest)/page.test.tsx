// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./page";

afterEach(cleanup);

describe("Start page (H0)", () => {
  it("shows the hero heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your favorite local table, no phone call needed.",
      }),
    ).toBeTruthy();
  });

  it("links 'Find a table' to the search page", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Find a table" }).getAttribute("href")).toBe("/search");
  });

  it("links 'Set up or log in' to the restaurant login", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Set up or log in" }).getAttribute("href")).toBe("/login");
  });

  it("offers both audiences with three bullets each", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "How will you use TableNook?" })).toBeTruthy();
    for (const name of ["I'm looking for a table", "I run a restaurant"]) {
      const card = screen.getByRole("heading", { name }).closest("section");
      expect(card?.querySelectorAll("li")).toHaveLength(3);
    }
  });
});
