import { db } from "@/database/db";
import { AuthService } from "@/services/authService";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import {
  Camera,
  Check,
  QrCode,
  Search,
  Sparkles,
  User,
  UserPlus,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

interface AddFriendsModalProps {
  visible: boolean;
  onClose: () => void;
  onFriendAdded?: () => void;
  onViewUserProfile?: (user: any) => void;
}

export default function AddFriendsModal({
  visible,
  onClose,
  onFriendAdded,
  onViewUserProfile,
}: AddFriendsModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "incoming" | "qr" | "scan">(
    "search",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Set<string>>(new Set());
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const currentUser = AuthService.getCurrentUser();
  const currentId = currentUser?.id || "";
  const currentEmail = (currentUser?.email || "").toLowerCase().trim();

  const loadRequests = async () => {
    try {
      const { incoming, outgoing } = await AuthService.getFriendRequests();
      setIncomingRequests(incoming);
      const outgoingIds = new Set<string>();
      outgoing.forEach((o: any) => {
        if (o.status === "pending") outgoingIds.add(o.toId);
      });
      setOutgoingRequests(outgoingIds);
    } catch (e) {
      console.warn("Помилка завантаження запитів:", e);
    }
  };

  const searchUsers = async () => {
    if (!visible) return;

    try {
      // 1. Оновлюємо та завантажуємо список користувачів з Firestore
      const cloudUsers = await AuthService.fetchCloudUsers();
      await loadRequests();

      // 2. Отримуємо всіх локальних користувачів з SQLite
      let localUsers: any[] = [];
      try {
        localUsers = db.getAllSync<any>("SELECT * FROM users;");
      } catch (err) {
        console.warn("Помилка зчитування локальних користувачів:", err);
      }

      // 3. Об'єднуємо користувачів в один Map за унікальним id
      const userMap = new Map<string, any>();

      localUsers.forEach((u) => {
        if (u.id) {
          userMap.set(u.id, {
            ...u,
            custom_status: u.custom_status || "Користувач Bobi Chat",
          });
        }
      });

      cloudUsers.forEach((u) => {
        if (u.id) {
          const prev = userMap.get(u.id);
          userMap.set(u.id, {
            ...prev,
            ...u,
            custom_status:
              u.custom_status || u.customStatus || prev?.custom_status || "Користувач Bobi Chat",
          });
        }
      });

      // 4. Фільтруємо: виключаємо себе та фільтруємо за запитом
      const queryStr = searchQuery.trim().toLowerCase();
      const allUsers = Array.from(userMap.values());

      const filtered = allUsers.filter((user) => {
        // Виключаємо свій власний акаунт
        if (user.id === currentId) return false;
        if (
          currentEmail &&
          user.email &&
          user.email.toLowerCase().trim() === currentEmail
        ) {
          return false;
        }

        // Якщо рядок пошуку порожній, показуємо всіх знайдених користувачів
        if (!queryStr) return true;

        const nameMatch = (user.username || "").toLowerCase().includes(queryStr);
        const tagMatch = (user.tag || "").toLowerCase().includes(queryStr);
        const emailMatch = (user.email || "").toLowerCase().includes(queryStr);

        return nameMatch || tagMatch || emailMatch;
      });

      setSearchResults(filtered);
    } catch (e) {
      console.error("Помилка пошуку користувачів:", e);
    }
  };

  useEffect(() => {
    searchUsers();
  }, [searchQuery, visible, currentId, currentEmail]);

  // Відправка запиту у друзі
  const handleSendFriendRequest = async (user: any) => {
    if (!user) return;
    setOutgoingRequests((prev) => new Set(prev).add(user.id));
    const res = await AuthService.sendFriendRequest(user);
    if (!res.success) {
      Alert.alert("Помилка", res.error || "Не вдалося надіслати запит");
    } else {
      Alert.alert("Успіх", `Запит у друзі надіслано користувачеві ${user.username}!`);
    }
  };

  // Прийняття вхідного запиту
  const handleAcceptRequest = async (req: any) => {
    const success = await AuthService.acceptFriendRequest(req);
    if (success) {
      setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
      onFriendAdded?.();
      Alert.alert("Вітаємо!", `Ви та ${req.fromName} тепер друзі! Чат додано.`);
    }
  };

  // Відхилення вхідного запиту
  const handleRejectRequest = async (requestId: string) => {
    const success = await AuthService.rejectFriendRequest(requestId);
    if (success) {
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  };

  const handleAddUserAsFriend = async (user: any) => {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO users (id, username, avatar, custom_status)
         VALUES (?, ?, ?, ?);`,
        [user.id, user.username, user.avatar || "", user.custom_status || ""],
      );
      db.runSync(
        `INSERT OR REPLACE INTO chats (id, name, type, avatar, is_online, last_message)
         VALUES (?, ?, 'dm', ?, 1, 'Додано через QR-код');`,
        [user.id, user.username, user.avatar || "", "Додано через QR-код"],
      );
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onFriendAdded?.();
        onClose();
      }, 1200);
    } catch (e) {
      console.error("Помилка додавання друга через QR:", e);
      Alert.alert("Помилка", "Не вдалося додати користувача");
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const parsedData = JSON.parse(data);
      if (parsedData?.type === "BOBI_CHAT_USER" && parsedData?.username) {
        handleAddUserAsFriend({
          id: parsedData.id || `usr_${Date.now()}`,
          username: parsedData.username,
          avatar: parsedData.avatar || "",
          custom_status: parsedData.custom_status || "Додано через QR",
        });
      } else {
        Alert.alert("Недійсний QR-код", "Цей QR-код не належить Bobi Chat", [
          { text: "ОК", onPress: () => setScanned(false) },
        ]);
      }
    } catch {
      Alert.alert("Помилка", "Не вдалося розпізнати QR-код", [
        { text: "ОК", onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!visible) return null;

  const qrPayload = JSON.stringify({
    type: "BOBI_CHAT_USER",
    id: currentUser?.id || "usr_me",
    username: currentUser?.username || "Bobi User",
    avatar: currentUser?.avatar || "",
    custom_status: currentUser?.customStatus || "",
    tag: currentUser?.tag || "#online",
  });

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-[#1E1A17] border-t border-[#3A322C] rounded-t-3xl p-6 h-[85%] flex-col justify-between">
          <View className="flex-1">
            <View className="flex-row items-center justify-between pb-4 border-b border-[#3A322C]/50">
              <Text className="text-[#F4EAE1] font-bold text-xl">
                Знайти друзів / Бота
              </Text>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="p-2 bg-[#2A2420] rounded-xl"
              >
                <X size={20} color="#A6988B" />
              </TouchableOpacity>
            </View>

            <View className="flex-row bg-[#2A2420] p-1 rounded-2xl my-4 border border-[#3A322C]">
              <TouchableOpacity
                onPress={() => setActiveTab("search")}
                activeOpacity={0.7}
                className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                  activeTab === "search" ? "bg-[#3A322C]" : "bg-transparent"
                }`}
              >
                <Search
                  size={15}
                  color={activeTab === "search" ? "#E89D43" : "#A6988B"}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    activeTab === "search" ? "text-[#F4EAE1]" : "text-[#A6988B]"
                  }`}
                >
                  Пошук
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("incoming")}
                activeOpacity={0.7}
                className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center relative ${
                  activeTab === "incoming" ? "bg-[#3A322C]" : "bg-transparent"
                }`}
              >
                <User
                  size={15}
                  color={activeTab === "incoming" ? "#E89D43" : "#A6988B"}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    activeTab === "incoming" ? "text-[#F4EAE1]" : "text-[#A6988B]"
                  }`}
                >
                  Вхідні
                </Text>
                {incomingRequests.length > 0 && (
                  <View className="bg-red-500 rounded-full px-1.5 py-0.5 ml-1">
                    <Text className="text-white text-[10px] font-bold">
                      {incomingRequests.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("qr")}
                activeOpacity={0.7}
                className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                  activeTab === "qr" ? "bg-[#3A322C]" : "bg-transparent"
                }`}
              >
                <QrCode
                  size={15}
                  color={activeTab === "qr" ? "#E89D43" : "#A6988B"}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    activeTab === "qr" ? "text-[#F4EAE1]" : "text-[#A6988B]"
                  }`}
                >
                  QR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab("scan");
                  setScanned(false);
                }}
                activeOpacity={0.7}
                className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                  activeTab === "scan" ? "bg-[#3A322C]" : "bg-transparent"
                }`}
              >
                <Camera
                  size={15}
                  color={activeTab === "scan" ? "#E89D43" : "#A6988B"}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    activeTab === "scan" ? "text-[#F4EAE1]" : "text-[#A6988B]"
                  }`}
                >
                  Сканер
                </Text>
              </TouchableOpacity>
            </View>

            {/* Вкладка 1: Пошук користувачів */}
            {activeTab === "search" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-[#A6988B] text-xs mb-3">
                  Введіть ім'я користувача, збереженого в хмарі:
                </Text>

                <View className="bg-[#2A2420] border border-[#3A322C] rounded-2xl px-4 py-3.5 flex-row items-center mb-5">
                  <Search size={18} color="#A6988B" className="mr-3" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Шукати за ім'ям або тегом..."
                    placeholderTextColor="#A6988B"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 text-[#F4EAE1] text-sm font-medium"
                  />
                </View>

                {searchResults.length > 0 ? (
                  <View className="space-y-2.5">
                    {searchResults.map((user) => {
                      const isSent = outgoingRequests.has(user.id);

                      return (
                        <View
                          key={user.id}
                          className="bg-[#2A2420] border border-[#3A322C] p-3.5 rounded-2xl flex-row items-center justify-between my-1"
                        >
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => onViewUserProfile?.(user)}
                            className="flex-row items-center flex-1 mr-2"
                          >
                            <View className="w-10 h-10 rounded-full bg-[#E89D43] items-center justify-center overflow-hidden">
                              {user.avatar && user.avatar.length > 5 ? (
                                <Image
                                  source={{ uri: user.avatar }}
                                  contentFit="cover"
                                  style={{ width: "100%", height: "100%" }}
                                  className="w-full h-full"
                                />
                              ) : (
                                <Text className="text-[#1E1A17] font-bold text-base">
                                  {user.username.charAt(0).toUpperCase()}
                                </Text>
                              )}
                            </View>
                            <View className="ml-3 flex-1">
                              <View className="flex-row items-center">
                                <Text
                                  className="text-[#F4EAE1] font-bold text-sm"
                                  numberOfLines={1}
                                >
                                  {user.username}
                                </Text>
                                <Text className="text-[#E89D43] text-xs font-semibold ml-1.5">
                                  {user.tag || "#online"}
                                </Text>
                              </View>
                              <Text
                                className="text-[#A6988B] text-xs mt-0.5"
                                numberOfLines={1}
                              >
                                {user.custom_status || "В мережі • Bobi Chat"}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Кнопка "Додати" / "Запит надіслано" */}
                          <TouchableOpacity
                            onPress={() => !isSent && handleSendFriendRequest(user)}
                            disabled={isSent}
                            activeOpacity={0.8}
                            className={`px-3 py-2 rounded-xl flex-row items-center ${
                              isSent
                                ? "bg-[#3A322C]/70 border border-[#3A322C]"
                                : "bg-[#E89D43]"
                            }`}
                          >
                            {isSent ? (
                              <>
                                <Check size={14} color="#A6988B" />
                                <Text className="text-[#A6988B] font-semibold text-xs ml-1.5">
                                  Запит надіслано
                                </Text>
                              </>
                            ) : (
                              <>
                                <UserPlus size={14} color="#1E1A17" />
                                <Text className="text-[#1E1A17] font-bold text-xs ml-1.5">
                                  Додати
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-[#A6988B] text-xs text-center">
                      Нікого не знайдено. Натисніть кнопку пошуку або введіть
                      ім'я.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Вкладка 2: Вхідні запити у друзі */}
            {activeTab === "incoming" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-[#A6988B] text-xs mb-3">
                  Користувачі, які хочуть додати вас у друзі:
                </Text>

                {incomingRequests.length > 0 ? (
                  <View className="space-y-2.5">
                    {incomingRequests.map((req) => (
                      <View
                        key={req.id}
                        className="bg-[#2A2420] border border-[#3A322C] p-3.5 rounded-2xl flex-row items-center justify-between my-1"
                      >
                        <View className="flex-row items-center flex-1 mr-2">
                          <View className="w-10 h-10 rounded-full bg-[#E89D43] items-center justify-center overflow-hidden">
                            {req.fromAvatar && req.fromAvatar.length > 5 ? (
                              <Image
                                source={{ uri: req.fromAvatar }}
                                contentFit="cover"
                                style={{ width: "100%", height: "100%" }}
                                className="w-full h-full"
                              />
                            ) : (
                              <Text className="text-[#1E1A17] font-bold text-base">
                                {req.fromName.charAt(0).toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <View className="ml-3 flex-1">
                            <Text
                              className="text-[#F4EAE1] font-bold text-sm"
                              numberOfLines={1}
                            >
                              {req.fromName}
                            </Text>
                            <Text className="text-[#A6988B] text-xs mt-0.5">
                              Хоче додати вас у друзі
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center space-x-2">
                          <TouchableOpacity
                            onPress={() => handleAcceptRequest(req)}
                            activeOpacity={0.8}
                            className="bg-emerald-600 px-3 py-2 rounded-xl flex-row items-center mr-1.5"
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text className="text-white font-bold text-xs ml-1">
                              Прийняти
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleRejectRequest(req.id)}
                            activeOpacity={0.8}
                            className="bg-red-500/20 border border-red-500/40 px-2.5 py-2 rounded-xl"
                          >
                            <X size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="items-center py-12">
                    <Text className="text-[#A6988B] text-xs text-center">
                      Наразі немає нових вхідних запитів у друзі.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            {activeTab === "qr" && (
              <View className="items-center justify-center my-auto py-4">
                <View className="p-5 bg-white rounded-3xl border-4 border-[#E89D43] mb-4 shadow-2xl">
                  <QRCode value={qrPayload} size={180} />
                </View>
                <Text className="text-[#F4EAE1] text-lg font-bold">
                  {currentUser?.username || "Користувач"}
                </Text>
                <View className="flex-row items-center mt-1 bg-[#2A2420] px-3 py-1 rounded-full border border-[#3A322C]">
                  <Sparkles size={12} color="#E89D43" />
                  <Text className="text-[#A6988B] text-xs font-medium ml-1.5">
                    {currentUser?.tag || "#online"}
                  </Text>
                </View>
              </View>
            )}

            {activeTab === "scan" && (
              <View className="flex-1 items-center justify-center">
                {!permission?.granted ? (
                  <View className="items-center px-4">
                    <Camera size={48} color="#A6988B" className="mb-3" />
                    <Text className="text-[#F4EAE1] text-center font-bold text-base mb-2">
                      Потрібен доступ до камери
                    </Text>
                    <TouchableOpacity
                      onPress={requestPermission}
                      activeOpacity={0.8}
                      className="bg-[#E89D43] px-5 py-3 rounded-2xl mt-2"
                    >
                      <Text className="text-[#1E1A17] font-bold text-sm">
                        Надати дозвіл
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="w-full h-64 rounded-3xl overflow-hidden border-2 border-[#E89D43] relative justify-center items-center">
                    <CameraView
                      style={{ width: "100%", height: "100%" }}
                      onBarcodeScanned={
                        scanned ? undefined : handleBarCodeScanned
                      }
                      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          {isSuccess && (
            <View className="bg-emerald-600/20 border border-emerald-500/50 p-3 rounded-2xl flex-row items-center justify-center mt-2">
              <Check size={18} color="#10B981" />
              <Text className="text-emerald-400 font-bold text-sm ml-2">
                Чат з користувачем успішно створено!
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
