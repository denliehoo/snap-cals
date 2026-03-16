import React from "react";
import SignupScreen from "./";
import { render, fireEvent, waitFor } from "@/__tests__/helpers";

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate } as any;
const mockRoute = { key: "Signup", name: "Signup" as const } as any;

jest.mock("@/services/api", () => ({
  api: { signup: jest.fn() },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

jest.mock("@/stores/auth.store", () => {
  const mockSignup = jest.fn();
  return {
    useAuthStore: (selector?: any) => {
      const state = { login: jest.fn(), signup: mockSignup };
      return selector ? selector(state) : state;
    },
    __mockSignup: mockSignup,
  };
});

const { __mockSignup: mockSignup } = jest.requireMock("@/stores/auth.store");

beforeEach(() => jest.clearAllMocks());

describe("SignupScreen", () => {
  it("renders signup form", async () => {
    const { getByText, getByPlaceholderText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />
    );
    expect(getByText("Create your account")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
  });

  it("shows error when fields are empty", async () => {
    const { getByText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />
    );
    fireEvent.press(getByText("Sign Up"));
    await waitFor(() => {
      expect(getByText("Email and password are required")).toBeTruthy();
    });
  });

  it("shows error when password is too short", async () => {
    const { getByText, getByPlaceholderText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />
    );
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "abc");
    fireEvent.press(getByText("Sign Up"));
    await waitFor(() => {
      expect(getByText("Password must be at least 6 characters")).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("calls signup on valid submit", async () => {
    mockSignup.mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />
    );
    fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Sign Up"));
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith("new@example.com", "password123");
    });
  });

  it("navigates to login", async () => {
    const { getByText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />
    );
    fireEvent.press(getByText("Already have an account? Log in"));
    expect(mockNavigate).toHaveBeenCalledWith("Login");
  });
});
