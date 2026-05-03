import { useState } from "react";

export interface PickedImage {
  uri: string;
  base64: string;
  mimeType: string;
}

function pickFile(capture?: boolean): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/heic";
    if (capture) input.capture = "environment";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        resolve({
          uri: URL.createObjectURL(file),
          base64,
          mimeType: file.type || "image/jpeg",
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    input.click();
  });
}

export function useImagePicker() {
  const [image, setImage] = useState<PickedImage | null>(null);

  const pickFromCamera = async () => {
    const picked = await pickFile(true);
    if (picked) setImage(picked);
  };

  const pickFromGallery = async () => {
    const picked = await pickFile(false);
    if (picked) setImage(picked);
  };

  const clearImage = () => setImage(null);

  return { image, setImage, pickFromCamera, pickFromGallery, clearImage };
}
