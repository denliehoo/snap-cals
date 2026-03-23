import { fireEvent, render } from "@/__tests__/helpers";
import UsageLimitModal from "./usage-limit-modal";

jest.mock("@/services/api", () => ({
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const mockOnClose = jest.fn();
const mockOnUpgrade = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe("UsageLimitModal", () => {
  const props = {
    visible: true,
    onClose: mockOnClose,
    resetsAt: "2026-03-24T00:00:00Z",
    onUpgrade: mockOnUpgrade,
  };

  it("renders limit message and buttons", async () => {
    const { getByText } = await render(<UsageLimitModal {...props} />);
    expect(getByText("Daily AI Limit Reached")).toBeTruthy();
    expect(getByText("Upgrade to Pro")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();
  });

  it("calls onClose and onUpgrade when Upgrade pressed", async () => {
    const { getByText } = await render(<UsageLimitModal {...props} />);
    fireEvent.press(getByText("Upgrade to Pro"));
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnUpgrade).toHaveBeenCalled();
  });

  it("calls onClose when Close pressed", async () => {
    const { getByText } = await render(<UsageLimitModal {...props} />);
    fireEvent.press(getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnUpgrade).not.toHaveBeenCalled();
  });
});
