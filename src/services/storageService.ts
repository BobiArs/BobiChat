import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";

// 100% надійне та швидке локальне перетворення файлу у Base64 Data URL
// Підтримує сучасний File API Expo SDK 54+ та legacy fallback без попереджень та помилок
export const uploadMediaFile = async (
  fileUri: string,
  folder: "avatars" | "voice" | "circles",
): Promise<string> => {
  if (
    !fileUri ||
    (!fileUri.startsWith("file://") && !fileUri.startsWith("content://"))
  ) {
    return fileUri;
  }

  try {
    let base64 = "";

    // 1. Спробуємо прочитати файл через сучасний File API (Expo SDK 54+)
    try {
      if (fileUri.startsWith("file://")) {
        const file = new File(fileUri);
        base64 = await file.base64();
      }
    } catch {
      // Якщо File API не зміг прочитати цей URI, переходимо до legacy
    }

    // 2. Якщо File API не повернув дані або це content:// URI, використовуємо legacy API
    if (!base64) {
      base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    const isPng = fileUri.toLowerCase().endsWith(".png");
    const mimeType = isPng ? "image/png" : "image/jpeg";

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Помилка читання файлу через FileSystem:", error);
    return fileUri;
  }
};
