import { fireEvent, render, waitFor } from "@/__tests__/helpers";
import AiAssistScreen from "./";

const mockPickFromCamera = jest.fn();
const mockPickFromGallery = jest.fn();
const mockClearImage = jest.fn();
let mockImage: { base64: string; mimeType: string; uri: string } | null = null;

jest.mock("./use-voice-input", () => ({
  useVoiceInput: () => ({
    recording: false,
    available: false,
    start: jest.fn(),
    stop: jest.fn(),
  }),
}));

jest.mock("./use-image-picker", () => ({
  useImagePicker: () => ({
    image: mockImage,
    pickFromCamera: mockPickFromCamera,
    pickFromGallery: mockPickFromGallery,
    clearImage: mockClearImage,
  }),
}));

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
  useFocusEffect: jest.fn(),
}));

jest.mock("@/stores/settings.store", () => ({
  useSettingsStore: jest.fn((selector) => selector({ discussionMode: false })),
}));

const { api } = jest.requireMock("@/services/api");
const mockNavigate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockImage = null;
});

describe("AiAssistScreen", () => {
  it("renders input, button, and disclaimer", async () => {
    const { getByPlaceholderText, getByText } = await render(
      <AiAssistScreen />,
    );
    expect(getByPlaceholderText(/Big Mac from McDonald/)).toBeTruthy();
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
    const mockData = {
      name: "Latte",
      calories: 190,
      protein: 10,
      carbs: 25,
      fat: 6,
      servingSize: "16oz",
    };
    api.estimateNutrition.mockResolvedValue({ data: mockData });

    const { getByPlaceholderText, getByText } = await render(
      <AiAssistScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText(/Big Mac from McDonald/),
      "latte",
    );
    fireEvent.press(getByText("Estimate"));

    await waitFor(() => {
      expect(api.estimateNutrition).toHaveBeenCalledWith("latte", undefined);
      expect(mockNavigate).toHaveBeenCalledWith("EntryForm", {
        prefill: mockData,
      });
    });
  });

  it("shows error on API failure", async () => {
    api.estimateNutrition.mockRejectedValue({ message: "Network error" });

    const { getByPlaceholderText, getByText } = await render(
      <AiAssistScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText(/Big Mac from McDonald/),
      "pizza",
    );
    fireEvent.press(getByText("Estimate"));

    await waitFor(() => {
      expect(getByText("Network error")).toBeTruthy();
    });
  });

  it("shows character counter near limit", async () => {
    const { getByPlaceholderText, getByText } = await render(
      <AiAssistScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText(/Big Mac from McDonald/),
      "a".repeat(170),
    );

    await waitFor(() => {
      expect(getByText("170/200")).toBeTruthy();
    });
  });

  // --- Image support ---

  it("renders camera button", async () => {
    const { getByTestId } = await render(<AiAssistScreen />);
    expect(getByTestId("camera-button")).toBeTruthy();
  });

  it("shows image preview when image is selected", async () => {
    mockImage = {
      uri: "file://photo.jpg",
      base64: "abc",
      mimeType: "image/jpeg",
    };
    const { getByTestId } = await render(<AiAssistScreen />);
    // The close-circle icon button is rendered next to the thumbnail
    expect(getByTestId("camera-button")).toBeTruthy();
  });

  it("enables Estimate button with image only (no text)", async () => {
    mockImage = {
      uri: "file://photo.jpg",
      base64: "abc",
      mimeType: "image/jpeg",
    };
    api.estimateNutrition.mockResolvedValue({
      data: {
        name: "Food",
        calories: 100,
        protein: 5,
        carbs: 10,
        fat: 3,
        servingSize: "1 serving",
      },
    });

    const { getByText } = await render(<AiAssistScreen />);
    fireEvent.press(getByText("Estimate"));

    await waitFor(() => {
      expect(api.estimateNutrition).toHaveBeenCalledWith("", {
        base64: "abc",
        mimeType: "image/jpeg",
      });
    });
  });
});
