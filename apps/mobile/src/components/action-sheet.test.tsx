import React from "react";
import ActionSheet from "./action-sheet";
import { render, fireEvent } from "@/__tests__/helpers";

describe("ActionSheet", () => {
  const options = [
    { label: "Manual Entry", icon: "create-outline" as const, onPress: jest.fn() },
    { label: "AI Assist", icon: "sparkles-outline" as const, onPress: jest.fn() },
  ];

  beforeEach(() => jest.clearAllMocks());

  it("renders options when visible", async () => {
    const { getByText } = await render(
      <ActionSheet visible={true} onClose={jest.fn()} options={options} />
    );
    expect(getByText("Manual Entry")).toBeTruthy();
    expect(getByText("AI Assist")).toBeTruthy();
  });

  it("calls option onPress and onClose when tapped", async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <ActionSheet visible={true} onClose={onClose} options={options} />
    );
    fireEvent.press(getByText("Manual Entry"));
    expect(onClose).toHaveBeenCalled();
    expect(options[0].onPress).toHaveBeenCalled();
  });
});
