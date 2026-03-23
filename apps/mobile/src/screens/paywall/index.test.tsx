import { fireEvent, render, waitFor } from "@/__tests__/helpers";
import Purchases from "react-native-purchases";
import PaywallScreen from "./";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock("@/services/api", () => ({
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const mockPackage = {
  product: { priceString: "$4.99", identifier: "snapcals_pro_monthly" },
  identifier: "$rc_monthly",
} as never;

beforeEach(() => jest.clearAllMocks());

describe("PaywallScreen", () => {
  it("shows error state when offerings fail", async () => {
    (Purchases.getOfferings as jest.Mock).mockRejectedValueOnce(new Error("fail"));
    const { getByText } = await render(<PaywallScreen />);
    await waitFor(() => {
      expect(getByText("Subscriptions not available right now")).toBeTruthy();
    });
    expect(getByText("Try Again")).toBeTruthy();
  });

  it("shows error state when offerings are empty", async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({ current: null });
    const { getByText } = await render(<PaywallScreen />);
    await waitFor(() => {
      expect(getByText("Subscriptions not available right now")).toBeTruthy();
    });
  });

  it("renders product info when offerings load", async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({
      current: { monthly: mockPackage, availablePackages: [mockPackage] },
    });
    const { getByText } = await render(<PaywallScreen />);
    await waitFor(() => {
      expect(getByText("Unlock Pro")).toBeTruthy();
    });
    expect(getByText("$4.99")).toBeTruthy();
    expect(getByText("Subscribe")).toBeTruthy();
    expect(getByText("Restore Purchases")).toBeTruthy();
    expect(getByText("Unlimited AI food lookups")).toBeTruthy();
  });

  it("calls purchasePackage on subscribe", async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({
      current: { monthly: mockPackage, availablePackages: [mockPackage] },
    });
    (Purchases.purchasePackage as jest.Mock).mockResolvedValueOnce({
      customerInfo: { entitlements: { active: { pro: true } } },
    });
    const { getByText } = await render(<PaywallScreen />);
    await waitFor(() => expect(getByText("Subscribe")).toBeTruthy());

    fireEvent.press(getByText("Subscribe"));

    await waitFor(() => {
      expect(Purchases.purchasePackage).toHaveBeenCalledWith(mockPackage);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("handles user cancellation silently", async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({
      current: { monthly: mockPackage, availablePackages: [mockPackage] },
    });
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({ userCancelled: true });
    const { getByText, queryByText } = await render(<PaywallScreen />);
    await waitFor(() => expect(getByText("Subscribe")).toBeTruthy());

    fireEvent.press(getByText("Subscribe"));

    await waitFor(() => {
      expect(queryByText("Purchase failed. Please try again.")).toBeNull();
    });
  });

  it("calls restorePurchases on restore", async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({
      current: { monthly: mockPackage, availablePackages: [mockPackage] },
    });
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce({
      entitlements: { active: { pro: true } },
    });
    const { getByText } = await render(<PaywallScreen />);
    await waitFor(() => expect(getByText("Restore Purchases")).toBeTruthy());

    fireEvent.press(getByText("Restore Purchases"));

    await waitFor(() => {
      expect(Purchases.restorePurchases).toHaveBeenCalled();
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("shows message when restore finds no subscription", async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce({
      current: { monthly: mockPackage, availablePackages: [mockPackage] },
    });
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce({
      entitlements: { active: {} },
    });
    const { getByText } = await render(<PaywallScreen />);
    await waitFor(() => expect(getByText("Restore Purchases")).toBeTruthy());

    fireEvent.press(getByText("Restore Purchases"));

    await waitFor(() => {
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });
});
