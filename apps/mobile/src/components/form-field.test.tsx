import React from "react";
import FormField from "./form-field";
import { render, fireEvent } from "@/__tests__/helpers";

describe("FormField", () => {
  it("renders label and input", async () => {
    const { getByText, getByPlaceholderText } = await render(
      <FormField label="Email" value="" onChangeText={jest.fn()} placeholder="Enter email" />
    );
    expect(getByText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Enter email")).toBeTruthy();
  });

  it("calls onChangeText when typing", async () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = await render(
      <FormField label="Name" value="" onChangeText={onChangeText} placeholder="Food name" />
    );
    fireEvent.changeText(getByPlaceholderText("Food name"), "Chicken");
    expect(onChangeText).toHaveBeenCalledWith("Chicken");
  });

  it("displays current value", async () => {
    const { getByDisplayValue } = await render(
      <FormField label="Name" value="Oatmeal" onChangeText={jest.fn()} />
    );
    expect(getByDisplayValue("Oatmeal")).toBeTruthy();
  });

  it("shows error text when error prop is set", async () => {
    const { getByText } = await render(
      <FormField label="Name" value="" onChangeText={jest.fn()} error="Name is required" />
    );
    expect(getByText("Name is required")).toBeTruthy();
  });

  it("does not show error text when error prop is not set", async () => {
    const { queryByText } = await render(
      <FormField label="Name" value="" onChangeText={jest.fn()} />
    );
    expect(queryByText("Name is required")).toBeNull();
  });
});
