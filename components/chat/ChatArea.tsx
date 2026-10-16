import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Bookmark,
  Check,
  CheckCheck,
  FaceSlightlySmiling as Smile,
  Monitor,
  Paperclip,
  Pencil as Edit3,
  Phone,
  Send,
  Sparkles,
  Trash as Trash2,
  Video,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthService } from "../../src/services/authService";
import { uploadMediaFile } from "../../src/services/storageService";

import { useLocalChat } from "../../hooks/useLocalChat";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  status?: "sent" | "delivered" | "read";
  isEdited?: boolean;
  createdAt?: number;
  reactions?: { [emoji: string]: string[] };
}

interface ChatAreaProps {
  chatId?: string | null;
  chatName: string;
  chatAvatar?: string;
  isOnline?: boolean;
  onStartCall?: (type: "audio" | "video" | "screenshare") => void;
  onBack?: () => void;
  onViewUserProfile?: () => void;
}

const STICKER_PACKS = {
  animals: [
    "🐶",
    "🐱",
    "🦊",
    "🐻",
    "🐼",
    "🦁",
    "🐯",
    "🐰",
    "🐨",
    "🦄",
    "🐸",
    "🐵",
    "🐺",
    "🦉",
    "🐙",
    "🦥",
  ],
  reactions: [
    "🔥",
    "🚀",
    "❤️",
    "💯",
    "🎉",
    "✨",
    "⚡",
    "🥳",
    "😎",
    "😍",
    "🤩",
    "😭",
    "🤯",
    "💀",
    "💩",
    "👍",
    "👎",
    "👏",
    "🙏",
    "🤝",
  ],
  fun: [
    "🎮",
    "👾",
    "🎯",
    "🎲",
    "🏆",
    "🥇",
    "🍕",
    "🍔",
    "🍟",
    "🍩",
    "☕",
    "🧋",
    "🍿",
    "💎",
    "🍦",
    "🎂",
    "⚽",
    "🏀",
  ],
  phrases: [
    "Привіт! 👋",
    "Як справи? 🤔",
    "Супер! 👍",
    "До зустрічі! ✌️",
    "Дякую! ❤️",
    "Ок! 👌",
    "В дорозі 🏃",
    "На зв'язку 📞",
    "Топ! 🔥",
    "Чекаю ⏳",
  ],
};

