import { fireEvent, render, waitFor } from "@/__tests__/helpers";
import GoalCoachScreen from "./";

jest.mock("@/services/api", () => ({
  api: {
    goalCoach: jest.fn(),
  },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const { api } = jest.requireMock("@/services/api");

beforeEach(() => jest.clearAllMocks());

describe("GoalCoachScreen", () => {
  it("renders chat UI with greeting after delay", async () => {
    const { getByPlaceholderText, getByText } = await render(
      <GoalCoachScreen />,
    );

    expect(getByPlaceholderText("Reply...")).toBeTruthy();

    await waitFor(() => {
      expect(getByText(/What's your goal/)).toBeTruthy();
      expect(getByText("Send")).toBeTruthy();
    });
  });

  it("sends a message and displays AI question response", async () => {
    api.goalCoach.mockResolvedValue({
      data: { message: "How active are you?" },
    });

    const { getByPlaceholderText, getByText } = await render(
      <GoalCoachScreen />,
    );

    await waitFor(() => expect(getByText(/What's your goal/)).toBeTruthy());

    fireEvent.changeText(
      getByPlaceholderText("Reply..."),
      "I want to lose weight",
    );
    fireEvent.press(getByText("Send"));

    await waitFor(() => {
      expect(api.goalCoach).toHaveBeenCalled();
      expect(getByText("How active are you?")).toBeTruthy();
    });
  });

  it("shows recommendation with confirm button", async () => {
    api.goalCoach.mockResolvedValue({
      data: {
        message: "Here are your targets",
        recommendation: {
          dailyCalories: 2200,
          dailyProtein: 160,
          dailyCarbs: 250,
          dailyFat: 70,
          explanation: "Based on your stats",
        },
      },
    });

    const { getByPlaceholderText, getByText } = await render(
      <GoalCoachScreen />,
    );

    await waitFor(() => expect(getByText(/What's your goal/)).toBeTruthy());

    fireEvent.changeText(
      getByPlaceholderText("Reply..."),
      "male 28 80kg 178cm active",
    );
    fireEvent.press(getByText("Send"));

    await waitFor(() => {
      expect(getByText(/2200/)).toBeTruthy();
      expect(getByText("Set as my goals")).toBeTruthy();
    });
  });

  it("navigates to Goals screen on confirm", async () => {
    const recommendation = {
      dailyCalories: 2200,
      dailyProtein: 160,
      dailyCarbs: 250,
      dailyFat: 70,
      explanation: "Based on your stats",
    };
    api.goalCoach.mockResolvedValue({
      data: { message: "Here you go", recommendation },
    });

    const { getByPlaceholderText, getByText } = await render(
      <GoalCoachScreen />,
    );

    await waitFor(() => expect(getByText(/What's your goal/)).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Reply..."), "info");
    fireEvent.press(getByText("Send"));

    await waitFor(() => expect(getByText("Set as my goals")).toBeTruthy());

    fireEvent.press(getByText("Set as my goals"));

    expect(mockNavigate).toHaveBeenCalledWith("Goals", {
      prefill: recommendation,
    });
  });

  it("shows error message on API failure", async () => {
    api.goalCoach.mockRejectedValue({ message: "Network error" });

    const { getByPlaceholderText, getByText } = await render(
      <GoalCoachScreen />,
    );

    await waitFor(() => expect(getByText(/What's your goal/)).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Reply..."), "hello");
    fireEvent.press(getByText("Send"));

    await waitFor(() => {
      expect(getByText(/Network error/)).toBeTruthy();
    });
  });

  it("does not send when input is empty", async () => {
    const { getByText } = await render(<GoalCoachScreen />);

    await waitFor(() => expect(getByText(/What's your goal/)).toBeTruthy());

    fireEvent.press(getByText("Send"));

    expect(api.goalCoach).not.toHaveBeenCalled();
  });
});
