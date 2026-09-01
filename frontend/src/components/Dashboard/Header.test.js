import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Header from "./Header";
import api from "../../api/axios";
jest.mock("../../api/axios", () => ({
  get: jest.fn(),
}));
describe("Header Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("fetches profile and displays 'Good morning' before 12 PM", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-29T09:00:00"));
    api.get.mockResolvedValueOnce({
      data: { success: true, user: { username: "Alice" } },
    });
    render(<Header />);
    await waitFor(() => {
      expect(screen.getByRole("heading")).toHaveTextContent("Good morning, Alice!");
    });
    jest.useRealTimers();
  });
  test("displays 'Good afternoon' between 12 PM and 6 PM", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-29T14:00:00"));
    api.get.mockResolvedValueOnce({
      data: { success: true, user: { username: "Bob" } },
    });
    render(<Header />);
    await waitFor(() => {
      expect(screen.getByRole("heading")).toHaveTextContent("Good afternoon, Bob!");
    });
    jest.useRealTimers();
  });
  test("displays 'Good evening' after 6 PM", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-29T20:00:00"));
    api.get.mockResolvedValueOnce({
      data: { success: true, user: { username: "Charlie" } },
    });
    render(<Header />);
    await waitFor(() => {
      expect(screen.getByRole("heading")).toHaveTextContent("Good evening, Charlie!");
    });
    jest.useRealTimers();
  });
  test("handles API error gracefully without crashing and hides username", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockRejectedValueOnce(new Error("Network Error"));
    render(<Header />);
    await waitFor(() => {
      expect(screen.getByRole("heading")).toHaveTextContent(/Good/);
      expect(screen.getByRole("heading")).not.toHaveTextContent(",");
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch profile name:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});