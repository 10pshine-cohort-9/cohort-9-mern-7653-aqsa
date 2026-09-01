import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Auth from "./Auth";
jest.mock("../components/Auth/SignInForm", () => () => (
  <div data-testid="sign-in-form">Sign In Form Component</div>
));
jest.mock("../components/Auth/SignUpForm", () => () => (
  <div data-testid="sign-up-form">Sign Up Form Component</div>
));
describe("Auth Page", () => {
  test("renders sign-in mode by default", () => {
    render(<Auth />);
    expect(screen.getByRole("heading", { name: /notes app/i })).toBeInTheDocument();
    expect(screen.getByTestId("sign-in-form")).toBeInTheDocument();
    expect(screen.queryByTestId("sign-up-form")).not.toBeInTheDocument();
    const signInTab = screen.getByRole("button", { name: /sign in/i });
    expect(signInTab).toHaveClass("text-[#0040df]");
  });
  test("switches to sign-up form when Create Account tab is clicked", async () => {
    render(<Auth />);
    const createAccountTab = screen.getByRole("button", { name: /create account/i });
    await userEvent.click(createAccountTab);
    expect(screen.getByTestId("sign-up-form")).toBeInTheDocument();
    expect(screen.queryByTestId("sign-in-form")).not.toBeInTheDocument();
    expect(createAccountTab).toHaveClass("text-[#0040df]");
  });
  test("switches back to sign-in form when Sign In tab is clicked", async () => {
    render(<Auth />);
    const createAccountTab = screen.getByRole("button", { name: /create account/i });
    const signInTab = screen.getByRole("button", { name: /sign in/i });
    await userEvent.click(createAccountTab);
    expect(screen.getByTestId("sign-up-form")).toBeInTheDocument();
    await userEvent.click(signInTab);
    expect(screen.getByTestId("sign-in-form")).toBeInTheDocument();
    expect(screen.queryByTestId("sign-up-form")).not.toBeInTheDocument();
  });
  test("renders terms and privacy links", () => {
    render(<Auth />);
    expect(screen.getByRole("link", { name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /privacy policy/i })).toBeInTheDocument();
  });
});