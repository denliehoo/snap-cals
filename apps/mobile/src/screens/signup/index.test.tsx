import { fireEvent, render, waitFor } from "@/__tests__/helpers";
import SignupScreen from "./";

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate } as unknown as never;
const mockRoute = {
  key: "Signup",
  name: "Signup" as const,
} as unknown as never;

jest.mock("expo-auth-session", () => ({
  useAutoDiscovery: jest.fn().mockReturnValue(null),
  useAuthRequest: jest.fn().mockReturnValue([null, null, jest.fn()]),
  makeRedirectUri: jest.fn().mockReturnValue("http://localhost:8081"),
  ResponseType: { IdToken: "id_token" },
}));

jest.mock("@/services/api", () => ({
  api: { signup: jest.fn() },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

jest.mock("@/stores/auth.store", () => {
  const mockSignup = jest.fn();
  return {
    useAuthStore: (selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        login: jest.fn(),
        signup: mockSignup,
        googleLogin: jest.fn(),
      };
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
      <SignupScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText("Create your account")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
  });

  it("renders Google sign-in button", async () => {
    const { getByText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText("Continue with Google")).toBeTruthy();
  });

  it("shows error when fields are empty", async () => {
    const { getByText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />,
    );
    fireEvent.press(getByText("Sign Up"));
    await waitFor(() => {
      expect(getByText("Email is required")).toBeTruthy();
      expect(getByText("Password is required")).toBeTruthy();
    });
  });

  it("shows error when password is too short", async () => {
    const { getByText, getByPlaceholderText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />,
    );
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "abc");
    fireEvent.press(getByText("Sign Up"));
    await waitFor(() => {
      expect(getByText("Must be at least 6 characters")).toBeTruthy();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("navigates to verify screen on valid submit", async () => {
    mockSignup.mockResolvedValue("user-456");
    const { getByText, getByPlaceholderText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />,
    );
    fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.press(getByText("Sign Up"));
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith("new@example.com", "password123");
      expect(mockNavigate).toHaveBeenCalledWith("VerifyEmail", {
        userId: "user-456",
      });
    });
  });

  it("navigates to login", async () => {
    const { getByText } = await render(
      <SignupScreen navigation={mockNavigation} route={mockRoute} />,
    );
    fireEvent.press(getByText("Already have an account? Log in"));
    expect(mockNavigate).toHaveBeenCalledWith("Login");
  });
});
