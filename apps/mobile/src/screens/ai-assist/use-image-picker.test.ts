import { act, renderHook } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";
import { useImagePicker } from "./use-image-picker";

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.spyOn(Alert, "alert");
jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined as any);

const mockAsset = {
  uri: "file://photo.jpg",
  base64: "abc123",
  mimeType: "image/jpeg",
};

beforeEach(() => jest.clearAllMocks());

describe("useImagePicker", () => {
  it("starts with null image", () => {
    const { result } = renderHook(() => useImagePicker());
    expect(result.current.image).toBeNull();
  });

  it("picks from camera on granted permission", async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [mockAsset],
    });

    const { result } = renderHook(() => useImagePicker());
    await act(() => result.current.pickFromCamera());

    expect(result.current.image).toEqual({
      uri: "file://photo.jpg",
      base64: "abc123",
      mimeType: "image/jpeg",
    });
  });

  it("shows alert when camera permission denied", async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
    });

    const { result } = renderHook(() => useImagePicker());
    await act(() => result.current.pickFromCamera());

    expect(Alert.alert).toHaveBeenCalledWith(
      "Permission Required",
      expect.any(String),
      expect.any(Array),
    );
    expect(result.current.image).toBeNull();
  });

  it("picks from gallery", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [mockAsset],
    });

    const { result } = renderHook(() => useImagePicker());
    await act(() => result.current.pickFromGallery());

    expect(result.current.image).toEqual({
      uri: "file://photo.jpg",
      base64: "abc123",
      mimeType: "image/jpeg",
    });
  });

  it("does not set image when picker is canceled", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });

    const { result } = renderHook(() => useImagePicker());
    await act(() => result.current.pickFromGallery());

    expect(result.current.image).toBeNull();
  });

  it("clears image", async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [mockAsset],
    });

    const { result } = renderHook(() => useImagePicker());
    await act(() => result.current.pickFromCamera());
    expect(result.current.image).not.toBeNull();

    act(() => result.current.clearImage());
    expect(result.current.image).toBeNull();
  });

  it("defaults mimeType to image/jpeg when missing", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://photo.jpg", base64: "abc", mimeType: undefined }],
    });

    const { result } = renderHook(() => useImagePicker());
    await act(() => result.current.pickFromGallery());

    expect(result.current.image?.mimeType).toBe("image/jpeg");
  });
});
