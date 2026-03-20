import { fireEvent, render, waitFor } from "@/__tests__/helpers";
import GoalsScreen from "./";

jest.mock("@/services/api", () => ({
  api: {
    getGoals: jest.fn(),
    upsertGoals: jest.fn().mockResolvedValue({ data: {} }),
  },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const mockNavigate = jest.fn();
let mockRouteParams: Record<string, unknown> | undefined;

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const { api } = jest.requireMock("@/services/api");

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = undefined;
});

describe("GoalsScreen", () => {
  it("renders form with fetched goals", async () => {
    api.getGoals.mockResolvedValue({
      data: {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
      },
    });
    const { getByText, getByDisplayValue } = await render(<GoalsScreen />);
    await waitFor(() => {
      expect(getByText("Daily Goals")).toBeTruthy();
    });
    expect(getByDisplayValue("2000")).toBeTruthy();
    expect(getByDisplayValue("150")).toBeTruthy();
    expect(getByDisplayValue("250")).toBeTruthy();
    expect(getByDisplayValue("65")).toBeTruthy();
  });

  it("falls back to defaults when API fails", async () => {
    api.getGoals.mockRejectedValue(new Error("Network error"));
    const { getByDisplayValue } = await render(<GoalsScreen />);
    await waitFor(() => {
      expect(getByDisplayValue("2000")).toBeTruthy();
    });
    expect(getByDisplayValue("150")).toBeTruthy();
    expect(getByDisplayValue("250")).toBeTruthy();
    expect(getByDisplayValue("65")).toBeTruthy();
  });

  it("calls upsertGoals on save", async () => {
    api.getGoals.mockResolvedValue({
      data: {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
      },
    });
    const { getByText, getByDisplayValue } = await render(<GoalsScreen />);
    await waitFor(() => expect(getByDisplayValue("2000")).toBeTruthy());

    fireEvent.changeText(getByDisplayValue("2000"), "2500");
    fireEvent.press(getByText("Save Goals"));

    await waitFor(() => {
      expect(api.upsertGoals).toHaveBeenCalledWith({
        dailyCalories: 2500,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
      });
    });
  });

  it("shows validation error for negative values", async () => {
    api.getGoals.mockResolvedValue({
      data: {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
      },
    });
    const { getByText, getByDisplayValue } = await render(<GoalsScreen />);
    await waitFor(() => expect(getByDisplayValue("2000")).toBeTruthy());

    fireEvent.changeText(getByDisplayValue("2000"), "-100");
    fireEvent.press(getByText("Save Goals"));

    await waitFor(() => {
      expect(
        getByText("Calories (kcal) must be a valid number >= 0"),
      ).toBeTruthy();
    });
    expect(api.upsertGoals).not.toHaveBeenCalled();
  });

  it("renders 'Let AI set my goals' button", async () => {
    api.getGoals.mockResolvedValue({
      data: {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
      },
    });
    const { getByText } = await render(<GoalsScreen />);
    await waitFor(() => expect(getByText("Daily Goals")).toBeTruthy());

    expect(getByText(/Let AI set my goals/)).toBeTruthy();
  });

  it("navigates to GoalCoach on AI button press", async () => {
    api.getGoals.mockResolvedValue({
      data: {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
      },
    });
    const { getByText } = await render(<GoalsScreen />);
    await waitFor(() => expect(getByText("Daily Goals")).toBeTruthy());

    fireEvent.press(getByText(/Let AI set my goals/));

    expect(mockNavigate).toHaveBeenCalledWith("GoalCoach");
  });

  it("pre-fills form from route params", async () => {
    mockRouteParams = {
      prefill: {
        dailyCalories: 1800,
        dailyProtein: 140,
        dailyCarbs: 200,
        dailyFat: 60,
        explanation: "AI recommendation",
      },
    };

    const { getByDisplayValue } = await render(<GoalsScreen />);

    await waitFor(() => {
      expect(getByDisplayValue("1800")).toBeTruthy();
    });
    expect(getByDisplayValue("140")).toBeTruthy();
    expect(getByDisplayValue("200")).toBeTruthy();
    expect(getByDisplayValue("60")).toBeTruthy();
    expect(api.getGoals).not.toHaveBeenCalled();
  });

  it("saves pre-filled values", async () => {
    mockRouteParams = {
      prefill: {
        dailyCalories: 1800,
        dailyProtein: 140,
        dailyCarbs: 200,
        dailyFat: 60,
        explanation: "AI recommendation",
      },
    };

    const { getByText, getByDisplayValue } = await render(<GoalsScreen />);
    await waitFor(() => expect(getByDisplayValue("1800")).toBeTruthy());

    fireEvent.press(getByText("Save Goals"));

    await waitFor(() => {
      expect(api.upsertGoals).toHaveBeenCalledWith({
        dailyCalories: 1800,
        dailyProtein: 140,
        dailyCarbs: 200,
        dailyFat: 60,
      });
    });
  });
});
