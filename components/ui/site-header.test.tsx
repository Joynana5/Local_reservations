// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

afterEach(cleanup);

describe("SiteHeader", () => {
  it("shows only the logo link in the guest variant", () => {
    render(<SiteHeader variant="guest" />);
    expect(screen.getByRole("link", { name: "TableNook" }).getAttribute("href")).toBe("/");
    expect(screen.queryByText("Restaurant")).toBeNull();
    expect(screen.queryByRole("link", { name: "Guest site" })).toBeNull();
  });

  it("defaults to the guest variant", () => {
    render(<SiteHeader />);
    expect(screen.queryByText("Restaurant")).toBeNull();
  });

  it("shows the Restaurant label and a Guest site link in the restaurant variant", () => {
    render(<SiteHeader variant="restaurant" />);
    expect(screen.getByText("Restaurant")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Guest site" }).getAttribute("href")).toBe("/");
  });
});
