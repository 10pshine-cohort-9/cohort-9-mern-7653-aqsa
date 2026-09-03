import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";
jest.mock("../components/Dashboard/Sidebar", () => () => (
  <div data-testid="sidebar">Sidebar</div>
));
jest.mock("../components/Dashboard/Header", () => () => (
  <div data-testid="header">Header</div>
));
jest.mock("../components/Dashboard/Stats", () => () => (
  <div data-testid="stats">Stats</div>
));
jest.mock("../components/Dashboard/ContinueWriting", () => () => (
  <div data-testid="continue-writing">ContinueWriting</div>
));
jest.mock("../components/Dashboard/TasksCard", () => () => (
  <div data-testid="tasks-card">TasksCard</div>
));
describe("Dashboard Page", () => {
  test("renders all child components without crashing", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("stats")).toBeInTheDocument();
    expect(screen.getByTestId("continue-writing")).toBeInTheDocument();
    expect(screen.getByTestId("tasks-card")).toBeInTheDocument();
  });
});