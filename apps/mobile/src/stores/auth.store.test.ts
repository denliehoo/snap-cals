import * as SecureStore from "expo-secure-store";
import { identifyUser, logoutPurchases } from "@/hooks/use-purchases";
import { useAuthStore } from "./auth.store";

jest.mock("@/hooks/use-purchases", () => ({
  identifyUser: jest.fn().mockResolvedValue(undefined),
  logoutPurchases: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/api", () => ({
  api: {
    login: jest.fn(),
    signup: jest.fn(),
    googleAuth: jest.fn(),
  },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const { api } = jest.requireMock("@/services/api");

const mockUser = { id: "user-1", email: "test@example.com", emailVerified: true, subscriptionTier: "FREE", createdAt: "" };

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ token: null, user: null, isLoading: true, error: null });
});

describe("auth.store RevenueCat integration", () => {
  it("calls identifyUser after setAuth", async () => {
    await useAuthStore.getState().setAuth("tok", mockUser);
    expect(identifyUser).toHaveBeenCalledWith("user-1");
  });

  it("calls identifyUser after restore when token exists", async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce("tok")
      .mockResolvedValueOnce(JSON.stringify(mockUser));

    await useAuthStore.getState().restore();
    expect(identifyUser).toHaveBeenCalledWith("user-1");
  });

  it("does not call identifyUser after restore when no token", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await useAuthStore.getState().restore();
    expect(identifyUser).not.toHaveBeenCalled();
  });

  it("calls logoutPurchases on logout", async () => {
    await useAuthStore.getState().logout();
    expect(logoutPurchases).toHaveBeenCalled();
  });

  it("calls identifyUser after login", async () => {
    api.login.mockResolvedValue({ data: { token: "tok", user: mockUser } });
    await useAuthStore.getState().login("test@example.com", "pass");
    expect(identifyUser).toHaveBeenCalledWith("user-1");
  });

  it("calls identifyUser after googleLogin", async () => {
    api.googleAuth.mockResolvedValue({ data: { token: "tok", user: mockUser } });
    await useAuthStore.getState().googleLogin({ code: "c", clientId: "id", redirectUri: "uri" });
    expect(identifyUser).toHaveBeenCalledWith("user-1");
  });
});
