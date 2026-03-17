import React from "react";
import AiAssistScreen from "./";
import { render, fireEvent, waitFor } from "@/__tests__/helpers";

jest.mock("@/services/api", () => ({
  api: {
    estimateNutrition: jest.fn(),
    chatNutrition: jest.fn(),
  },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("@/stores/settings.store", () => ({
  useSettingsStore: jest.fn((selector) => selector({ discussionMode: false })),
}));

const { api } = jest.requireMock("@/services/api");
const mockNavigate = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe("AiAssistScreen", () => {
  it("renders input, button, and disclaimer", async () => {
    const { getByPlaceholderText, getByText } = await render(<AiAssistScreen />);
    expect(getByPlaceholderText(/grande oat milk latte/)).toBeTruthy();
    expect(getByText("Estimate")).toBeTruthy();
    expect(getByText(/AI estimates may not be exact/)).toBeTruthy();
  });

  it("renders Discussion Mode toggle", async () => {
    const { getByText } = await render(<AiAssistScreen />);
    expect(getByText("Discussion Mode")).toBeTruthy();
    expect(getByText(/clarifying questions/)).toBeTruthy();
  });

  it("disables button when input is empty", async () => {
    const { getByText } = await render(<AiAssistScreen />);
    fireEvent.press(getByText("Estimate"));
    expect(api.estimateNutrition).not.toHaveBeenCalled();
  });

  it("calls API and navigates on success (one-shot)", async () => {
    const mockData = { name: "Latte", calories: 190, protein: 10, carbs: 25, fat: 6, servingSize: "16oz" };
    api.estimateNutrition.mockResolvedValue({ data: mockData });

    const { getByPlaceholderText, getByText } = await render(<AiAssistScreen />);
    fireEvent.changeText(getByPlaceholderText(/grande oat milk latte/), "latte");
    fireEvent.press(getByText("Estimate"));

    await waitFor(() => {
      expect(api.estimateNutrition).toHaveBeenCalledWith("latte", undefined);
      expect(mockNavigate).toHaveBeenCalledWith("EntryForm", { prefill: mockData });
    });
  });

  it("shows error on API failure", async () => {
    api.estimateNutrition.mockRejectedValue({ message: "Network error" });

    const { getByPlaceholderText, getByText } = await render(<AiAssistScreen />);
    fireEvent.changeText(getByPlaceholderText(/grande oat milk latte/), "pizza");
    fireEvent.press(getByText("Estimate"));

    await waitFor(() => {
      expect(getByText("Network error")).toBeTruthy();
    });
  });

  it("shows character counter near limit", async () => {
    const { getByPlaceholderText, getByText } = await render(<AiAssistScreen />);
    fireEvent.changeText(getByPlaceholderText(/grande oat milk latte/), "a".repeat(170));

    await waitFor(() => {
      expect(getByText("170/200")).toBeTruthy();
    });
  });
});
