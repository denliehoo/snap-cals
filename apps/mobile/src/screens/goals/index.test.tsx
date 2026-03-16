import React from "react";
import GoalsScreen from "./";
import { render, fireEvent, waitFor } from "@/__tests__/helpers";

jest.mock("@/services/api", () => ({
  api: {
    getGoals: jest.fn(),
    upsertGoals: jest.fn().mockResolvedValue({ data: {} }),
  },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const { api } = jest.requireMock("@/services/api");

beforeEach(() => jest.clearAllMocks());

describe("GoalsScreen", () => {
  it("renders form with fetched goals", async () => {
    api.getGoals.mockResolvedValue({
      data: { dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 250, dailyFat: 65 },
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
      data: { dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 250, dailyFat: 65 },
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
      data: { dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 250, dailyFat: 65 },
    });
    const { getByText, getByDisplayValue } = await render(<GoalsScreen />);
    await waitFor(() => expect(getByDisplayValue("2000")).toBeTruthy());

    fireEvent.changeText(getByDisplayValue("2000"), "-100");
    fireEvent.press(getByText("Save Goals"));

    await waitFor(() => {
      expect(getByText("All values must be valid numbers >= 0")).toBeTruthy();
    });
    expect(api.upsertGoals).not.toHaveBeenCalled();
  });
});
