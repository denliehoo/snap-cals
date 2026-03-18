import React from "react";
import QuickAddScreen from "./";
import { render, fireEvent, waitFor } from "@/__tests__/helpers";
import { MealType } from "@snap-cals/shared";

jest.mock("@/services/api", () => ({
  api: {
    getFavorites: jest.fn().mockResolvedValue({
      data: [{ id: "fav-1", name: "Oatmeal", calories: 300, protein: 10, carbs: 50, fat: 8, servingSize: "1 cup", mealType: "BREAKFAST", createdAt: "2026-03-15T00:00:00.000Z" }],
    }),
    getRecentFoods: jest.fn().mockResolvedValue({
      data: [{ name: "Chicken Breast", calories: 250, protein: 40, carbs: 0, fat: 5, servingSize: "200g", mealType: "LUNCH" }],
    }),
  },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate } as any;
const mockRoute = { params: undefined, key: "QuickAdd", name: "QuickAdd" as const };

beforeEach(() => jest.clearAllMocks());

describe("QuickAddScreen", () => {
  it("renders favorites and recents sections", async () => {
    const { getByText } = await render(
      <QuickAddScreen navigation={mockNavigation} route={mockRoute} />
    );
    await waitFor(() => {
      expect(getByText("Favorites")).toBeTruthy();
      expect(getByText("Recents")).toBeTruthy();
      expect(getByText("Oatmeal")).toBeTruthy();
      expect(getByText("Chicken Breast")).toBeTruthy();
    });
  });

  it("navigates to EntryForm with prefill on tap", async () => {
    const { getByText } = await render(
      <QuickAddScreen navigation={mockNavigation} route={mockRoute} />
    );
    await waitFor(() => expect(getByText("Oatmeal")).toBeTruthy());
    fireEvent.press(getByText("Oatmeal"));
    expect(mockNavigate).toHaveBeenCalledWith("EntryForm", {
      prefill: expect.objectContaining({ name: "Oatmeal", calories: 300, mealType: "BREAKFAST" }),
    });
  });
});
