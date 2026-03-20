import { fireEvent, render, waitFor } from "@/__tests__/helpers";
import LoginScreen from "./";

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate } as unknown as never;
const mockRoute = {
  key: "Login",
  name: "Login" as const,
} as unknown as never;

jest.mock("@/services/api", () => ({
  api: { login: jest.fn() },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

jest.mock("@/stores/auth.store", () => {
  const mockLogin = jest.fn();
  return {
    useAuthStore: (selector?: (s: Record<string, unknown>) => unknown) => {
      const state = { login: mockLogin, signup: jest.fn() };
      return selector ? selector(state) : state;
    },
    __mockLogin: mockLogin,
  };
});

const { __mockLogin: mockLogin } = jest.requireMock("@/stores/auth.store");

beforeEach(() => jest.clearAllMocks());

describe("LoginScreen", () => {
  it("renders login form", async () => {
    const { getByText, getByPlaceholderText } = await render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText("Log in to your account")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Log In")).toBeTruthy();
  });

  it("shows error when fields are empty", async () => {
    const { getByText } = await render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />,
    );
    fireEvent.press(getByText("Log In"));
    await waitFor(() => {
      expect(getByText("Email is required")).toBeTruthy();
      expect(getByText("Password is required")).toBeTruthy();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login on valid submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />,
    );
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Log In"));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("shows error on login failure", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));
    const { getByText, getByPlaceholderText } = await render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />,
    );
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrong");
    fireEvent.press(getByText("Log In"));
    await waitFor(() => {
      expect(getByText("Invalid credentials")).toBeTruthy();
    });
  });

  it("navigates to signup", async () => {
    const { getByText } = await render(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />,
    );
    fireEvent.press(getByText("Don't have an account? Sign up"));
    expect(mockNavigate).toHaveBeenCalledWith("Signup");
  });
});
