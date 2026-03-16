import React from "react";
import EntryFormScreen from "./";
import { render, fireEvent, waitFor } from "@/__tests__/helpers";
import { MealType } from "@snap-cals/shared";

jest.mock("@/services/api", () => ({
  api: {
    createEntry: jest.fn().mockResolvedValue({ data: {} }),
    updateEntry: jest.fn().mockResolvedValue({ data: {} }),
    deleteEntry: jest.fn().mockResolvedValue({ data: {} }),
  },
  setToken: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const { api } = jest.requireMock("@/services/api");

const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack } as any;

beforeEach(() => jest.clearAllMocks());

describe("EntryFormScreen — create mode", () => {
  const mockRoute = { params: undefined, key: "EntryForm", name: "EntryForm" as const };

  it("renders add entry form", async () => {
    const { getAllByText, getByPlaceholderText } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    expect(getAllByText("Add Entry").length).toBeGreaterThanOrEqual(1);
    expect(getByPlaceholderText("e.g. Chicken Breast")).toBeTruthy();
  });

  it("shows field-level validation errors when name and calories are empty", async () => {
    const { getByText, getAllByText } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    const buttons = getAllByText("Add Entry");
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(getByText("Name is required")).toBeTruthy();
      expect(getByText("Calories is required")).toBeTruthy();
    });
    expect(api.createEntry).not.toHaveBeenCalled();
  });

  it("submits valid entry", async () => {
    const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    fireEvent.changeText(getByPlaceholderText("e.g. Chicken Breast"), "Oatmeal");
    const calField = getAllByPlaceholderText("0")[0];
    fireEvent.changeText(calField, "350");
    const buttons = getAllByText("Add Entry");
    fireEvent.press(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(api.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Oatmeal", calories: 350 })
      );
    });
  });

  it("renders all meal type chips", async () => {
    const { getByText } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    expect(getByText("Breakfast")).toBeTruthy();
    expect(getByText("Lunch")).toBeTruthy();
    expect(getByText("Dinner")).toBeTruthy();
    expect(getByText("Snack")).toBeTruthy();
  });
});

describe("EntryFormScreen — edit mode", () => {
  const existingEntry = {
    id: "entry-1",
    userId: "user-1",
    name: "Chicken Breast",
    calories: 250,
    protein: 40,
    carbs: 0,
    fat: 5,
    servingSize: "200g",
    mealType: MealType.LUNCH,
    date: "2026-03-16T00:00:00.000Z",
    createdAt: "2026-03-16T00:00:00.000Z",
    updatedAt: "2026-03-16T00:00:00.000Z",
  };
  const mockRoute = { params: { entry: existingEntry }, key: "EntryForm", name: "EntryForm" as const };

  it("renders edit form with pre-filled values", async () => {
    const { getByText, getByDisplayValue } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    expect(getByText("Edit Entry")).toBeTruthy();
    expect(getByDisplayValue("Chicken Breast")).toBeTruthy();
    expect(getByDisplayValue("250")).toBeTruthy();
    expect(getByDisplayValue("40")).toBeTruthy();
  });

  it("shows delete button in edit mode", async () => {
    const { getByText } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    expect(getByText("Delete Entry")).toBeTruthy();
  });

  it("calls updateEntry on submit", async () => {
    const { getByText } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    fireEvent.press(getByText("Update"));
    await waitFor(() => {
      expect(api.updateEntry).toHaveBeenCalledWith(
        "entry-1",
        expect.objectContaining({ name: "Chicken Breast", calories: 250 })
      );
    });
  });
});

describe("EntryFormScreen — prefill mode", () => {
  const prefill = {
    name: "Big Mac",
    calories: 550,
    protein: 25,
    carbs: 45,
    fat: 30,
    servingSize: "1 burger",
  };
  const mockRoute = { params: { prefill }, key: "EntryForm", name: "EntryForm" as const };

  it("renders with AI estimate title and pre-filled values", async () => {
    const { getByText, getByDisplayValue } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    expect(getByText("Review AI Estimate")).toBeTruthy();
    expect(getByDisplayValue("Big Mac")).toBeTruthy();
    expect(getByDisplayValue("550")).toBeTruthy();
    expect(getByDisplayValue("25")).toBeTruthy();
    expect(getByDisplayValue("45")).toBeTruthy();
    expect(getByDisplayValue("30")).toBeTruthy();
    expect(getByDisplayValue("1 burger")).toBeTruthy();
  });

  it("submits prefilled entry", async () => {
    const { getByText } = await render(
      <EntryFormScreen navigation={mockNavigation} route={mockRoute} />
    );
    fireEvent.press(getByText("Add Entry"));
    await waitFor(() => {
      expect(api.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Big Mac", calories: 550 })
      );
    });
  });
});