export default function ChatArea({
  chatId,
  chatName,
  chatAvatar,
  isOnline = true,
  onStartCall,
  onBack,
  onViewUserProfile,
}: ChatAreaProps) {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [stickerTab, setStickerTab] = useState<
    "animals" | "reactions" | "fun" | "phrases"
  >("animals");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { messages, sendMessage, editMessage, toggleReaction, deleteMessage } =
    useLocalChat(chatId || null);
  const currentUser = AuthService.getCurrentUser();
  const isSavedMessages = chatId === "saved_messages" || chatName === "Обране";

  const QUICK_REACTIONS = ["❤️", "🔥", "👍", "😂", "😮", "😢", "🎉", "🫡"];

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (editingMessage) {
      editMessage(editingMessage.id, inputText.trim());
      setEditingMessage(null);
      setInputText("");
    } else {
      sendMessage(inputText.trim());
      setInputText("");
    }
  };

  const handleSendSticker = (sticker: string) => {
    sendMessage(sticker);
    setIsStickersOpen(false);
  };

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Потрібен дозвіл",
          "Будь ласка, надайте доступ до галереї для надсилання фото",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsUploadingImage(true);
        const asset = result.assets[0];
        let base64Data = "";
        if (asset.base64) {
          const mimeType = asset.mimeType || "image/jpeg";
          base64Data = `data:${mimeType};base64,${asset.base64}`;
        } else if (asset.uri) {
          base64Data = await uploadMediaFile(asset.uri, "avatars");
        }
        if (base64Data) {
          sendMessage(`[image:${base64Data}]`);
        }
        setIsUploadingImage(false);
      }
    } catch (error) {
      setIsUploadingImage(false);
      console.error("Помилка надсилання фото:", error);
      Alert.alert("Помилка", "Не вдалося прикріпити фотографію");
    }
  };

  const handleLongPressMessage = (item: Message) => {
    setActionMessage(item);
    setIsActionModalOpen(true);
  };

  const confirmDelete = (forEveryone: boolean) => {
    if (selectedMessage) {
      deleteMessage(selectedMessage.id, forEveryone);
    }
    setIsDeleteModalOpen(false);
    setSelectedMessage(null);
  };

  // Перевірка чи повідомлення є стікером або окремим емодзі
  const checkIsSticker = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.startsWith("[sticker:") && trimmed.endsWith("]")) return true;
    const emojiRegex =
      /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;
    return trimmed.length <= 8 && emojiRegex.test(trimmed);
  };

  // Перевірка чи повідомлення є зображенням
  const checkIsImage = (text: string) => {
    const trimmed = text.trim();
    return trimmed.startsWith("[image:") && trimmed.endsWith("]");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSticker = checkIsSticker(item.text);

    const renderReactionsBar = () => {
      if (!item.reactions || Object.keys(item.reactions).length === 0)
        return null;
      const entries = Object.entries(item.reactions).filter(
        ([_, uids]) => uids && uids.length > 0,
      );
      if (entries.length === 0) return null;

      return (
        <View
          className={`flex-row flex-wrap gap-1 mt-1 ${
            item.isMe ? "self-end justify-end" : "self-start justify-start"
          }`}
        >
          {entries.map(([emoji, uids]) => {
            const hasMyReaction =
              currentUser?.id && uids.includes(currentUser.id);
            return (
              <TouchableOpacity
                key={emoji}
                onPress={() => toggleReaction(item.id, emoji)}
                activeOpacity={0.7}
                className={`flex-row items-center px-2 py-0.5 rounded-full border ${
                  hasMyReaction
                    ? "bg-[#E89D43]/25 border-[#E89D43]"
                    : "bg-[#2A2420] border-[#3A322C]"
                }`}
              >
                <Text className="text-xs mr-1">{emoji}</Text>
                <Text
                  className={`text-[10px] font-bold ${
                    hasMyReaction ? "text-[#E89D43]" : "text-[#A6988B]"
                  }`}
                >
                  {uids.length}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    };

    if (isSticker) {
      const displayContent = item.text.startsWith("[sticker:")
        ? item.text.slice(9, -1)
        : item.text;

      return (
        <View
          className={`my-1.5 ${item.isMe ? "self-end items-end" : "self-start items-start"}`}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={() => handleLongPressMessage(item)}
            className="p-1"
          >
            <Text className="text-[56px] text-center">
              {displayContent}
            </Text>
            <View className="flex-row items-center mt-1 space-x-1 bg-[#1E1A17]/70 px-2 py-0.5 rounded-full border border-[#3A322C]/40 self-end">
              <Text className="text-[10px] text-[#A6988B] mr-1">
                {item.timestamp}
              </Text>
              {item.isMe && <CheckCheck size={12} color="#E89D43" />}
            </View>
          </TouchableOpacity>
          {renderReactionsBar()}
        </View>
      );
    }

    if (checkIsImage(item.text)) {
      const imageUri = item.text.slice(7, -1);
      return (
        <View
          className={`my-2 max-w-[80%] ${item.isMe ? "self-end" : "self-start"}`}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setFullscreenImage(imageUri)}
            onLongPress={() => handleLongPressMessage(item)}
            className={`rounded-2xl overflow-hidden border border-[#3A322C] ${
              item.isMe ? "bg-[#E89D43]/15" : "bg-[#2A2420]"
            }`}
          >
            <View className="p-1">
              <Image
                source={{ uri: imageUri }}
                contentFit="cover"
                style={{ width: 230, height: 230, borderRadius: 12 }}
              />
            </View>
            <View className="flex-row items-center justify-end px-2.5 py-1.5 bg-[#1E1A17]/80">
              <Text
                className={`text-[10px] mr-1 ${
                  item.isMe ? "text-[#E89D43]" : "text-[#A6988B]"
                }`}
              >
                {item.timestamp}
              </Text>
              {item.isMe && <CheckCheck size={12} color="#E89D43" />}
            </View>
          </TouchableOpacity>
          {renderReactionsBar()}
        </View>
      );
    }

    return (
      <View
        className={`my-1.5 max-w-[80%] ${item.isMe ? "self-end" : "self-start"}`}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => handleLongPressMessage(item)}
          className={`px-3.5 py-2.5 rounded-2xl ${
            item.isMe
              ? "bg-[#E89D43] rounded-tr-none"
              : "bg-[#2A2420] border border-[#3A322C] rounded-tl-none"
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              item.isMe ? "text-[#1E1A17]" : "text-[#F4EAE1]"
            }`}
          >
            {item.text}
          </Text>
          <View className="flex-row items-center justify-end mt-1 space-x-1">
            <Text
              className={`text-[10px] ${
                item.isMe ? "text-[#1E1A17]/70" : "text-[#A6988B]"
              }`}
            >
              {item.timestamp}
              {item.isEdited ? " • ред." : ""}
            </Text>
            {item.isMe && (
              <CheckCheck size={13} color={item.isMe ? "#1E1A17" : "#A6988B"} />
            )}
          </View>
        </TouchableOpacity>
        {renderReactionsBar()}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 25}
      className="flex-1 bg-[#1E1A17]"
    >
      {/* 1. ШАПКА ЧАТУ */}
      <View className="h-16 bg-[#2A2420] border-b border-[#3A322C]/50 px-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              className="p-2 mr-2 rounded-xl bg-[#3A322C]/40 active:bg-[#3A322C]"
            >
              <ArrowLeft size={20} color="#E89D43" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => !isSavedMessages && onViewUserProfile?.()}
            activeOpacity={isSavedMessages ? 1 : 0.7}
            className="flex-row items-center flex-1 mr-2"
          >
            {isSavedMessages ? (
              <View className="p-2 bg-[#E89D43] rounded-xl mr-2.5">
                <Bookmark size={20} color="#1E1A17" />
              </View>
            ) : (
              <View className="w-10 h-10 rounded-full overflow-hidden mr-2.5 border border-[#3A322C] bg-[#E89D43] items-center justify-center">
                {chatAvatar && chatAvatar.length > 5 ? (
                  <Image
                    source={{ uri: chatAvatar }}
                    contentFit="cover"
                    style={{ width: "100%", height: "100%" }}
                    className="w-full h-full"
                  />
                ) : (
                  <Text className="text-[#1E1A17] font-bold text-base">
                    {chatName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            )}

            <View className="flex-1">
              <Text
                className="text-[#F4EAE1] font-bold text-base"
                numberOfLines={1}
              >
                {chatName}
              </Text>
              <Text className="text-[#A6988B] text-xs">
                {isSavedMessages
                  ? "Збережені повідомлення та нотатки"
                  : isOnline
                    ? "в мережі • натисніть для профілю"
                    : "офлайн • натисніть для профілю"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {!isSavedMessages && (
          <View className="flex-row items-center space-x-1.5 mr-8">
            <TouchableOpacity
              onPress={() => onStartCall?.("audio")}
              activeOpacity={0.7}
              className="p-2.5 bg-[#3A322C]/60 rounded-xl active:bg-[#3A322C]"
            >
              <Phone size={18} color="#C89968" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onStartCall?.("video")}
              activeOpacity={0.7}
              className="p-2.5 bg-[#3A322C]/60 rounded-xl active:bg-[#3A322C]"
            >
              <Video size={18} color="#C89968" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onStartCall?.("screenshare")}
              activeOpacity={0.7}
              className="flex-row items-center px-2.5 py-2 bg-[#E89D43] rounded-xl active:opacity-80"
            >
              <Monitor size={16} color="#1E1A17" />
              <Text className="text-[#1E1A17] font-bold text-xs ml-1.5">
                60 FPS
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. СПИСОК ПОВІДОМЛЕНЬ */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 16 }}
        className="flex-1"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20 px-6">
            {isSavedMessages ? (
              <View className="items-center">
                <View className="w-16 h-16 rounded-3xl bg-[#E89D43]/20 items-center justify-center mb-3 border border-[#E89D43]/40">
                  <Bookmark size={28} color="#E89D43" />
                </View>
                <Text className="text-[#F4EAE1] font-bold text-base text-center mb-1">
                  Ваш чат "Обране"
                </Text>
                <Text className="text-[#A6988B] text-xs text-center">
                  Зберігайте тут важливі нотатки та повідомлення!
                </Text>
              </View>
            ) : (
              <Text className="text-[#A6988B] text-sm text-center">
                Немає повідомлень. Почніть спілкування!
              </Text>
            )}
          </View>
        }
      />

      {/* ПАНЕЛЬ РЕДАГУВАННЯ ПОВІДОМЛЕННЯ */}
      {editingMessage && (
        <View className="bg-[#2A2420] border-t border-[#3A322C] px-4 py-2.5 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <Edit3 size={16} color="#E89D43" />
            <View className="ml-2.5 flex-1">
              <Text className="text-xs text-[#E89D43] font-bold">
                Редагування повідомлення (протягом 7 днів)
              </Text>
              <Text className="text-xs text-[#A6988B]" numberOfLines={1}>
                {editingMessage.text}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingMessage(null);
              setInputText("");
            }}
            className="p-1.5 bg-[#3A322C] rounded-full active:opacity-70"
          >
            <X size={14} color="#F4EAE1" />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. ОЧИЩЕНЕ ПОЛЕ ВВОДУ */}
      <View className="bg-[#2A2420] border-t border-[#3A322C]/50 p-3 flex-row items-center space-x-2">
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={isUploadingImage}
          activeOpacity={0.7}
          className="p-2.5 bg-[#3A322C]/50 rounded-xl mr-2 active:bg-[#3A322C]"
        >
          <Paperclip
            size={20}
            color={isUploadingImage ? "#E89D43" : "#A6988B"}
          />
        </TouchableOpacity>

        <View className="flex-1 bg-[#1E1A17] border border-[#3A322C] rounded-2xl px-3 flex-row items-center">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              editingMessage
                ? "Відредагуйте текст повідомлення..."
                : isSavedMessages
                  ? "Зберегти нотатку в Обране..."
                  : "Напишіть повідомлення..."
            }
            placeholderTextColor="#A6988B"
            autoCapitalize="sentences"
            autoCorrect={true}
            className="flex-1 text-[#F4EAE1] text-sm py-2.5"
            multiline
          />
          <TouchableOpacity
            onPress={() => setIsStickersOpen((prev) => !prev)}
            activeOpacity={0.7}
            className="ml-2 p-1"
          >
            <Smile size={20} color={isStickersOpen ? "#E89D43" : "#A6988B"} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSend}
          activeOpacity={0.7}
          className="p-2.5 bg-[#E89D43] rounded-2xl active:opacity-80 ml-2"
        >
          {editingMessage ? (
            <Check size={18} color="#1E1A17" />
          ) : (
            <Send size={18} color="#1E1A17" />
          )}
        </TouchableOpacity>
      </View>

      {/* 4. МОДАЛЬНЕ МЕНЮ СТІКЕРІВ ТА ЕМОДЗІ BOBI */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isStickersOpen}
        onRequestClose={() => setIsStickersOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsStickersOpen(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#1E1A17] border-t border-[#3A322C] rounded-t-3xl p-5 h-96 flex-col">
                {/* Шапка меню стікерів */}
                <View className="flex-row items-center justify-between pb-3 border-b border-[#3A322C]">
                  <View className="flex-row items-center">
                    <Sparkles size={18} color="#E89D43" />
                    <Text className="text-[#F4EAE1] font-bold text-base ml-2">
                      Стікери Bobi Chat
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsStickersOpen(false)}
                    className="p-1.5 bg-[#2A2420] rounded-xl"
                  >
                    <X size={18} color="#A6988B" />
                  </TouchableOpacity>
                </View>

                {/* Вкладки категорій стікерів */}
                <View className="flex-row bg-[#2A2420] p-1 rounded-2xl my-3 border border-[#3A322C]">
                  <TouchableOpacity
                    onPress={() => setStickerTab("animals")}
                    className={`flex-1 py-2 rounded-xl items-center ${
                      stickerTab === "animals"
                        ? "bg-[#3A322C]"
                        : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        stickerTab === "animals"
                          ? "text-[#E89D43]"
                          : "text-[#A6988B]"
                      }`}
                    >
                      🐶 Маскоти
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setStickerTab("reactions")}
                    className={`flex-1 py-2 rounded-xl items-center ${
                      stickerTab === "reactions"
                        ? "bg-[#3A322C]"
                        : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        stickerTab === "reactions"
                          ? "text-[#E89D43]"
                          : "text-[#A6988B]"
                      }`}
                    >
                      🔥 Реакції
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setStickerTab("fun")}
                    className={`flex-1 py-2 rounded-xl items-center ${
                      stickerTab === "fun" ? "bg-[#3A322C]" : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        stickerTab === "fun"
                          ? "text-[#E89D43]"
                          : "text-[#A6988B]"
                      }`}
                    >
                      🎮 Фан
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setStickerTab("phrases")}
                    className={`flex-1 py-2 rounded-xl items-center ${
                      stickerTab === "phrases"
                        ? "bg-[#3A322C]"
                        : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        stickerTab === "phrases"
                          ? "text-[#E89D43]"
                          : "text-[#A6988B]"
                      }`}
                    >
                      💬 Фрази
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Сітка стікерів */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="flex-1"
                >
                  {stickerTab === "phrases" ? (
                    <View className="flex-row flex-wrap gap-2 py-2">
                      {STICKER_PACKS.phrases.map((phrase, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => handleSendSticker(phrase)}
                          activeOpacity={0.7}
                          className="bg-[#2A2420] border border-[#3A322C] px-3.5 py-2.5 rounded-2xl active:bg-[#3A322C]"
                        >
                          <Text className="text-[#F4EAE1] font-semibold text-sm">
                            {phrase}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap justify-between py-2">
                      {STICKER_PACKS[stickerTab].map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => handleSendSticker(item)}
                          activeOpacity={0.6}
                          className="w-[22%] aspect-square bg-[#2A2420] rounded-2xl border border-[#3A322C]/60 items-center justify-center m-1 active:bg-[#3A322C]"
                        >
                          <Text className="text-[36px]">{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 5. МОДАЛЬНЕ МЕНЮ ДІЙ З ПОВІДОМЛЕННЯМ (РЕАКЦІЇ, РЕДАГУВАННЯ, ВИДАЛЕННЯ) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isActionModalOpen}
        onRequestClose={() => setIsActionModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsActionModalOpen(false)}>
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <TouchableWithoutFeedback>
              <View className="bg-[#2A2420] border border-[#3A322C] rounded-3xl p-5 w-full max-w-sm shadow-2xl">
                {/* Швидкі реакції (емодзі) */}
                <Text className="text-[#A6988B] text-xs font-bold uppercase tracking-wider mb-2.5">
                  Реакція на повідомлення
                </Text>
                <View className="flex-row flex-wrap justify-between bg-[#1E1A17] p-2 rounded-2xl border border-[#3A322C]/60 mb-4">
                  {QUICK_REACTIONS.map((emoji) => {
                    const isMyReaction =
                      actionMessage?.reactions &&
                      actionMessage.reactions[emoji]?.includes(
                        currentUser?.id || "",
                      );
                    return (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => {
                          if (actionMessage) {
                            toggleReaction(actionMessage.id, emoji);
                          }
                          setIsActionModalOpen(false);
                        }}
                        activeOpacity={0.6}
                        className={`p-2 rounded-xl m-0.5 ${
                          isMyReaction
                            ? "bg-[#E89D43]/30"
                            : "bg-transparent active:bg-[#3A322C]"
                        }`}
                      >
                        <Text className="text-[24px]">{emoji}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Дії: Редагувати або Видалити */}
                <View className="space-y-2">
                  {actionMessage &&
                    actionMessage.isMe &&
                    !checkIsImage(actionMessage.text) &&
                    !checkIsSticker(actionMessage.text) &&
                    (!actionMessage.createdAt ||
                      Date.now() - actionMessage.createdAt <=
                        7 * 24 * 60 * 60 * 1000) && (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingMessage(actionMessage);
                          setInputText(actionMessage.text);
                          setIsActionModalOpen(false);
                        }}
                        activeOpacity={0.8}
                        className="flex-row items-center bg-[#3A322C] p-3.5 rounded-2xl mb-2"
                      >
                        <Edit3 size={18} color="#E89D43" />
                        <View className="ml-3 flex-1">
                          <Text className="text-[#F4EAE1] font-semibold text-sm">
                            Редагувати повідомлення
                          </Text>
                          <Text className="text-[#A6988B] text-[10px]">
                            Доступно протягом 7 днів
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                  {(actionMessage?.isMe || isSavedMessages) && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMessage(actionMessage);
                        setIsActionModalOpen(false);
                        setIsDeleteModalOpen(true);
                      }}
                      activeOpacity={0.8}
                      className="flex-row items-center bg-red-500/15 border border-red-500/30 p-3.5 rounded-2xl"
                    >
                      <Trash2 size={18} color="#EF4444" />
                      <Text className="text-red-400 font-semibold text-sm ml-3">
                        Видалити повідомлення
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 6. МОДАЛЬНЕ МЕНЮ ВИДАЛЕННЯ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDeleteModalOpen(false)}>
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <TouchableWithoutFeedback>
              <View className="bg-[#2A2420] border border-[#3A322C] rounded-3xl p-5 w-full max-w-sm shadow-2xl">
                <View className="flex-row items-center justify-between pb-3 border-b border-[#3A322C]">
                  <View className="flex-row items-center">
                    <Trash2 size={20} color="#EF4444" />
                    <Text className="text-[#F4EAE1] font-bold text-base ml-2.5">
                      Видалити повідомлення
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsDeleteModalOpen(false)}
                    className="p-1"
                  >
                    <X size={18} color="#A6988B" />
                  </TouchableOpacity>
                </View>

                <Text className="text-[#A6988B] text-xs my-4">
                  Оберіть варіант видалення для обраного повідомлення:
                </Text>

                <View className="flex-col space-y-3">
                  <TouchableOpacity
                    onPress={() => confirmDelete(false)}
                    activeOpacity={0.8}
                    className="bg-[#3A322C] py-3.5 rounded-2xl items-center mb-2"
                  >
                    <Text className="text-[#F4EAE1] font-semibold text-sm">
                      Видалити у себе
                    </Text>
                  </TouchableOpacity>

                  {!isSavedMessages && (
                    <TouchableOpacity
                      onPress={() => confirmDelete(true)}
                      activeOpacity={0.8}
                      className="bg-red-500/20 border border-red-500/40 py-3.5 rounded-2xl items-center"
                    >
                      <Text className="text-red-400 font-bold text-sm">
                        Видалити для всіх
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 6. ПОВНОЕКРАННИЙ ПЕРЕГЛЯД ЗОБРАЖЕННЯ З ЛЕГКОЮ РАМКОЮ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={Boolean(fullscreenImage)}
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View className="flex-1 bg-black/95 justify-center items-center px-4 py-8">
          <View className="absolute top-12 left-0 right-0 px-6 flex-row justify-between items-center z-20">
            <Text className="text-[#F4EAE1] font-bold text-base tracking-wide">
              Перегляд фотографії
            </Text>
            <TouchableOpacity
              onPress={() => setFullscreenImage(null)}
              activeOpacity={0.7}
              className="p-2.5 bg-[#2A2420] rounded-full border border-[#3A322C] active:bg-[#3A322C]"
            >
              <X size={20} color="#F4EAE1" />
            </TouchableOpacity>
          </View>

          {fullscreenImage && (
            <View className="w-full max-h-[82%] items-center justify-center border border-[#3A322C] rounded-3xl overflow-hidden shadow-2xl bg-[#1E1A17]">
              <Image
                source={{ uri: fullscreenImage }}
                contentFit="contain"
                style={{ width: "100%", height: "100%", minHeight: 320 }}
              />
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
