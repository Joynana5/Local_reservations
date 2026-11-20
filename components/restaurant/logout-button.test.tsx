// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const logOutAction = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions/auth-actions", () => ({ logOutAction }));

import { LogoutButton } from "./logout-button";

afterEach(() => {
  cleanup();
  logOutAction.mockReset();
});

describe("LogoutButton", () => {
  it("shows a logout error and allows retrying on the same page", async () => {
    logOutAction.mockResolvedValue({
      ok: false,
      message: "We couldn't log you out. Please try again.",
    });
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "We couldn't log you out. Please try again.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    await waitFor(() => expect(logOutAction).toHaveBeenCalledTimes(2));
  });
});
