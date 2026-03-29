import { SubscriptionTier } from "@snap-cals/shared";
import Purchases from "react-native-purchases";
import { fireEvent, render } from "@/__tests__/helpers";
import SettingsScreen from "./";

const mockLogout = jest.fn();
const mockToggleTheme = jest.fn();
const mockToggleDiscussion = jest.fn();
const mockNavigate = jest.fn();

let mockTier = SubscriptionTier.FREE;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ logout: mockLogout }),
}));

const mockSetWeightUnit = jest.fn();

jest.mock("@/stores/settings.store", () => ({
  useSettingsStore: () => ({
    discussionMode: false,
    toggleDiscussionMode: mockToggleDiscussion,
    weightUnit: "kg",
    setWeightUnit: mockSetWeightUnit,
  }),
}));

jest.mock("@/stores/usage.store", () => ({
  useUsageStore: () => ({ used: 1, limit: 3, tier: mockTier }),
}));

jest.mock("@/contexts/theme-context", () => {
  const actual = jest.requireActual("../../contexts/theme-context");
  return {
    ...actual,
    useTheme: () => ({ isDark: false, toggle: mockToggleTheme }),
  };
});

jest.mock("@/services/api", () => ({
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockTier = SubscriptionTier.FREE;
});

describe("SettingsScreen", () => {
  it("renders all sections", async () => {
    const { getByText } = await render(<SettingsScreen />);
    expect(getByText("Preferences")).toBeTruthy();
    expect(getByText("Dark Mode")).toBeTruthy();
    expect(getByText("Weight Unit: kg")).toBeTruthy();
    expect(getByText("My Goals")).toBeTruthy();
    expect(getByText("AI")).toBeTruthy();
    expect(getByText("Discussion Mode")).toBeTruthy();
    expect(getByText("Subscription")).toBeTruthy();
    expect(getByText("Account")).toBeTruthy();
    expect(getByText("Logout")).toBeTruthy();
  });

  it("shows Plan: Free and Upgrade for free users", async () => {
    const { getByText } = await render(<SettingsScreen />);
    expect(getByText("Plan: Free")).toBeTruthy();
    expect(getByText("AI Lookups Today: 1 / 3")).toBeTruthy();
    expect(getByText("Upgrade to Pro")).toBeTruthy();
  });

  it("navigates to Paywall on Upgrade press", async () => {
    const { getByText } = await render(<SettingsScreen />);
    fireEvent.press(getByText("Upgrade to Pro"));
    expect(mockNavigate).toHaveBeenCalledWith("Paywall");
  });

  it("shows Plan: Pro and Manage Subscription for pro users", async () => {
    mockTier = SubscriptionTier.PRO;
    const { getByText, queryByText } = await render(<SettingsScreen />);
    expect(getByText("Plan: Pro")).toBeTruthy();
    expect(getByText("Manage Subscription")).toBeTruthy();
    expect(queryByText("Upgrade to Pro")).toBeNull();
    expect(queryByText(/AI Lookups Today/)).toBeNull();
  });

  it("calls showManageSubscriptions on Manage press", async () => {
    mockTier = SubscriptionTier.PRO;
    const { getByText } = await render(<SettingsScreen />);
    fireEvent.press(getByText("Manage Subscription"));
    expect(Purchases.showManageSubscriptions).toHaveBeenCalled();
  });
});
