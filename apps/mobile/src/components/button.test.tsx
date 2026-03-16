import React from "react";
import Button from "./button";
import { render, fireEvent } from "@/__tests__/helpers";

describe("Button", () => {
  it("renders title", async () => {
    const { getByText } = await render(<Button title="Save" onPress={jest.fn()} />);
    expect(getByText("Save")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Save" onPress={onPress} />);
    fireEvent.press(getByText("Save"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows activity indicator when loading", async () => {
    const { queryByText } = await render(
      <Button title="Save" onPress={jest.fn()} loading />
    );
    expect(queryByText("Save")).toBeNull();
  });

  it("does not call onPress when disabled", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Button title="Save" onPress={onPress} disabled />
    );
    fireEvent.press(getByText("Save"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
