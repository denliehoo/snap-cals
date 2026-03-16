import React from "react";
import SettingsScreen from "./";
import { render } from "../../__tests__/helpers";

const mockLogout = jest.fn();
const mockToggleTheme = jest.fn();
const mockToggleDiscussion = jest.fn();

jest.mock("../../stores/auth.store", () => ({
  useAuthStore: () => ({ logout: mockLogout }),
}));

jest.mock("../../stores/settings.store", () => ({
  useSettingsStore: () => ({ discussionMode: false, toggleDiscussionMode: mockToggleDiscussion }),
}));

jest.mock("../../contexts/theme-context", () => {
  const actual = jest.requireActual("../../contexts/theme-context");
  return {
    ...actual,
    useTheme: () => ({ isDark: false, toggle: mockToggleTheme }),
  };
});

jest.mock("../../services/api", () => ({
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe("SettingsScreen", () => {
  it("renders all sections", async () => {
    const { getByText } = await render(<SettingsScreen />);
    expect(getByText("Appearance")).toBeTruthy();
    expect(getByText("Dark Mode")).toBeTruthy();
    expect(getByText("AI")).toBeTruthy();
    expect(getByText("Discussion Mode")).toBeTruthy();
    expect(getByText("Account")).toBeTruthy();
    expect(getByText("Logout")).toBeTruthy();
  });
});
