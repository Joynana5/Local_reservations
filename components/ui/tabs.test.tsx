// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Tabs, type TabItem } from "./tabs";

afterEach(cleanup);

const items: TabItem[] = [
  { id: "reservations", label: "Reservations" },
  { id: "waitlist", label: "Waitlist", disabled: true },
  { id: "settings", label: "Settings" },
];

function Harness({ tabs = items }: { tabs?: TabItem[] }) {
  const [active, setActive] = useState("reservations");
  return <Tabs tabs={tabs} activeId={active} onChange={setActive} label="Dashboard" />;
}

describe("Tabs", () => {
  it("exposes a labelled tablist with the active tab selected", () => {
    render(<Harness />);
    expect(screen.getByRole("tablist", { name: "Dashboard" })).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: "Reservations" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      screen.getByRole("tab", { name: "Settings" }).getAttribute("aria-selected"),
    ).toBe("false");
  });

  it("keeps only the active tab in the tab order", () => {
    render(<Harness />);
    expect(screen.getByRole("tab", { name: "Reservations" }).tabIndex).toBe(0);
    expect(screen.getByRole("tab", { name: "Settings" }).tabIndex).toBe(-1);
  });

  it("marks a disabled tab as aria-disabled and shows a Soon label", () => {
    render(<Harness />);
    const disabled = screen.getByRole("tab", { name: /Waitlist/ });
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(disabled.textContent).toContain("Soon");
  });

  it("moves to the next enabled tab with ArrowRight, skipping disabled tabs", () => {
    render(<Harness />);
    const first = screen.getByRole("tab", { name: "Reservations" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    const settings = screen.getByRole("tab", { name: "Settings" });
    expect(document.activeElement).toBe(settings);
    expect(settings.getAttribute("aria-selected")).toBe("true");
  });

  it("wraps around with ArrowLeft from the first tab", () => {
    render(<Harness />);
    const first = screen.getByRole("tab", { name: "Reservations" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Settings" }));
  });

  it("jumps to the last and first enabled tab with End and Home", () => {
    render(<Harness />);
    const first = screen.getByRole("tab", { name: "Reservations" });
    first.focus();
    fireEvent.keyDown(first, { key: "End" });
    const settings = screen.getByRole("tab", { name: "Settings" });
    expect(document.activeElement).toBe(settings);
    fireEvent.keyDown(settings, { key: "Home" });
    expect(document.activeElement).toBe(first);
  });

  it("selects a tab when it is clicked", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Settings" }));
    expect(
      screen.getByRole("tab", { name: "Settings" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("renders link tabs with their href", () => {
    render(
      <Tabs
        label="Account"
        activeId="login"
        tabs={[
          { id: "login", label: "Log in", href: "/login" },
          { id: "signup", label: "Sign up", href: "/signup" },
        ]}
      />,
    );
    expect(screen.getByRole("tab", { name: "Sign up" }).getAttribute("href")).toBe("/signup");
  });
});
