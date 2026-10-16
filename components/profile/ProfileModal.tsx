import { AuthService } from "@/services/authService";
import { uploadMediaFile } from "@/services/storageService";
import * as ImagePicker from "expo-image-picker";
import {
  Check,
  Circle,
  EyeOff,
  Image as ImageIcon,
  LogOut,
  Moon,
  Pencil as Edit3,
  Save,
  User,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image } from "expo-image";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export type UserStatus = "online" | "dnd" | "invisible";

export default function ProfileModal({
  visible,
  onClose,
  onProfileUpdated,
}: ProfileModalProps) {
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [status, setStatus] = useState<UserStatus>("online");
  const [avatar, setAvatar] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);

  // Завантажуємо актуальний профіль з SQLite при відкритті
  useEffect(() => {
    if (visible) {
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        setUserId(currentUser.id);
        setUsername(currentUser.username || "");
        setEmail(currentUser.email || "");
        setCustomStatus(currentUser.customStatus || "");
        setStatus(currentUser.status || "online");
        setAvatar(currentUser.avatar || "");
      }
    }
  }, [visible]);

  // Вибір фотографії профілю з галереї пристрою
  const handlePickAvatar = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Дозвіл потрібен",
          "Будь ласка, надайте доступ до галереї для вибору фото профілю",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        let base64Data = "";
        if (asset.base64) {
          const mimeType = asset.mimeType || "image/jpeg";
          base64Data = `data:${mimeType};base64,${asset.base64}`;
        } else if (asset.uri) {
          base64Data = await uploadMediaFile(asset.uri, "avatars");
        }
        if (base64Data) {
          setAvatar(base64Data);
        }
      }
    } catch (e) {
      console.error("Помилка вибору фото з галереї:", e);
    }
  };

  // Збереження змін у SQLite
  const handleSave = async () => {
    const currentId = userId || AuthService.getCurrentUser()?.id;
    if (!currentId) {
      Alert.alert("Помилка", "Користувач не знайдений");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Увага", "Вкажіть ваше ім'я користувача");
      return;
    }

    let uploadedAvatarUrl = avatar;

    // Якщо раптом фото все ще локальний шлях file:// або content://
    if (
      avatar &&
      (avatar.startsWith("file://") || avatar.startsWith("content://"))
    ) {
      try {
        uploadedAvatarUrl = await uploadMediaFile(avatar, "avatars");
        setAvatar(uploadedAvatarUrl);
      } catch (e) {
        console.error("Не вдалося конвертувати фото у Base64", e);
      }
    }

    const success = AuthService.updateProfile(
      currentId,
      username.trim(),
      customStatus.trim(),
      status,
      uploadedAvatarUrl,
    );

    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      onProfileUpdated?.();
    } else {
      Alert.alert("Помилка", "Не вдалося зберегти зміни профілю");
    }
  };

  // Вихід з акаунта
  const handleLogout = () => {
    AuthService.logout();
    onClose();
    onProfileUpdated?.();
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-[#1E1A17] border-t border-[#3A322C] rounded-t-3xl p-6 h-[88%] flex-col justify-between">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Шапка */}
            <View className="flex-row items-center justify-between pb-4 border-b border-[#3A322C]/50">
              <Text className="text-[#F4EAE1] font-bold text-xl">
                Налаштування профілю
              </Text>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="p-2 bg-[#2A2420] rounded-xl"
              >
                <X size={20} color="#A6988B" />
              </TouchableOpacity>
            </View>

            {/* Аватарка з можливістю зміни фотографії */}
            <View className="items-center my-6">
              <TouchableOpacity
                onPress={handlePickAvatar}
                activeOpacity={0.8}
                className="relative"
              >
                <View className="w-24 h-24 rounded-full bg-[#E89D43] items-center justify-center border-2 border-[#3A322C] overflow-hidden">
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      contentFit="cover"
                      style={{ width: "100%", height: "100%" }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Text className="text-[#1E1A17] font-bold text-3xl">
                      {username ? username.charAt(0).toUpperCase() : "B"}
                    </Text>
                  )}
                </View>
                <View className="absolute bottom-0 right-0 p-2 bg-[#2A2420] rounded-full border border-[#3A322C]">
                  <Edit3 size={16} color="#E89D43" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickAvatar}
                activeOpacity={0.7}
                className="mt-3 flex-row items-center bg-[#2A2420] px-3.5 py-1.5 rounded-full border border-[#3A322C]"
              >
                <ImageIcon size={14} color="#E89D43" />
                <Text className="text-[#E89D43] font-semibold text-xs ml-1.5">
                  Змінити фото профілю
                </Text>
              </TouchableOpacity>

              {email ? (
                <Text className="text-[#A6988B] text-xs font-medium mt-2">
                  {email}
                </Text>
              ) : null}
            </View>

            {/* Редагування імені */}
            <View className="mb-5">
              <Text className="text-[#A6988B] text-xs font-bold uppercase mb-2">
                Ім'я користувача
              </Text>
              <View className="bg-[#2A2420] border border-[#3A322C] rounded-2xl px-4 py-3.5 flex-row items-center">
                <User size={18} color="#A6988B" className="mr-3" />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Введіть ваше ім'я"
                  placeholderTextColor="#A6988B"
                  autoCapitalize="words"
                  autoCorrect={false}
                  className="flex-1 text-[#F4EAE1] font-semibold text-base"
                />
              </View>
            </View>

            {/* Власне повідомлення статусу */}
            <View className="mb-6">
              <Text className="text-[#A6988B] text-xs font-bold uppercase mb-2">
                Кастомний статус
              </Text>
              <View className="bg-[#2A2420] border border-[#3A322C] rounded-2xl px-4 py-3.5">
                <TextInput
                  value={customStatus}
                  onChangeText={setCustomStatus}
                  placeholder="Чим займаєтеся? (напр. На дзвінку у 60FPS)"
                  placeholderTextColor="#A6988B"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  className="text-[#F4EAE1] text-sm"
                />
              </View>
            </View>

            {/* Статуси мережі */}
            <View className="mb-6">
              <Text className="text-[#A6988B] text-xs font-bold uppercase mb-3">
                Мережевий статус
              </Text>

              <View className="space-y-2">
                {/* В мережі */}
                <TouchableOpacity
                  onPress={() => setStatus("online")}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                    status === "online"
                      ? "bg-[#3A322C] border-[#E89D43]"
                      : "bg-[#2A2420] border-transparent"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Circle size={12} fill="#10B981" color="#10B981" />
                    <Text className="text-[#F4EAE1] font-semibold ml-3 text-sm">
                      В мережі
                    </Text>
                  </View>
                  {status === "online" && <Check size={18} color="#E89D43" />}
                </TouchableOpacity>

                {/* Не турбувати */}
                <TouchableOpacity
                  onPress={() => setStatus("dnd")}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                    status === "dnd"
                      ? "bg-[#3A322C] border-[#E89D43]"
                      : "bg-[#2A2420] border-transparent"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Moon size={14} color="#EF4444" />
                    <Text className="text-[#F4EAE1] font-semibold ml-3 text-sm">
                      Не турбувати
                    </Text>
                  </View>
                  {status === "dnd" && <Check size={18} color="#E89D43" />}
                </TouchableOpacity>

                {/* Невидимий */}
                <TouchableOpacity
                  onPress={() => setStatus("invisible")}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                    status === "invisible"
                      ? "bg-[#3A322C] border-[#E89D43]"
                      : "bg-[#2A2420] border-transparent"
                  }`}
                >
                  <View className="flex-row items-center">
                    <EyeOff size={14} color="#A6988B" />
                    <Text className="text-[#F4EAE1] font-semibold ml-3 text-sm">
                      Невидимий
                    </Text>
                  </View>
                  {status === "invisible" && (
                    <Check size={18} color="#E89D43" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Кнопки збереження та виходу */}
          <View className="pt-2">
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              className={`w-full py-3.5 rounded-2xl flex-row items-center justify-center space-x-2 ${
                isSaved ? "bg-emerald-600" : "bg-[#E89D43]"
              }`}
            >
              {isSaved ? (
                <>
                  <Check size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold text-base ml-2">
                    Збережено в SQLite!
                  </Text>
                </>
              ) : (
                <>
                  <Save size={20} color="#1E1A17" />
                  <Text className="text-[#1E1A17] font-bold text-base ml-2">
                    Зберегти зміни
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              className="w-full py-3 mt-2.5 rounded-2xl bg-red-500/15 border border-red-500/40 flex-row items-center justify-center"
            >
              <LogOut size={18} color="#EF4444" />
              <Text className="text-red-400 font-bold text-sm ml-2">
                Вийти з акаунта
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
