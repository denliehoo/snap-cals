import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Linking } from "react-native";

export interface PickedImage {
  uri: string;
  base64: string;
  mimeType: string;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  base64: true,
  quality: 0.7,
  mediaTypes: ["images"],
  allowsEditing: true,
};

function showPermissionAlert() {
  Alert.alert(
    "Permission Required",
    "Please enable access in Settings to use this feature.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ],
  );
}

function extractImage(
  result: ImagePicker.ImagePickerResult,
): PickedImage | null {
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;
  return {
    uri: asset.uri,
    base64: asset.base64,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

export function useImagePicker() {
  const [image, setImage] = useState<PickedImage | null>(null);

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showPermissionAlert();
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    const picked = extractImage(result);
    if (picked) setImage(picked);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    const picked = extractImage(result);
    if (picked) setImage(picked);
  };

  const clearImage = () => setImage(null);

  return { image, setImage, pickFromCamera, pickFromGallery, clearImage };
}
