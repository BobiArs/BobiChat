import { UserSession } from "@/services/authService";
import {
  Bookmark,
  EllipsisVertical as MoreVertical,
  Hash,
  LogOut,
  MessageSquarePlus,
  Settings,
  Sparkles,
  Trash as Trash2,
  User,
  UserPlus,
  Volume2,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Image } from "expo-image";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export interface Chat {
  id: string;
  name: string;
  lastMessage?: string;
  isOnline?: boolean;
  avatar?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  hasScreenShare?: boolean;
}

interface ChannelListProps {
  activeTab: string;
  activeChannel: string;
  setActiveChannel: (id: string) => void;
  chats: Chat[];
  channels: Channel[];
  currentUser?: UserSession | null;
  pendingRequestsCount?: number;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  onOpenAddFriends?: () => void;
  onOpenSavedMessages?: () => void;
  onDeleteChat?: (chatId: string) => void;
  onViewUserProfile?: (user: any) => void;
}

export default function ChannelList({
  activeTab,
  activeChannel,
  setActiveChannel,
  chats,
  channels,
  currentUser,
  pendingRequestsCount = 0,
  onOpenProfile,
  onLogout,
  onOpenAddFriends,
  onOpenSavedMessages,
  onDeleteChat,
  onViewUserProfile,
}: ChannelListProps) {
  const isDM = activeTab === "dm";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedChatForMenu, setSelectedChatForMenu] = useState<Chat | null>(
    null,
  );

  return (
    <View className="flex-1 h-full bg-[#2A2420] border-r border-[#3A322C]/40 flex-col relative">
      {/* Шапка каналів / чатів з 3 крапками справа */}
      <View className="h-14 border-b border-[#3A322C]/50 px-4 flex-row items-center justify-between bg-[#2A2420]">
        <View className="flex-row items-center space-x-2 flex-1">
          <Text
            className="text-[#F4EAE1] font-bold text-base tracking-wide"
            numberOfLines={1}
          >
            {isDM ? "Особисті чати" : "Сервер спільноти"}
          </Text>
        </View>

        <View className="flex-row items-center space-x-1.5">
          {isDM && (
            <TouchableOpacity
              onPress={onOpenAddFriends}
              activeOpacity={0.7}
              className="p-2 bg-[#3A322C]/60 rounded-xl active:bg-[#3A322C] relative"
            >
              <UserPlus size={18} color="#E89D43" />
              {pendingRequestsCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 border border-[#2A2420]">
                  <Text className="text-[10px] font-bold text-white">
                    {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Кнопка 3 Крапки (Меню дій) */}
          <TouchableOpacity
            onPress={() => setIsMenuOpen(true)}
            activeOpacity={0.7}
            className="p-2 bg-[#3A322C]/60 rounded-xl active:bg-[#3A322C]"
          >
            <MoreVertical size={18} color="#F4EAE1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Основний список чатів */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-3 pt-3"
      >
        {isDM ? (
          <View className="flex-col">
            <Text className="text-[#A6988B] text-[11px] font-bold px-2 mb-2 uppercase tracking-wider">
              Прямі повідомлення
            </Text>

            {chats.length > 0 ? (
              chats.map((chat) => {
                const isActive = activeChannel === chat.id;
                const isBookmark = chat.id === "saved_messages";

                return (
                  <TouchableOpacity
                    key={chat.id}
                    onPress={() => setActiveChannel(chat.id)}
                    onLongPress={() => !isBookmark && setSelectedChatForMenu(chat)}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-3 py-2.5 rounded-xl my-1 ${
                      isActive
                        ? "bg-[#3A322C]"
                        : "bg-[#2A2420] active:bg-[#3A322C]/50"
                    }`}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        if (!isBookmark && onViewUserProfile) {
                          onViewUserProfile({
                            id: chat.id,
                            username: chat.name,
                            avatar: chat.avatar,
                          });
                        } else {
                          setActiveChannel(chat.id);
                        }
                      }}
                      className="relative"
                    >
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center border overflow-hidden ${
                          isBookmark
                            ? "bg-[#E89D43] border-[#E89D43]"
                            : "bg-[#1E1A17] border-[#3A322C]"
                        }`}
                      >
                        {isBookmark ? (
                          <Bookmark size={18} color="#1E1A17" />
                        ) : chat.avatar && chat.avatar.length > 5 ? (
                          <Image
                            source={{ uri: chat.avatar }}
                            contentFit="cover"
                            style={{ width: "100%", height: "100%" }}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          <Text className="text-[#E89D43] font-bold text-base">
                            {chat.name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      {chat.isOnline && !isBookmark && (
                        <View className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#2A2420] absolute bottom-0 right-0" />
                      )}
                    </TouchableOpacity>

                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className="text-[#F4EAE1] font-semibold text-sm"
                          numberOfLines={1}
                        >
                          {chat.name}
                        </Text>
                      </View>
                      <Text
                        className="text-[#A6988B] text-xs mt-0.5"
                        numberOfLines={1}
                      >
                        {chat.lastMessage || "Натисніть, щоб відкрити чат"}
                      </Text>
                    </View>

                    {!isBookmark && (
                      <TouchableOpacity
                        onPress={() => setSelectedChatForMenu(chat)}
                        activeOpacity={0.6}
                        className="p-1.5 rounded-lg active:bg-[#3A322C]"
                      >
                        <MoreVertical size={16} color="#A6988B" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="items-center justify-center py-16 px-4">
                <View className="w-14 h-14 rounded-2xl bg-[#3A322C]/50 items-center justify-center mb-3">
                  <MessageSquarePlus size={24} color="#E89D43" />
                </View>
                <Text className="text-[#F4EAE1] font-bold text-sm text-center mb-1">
                  Немає активних чатів
                </Text>
                <Text className="text-[#A6988B] text-xs text-center mb-4">
                  Скористайтеся 3 крапками зверху для «Обране» або додайте
                  друга!
                </Text>

                <TouchableOpacity
                  onPress={onOpenAddFriends}
                  activeOpacity={0.8}
                  className="bg-[#E89D43] px-4 py-2.5 rounded-xl flex-row items-center"
                >
                  <UserPlus size={16} color="#1E1A17" />
                  <Text className="text-[#1E1A17] font-bold text-xs ml-2">
                    Знайти друга
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-col gap-4">
            {/* Текстові канали */}
            <View>
              <Text className="text-[#A6988B] text-[11px] font-bold px-2 mb-1.5 uppercase tracking-wider">
                Текстові канали
              </Text>
              {channels.length > 0 ? (
                channels
                  .filter((c) => c.type === "text")
                  .map((channel) => {
                    const isActive = activeChannel === channel.id;
                    return (
                      <TouchableOpacity
                        key={channel.id}
                        onPress={() => setActiveChannel(channel.id)}
                        activeOpacity={0.7}
                        className={`flex-row items-center px-2.5 py-2 rounded-lg my-0.5 ${
                          isActive
                            ? "bg-[#3A322C]"
                            : "bg-transparent active:bg-[#3A322C]/40"
                        }`}
                      >
                        <Hash
                          size={18}
                          color={isActive ? "#E89D43" : "#A6988B"}
                        />
                        <Text
                          className={`ml-2 text-sm flex-1 ${
                            isActive
                              ? "text-[#F4EAE1] font-bold"
                              : "text-[#A6988B]"
                          }`}
                          numberOfLines={1}
                        >
                          {channel.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
              ) : (
                <Text className="text-[#A6988B] text-xs px-2 py-2">
                  Немає каналів на цьому сервері
                </Text>
              )}
            </View>

            {/* Голосові канали */}
            <View>
              <View className="flex-row items-center justify-between px-2 mb-1.5">
                <Text className="text-[#A6988B] text-[11px] font-bold uppercase tracking-wider">
                  Голосові кімнати
                </Text>
                <View className="flex-row items-center bg-[#E89D43]/20 px-1.5 py-0.5 rounded-full border border-[#E89D43]/40">
                  <Sparkles size={10} color="#E89D43" />
                  <Text className="text-[#E89D43] text-[9px] font-bold ml-1">
                    1080p 60FPS
                  </Text>
                </View>
              </View>

              {channels
                .filter((c) => c.type === "voice")
                .map((channel) => {
                  const isActive = activeChannel === channel.id;
                  return (
                    <TouchableOpacity
                      key={channel.id}
                      onPress={() => setActiveChannel(channel.id)}
                      activeOpacity={0.7}
                      className={`flex-row items-center px-2.5 py-2 rounded-lg my-0.5 ${
                        isActive
                          ? "bg-[#3A322C]"
                          : "bg-transparent active:bg-[#3A322C]/40"
                      }`}
                    >
                      <Volume2
                        size={18}
                        color={isActive ? "#E89D43" : "#A6988B"}
                      />
                      <Text
                        className={`ml-2 text-sm flex-1 ${
                          isActive
                            ? "text-[#F4EAE1] font-bold"
                            : "text-[#A6988B]"
                        }`}
                        numberOfLines={1}
                      >
                        {channel.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Модальне вікно меню 3 Крапок */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isMenuOpen}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View className="flex-1 bg-black/50 justify-start items-end pt-16 pr-6">
            <TouchableWithoutFeedback>
              <View className="bg-[#2A2420] border border-[#3A322C] rounded-2xl p-2 w-52 shadow-2xl space-y-1">
                {/* Кнопка "Обране" (Збережені) */}
                <TouchableOpacity
                  onPress={() => {
                    setIsMenuOpen(false);
                    onOpenSavedMessages?.();
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center px-3 py-3 rounded-xl active:bg-[#3A322C]"
                >
                  <Bookmark size={18} color="#E89D43" />
                  <Text className="text-[#F4EAE1] font-bold text-sm ml-3">
                    Обране
                  </Text>
                </TouchableOpacity>

                <View className="h-[1px] bg-[#3A322C] my-1" />

                {/* Кнопка "Додати в друзі" */}
                <TouchableOpacity
                  onPress={() => {
                    setIsMenuOpen(false);
                    onOpenAddFriends?.();
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center px-3 py-2.5 rounded-xl active:bg-[#3A322C]"
                >
                  <UserPlus size={18} color="#A6988B" />
                  <Text className="text-[#F4EAE1] font-medium text-sm ml-3">
                    Знайти друга
                  </Text>
                </TouchableOpacity>

                {/* Кнопка "Профіль" */}
                <TouchableOpacity
                  onPress={() => {
                    setIsMenuOpen(false);
                    onOpenProfile?.();
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center px-3 py-2.5 rounded-xl active:bg-[#3A322C]"
                >
                  <Settings size={18} color="#A6988B" />
                  <Text className="text-[#F4EAE1] font-medium text-sm ml-3">
                    Налаштування
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Модальне меню дій над окремим чатом (Видалення / Профіль) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={Boolean(selectedChatForMenu)}
        onRequestClose={() => setSelectedChatForMenu(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedChatForMenu(null)}>
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <TouchableWithoutFeedback>
              <View className="bg-[#2A2420] border border-[#3A322C] rounded-3xl p-5 w-full max-w-sm shadow-2xl">
                <View className="flex-row items-center justify-between pb-3 border-b border-[#3A322C]">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-8 h-8 rounded-full bg-[#E89D43] items-center justify-center overflow-hidden mr-2.5">
                      {selectedChatForMenu?.avatar &&
                      selectedChatForMenu.avatar.length > 5 ? (
                        <Image
                          source={{ uri: selectedChatForMenu.avatar }}
                          contentFit="cover"
                          style={{ width: "100%", height: "100%" }}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <Text className="text-[#1E1A17] font-bold text-xs">
                          {selectedChatForMenu?.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text
                      className="text-[#F4EAE1] font-bold text-base"
                      numberOfLines={1}
                    >
                      {selectedChatForMenu?.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedChatForMenu(null)}
                    className="p-1"
                  >
                    <X size={18} color="#A6988B" />
                  </TouchableOpacity>
                </View>

                <View className="flex-col my-3 space-y-2">
                  {/* Переглянути профіль */}
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedChatForMenu && onViewUserProfile) {
                        onViewUserProfile({
                          id: selectedChatForMenu.id,
                          username: selectedChatForMenu.name,
                          avatar: selectedChatForMenu.avatar,
                        });
                      }
                      setSelectedChatForMenu(null);
                    }}
                    activeOpacity={0.7}
                    className="flex-row items-center p-3 bg-[#3A322C]/70 rounded-2xl active:bg-[#3A322C] mb-2"
                  >
                    <User size={18} color="#E89D43" />
                    <Text className="text-[#F4EAE1] font-semibold text-sm ml-3">
                      Переглянути профіль
                    </Text>
                  </TouchableOpacity>

                  {/* Видалити чат */}
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedChatForMenu) {
                        const targetChat = selectedChatForMenu;
                        Alert.alert(
                          "Видалити чат",
                          `Ви дійсно хочете видалити чат "${targetChat.name}"? Листування буде видалено.`,
                          [
                            { text: "Скасувати", style: "cancel" },
                            {
                              text: "Видалити",
                              style: "destructive",
                              onPress: () => {
                                onDeleteChat?.(targetChat.id);
                                setSelectedChatForMenu(null);
                              },
                            },
                          ],
                        );
                      }
                    }}
                    activeOpacity={0.7}
                    className="flex-row items-center p-3 bg-red-500/10 border border-red-500/30 rounded-2xl active:bg-red-500/20"
                  >
                    <Trash2 size={18} color="#EF4444" />
                    <Text className="text-red-400 font-bold text-sm ml-3">
                      Видалити цей чат
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Панель профілю користувача з підтримкою avatar */}
      <View className="h-16 bg-[#1E1A17] border-t border-[#3A322C]/50 px-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={onOpenProfile}
          activeOpacity={0.7}
          className="flex-row items-center flex-1 mr-2"
        >
          <View className="relative">
            <View className="w-9 h-9 rounded-full bg-[#E89D43] items-center justify-center border border-[#3A322C] overflow-hidden">
              {currentUser?.avatar ? (
                <Image
                  source={{ uri: currentUser.avatar }}
                  contentFit="cover"
                  style={{ width: "100%", height: "100%" }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-[#1E1A17] font-bold text-sm">
                  {currentUser?.username
                    ? currentUser.username.charAt(0).toUpperCase()
                    : "B"}
                </Text>
              )}
            </View>
            <View
              className={`w-3 h-3 rounded-full border-2 border-[#1E1A17] absolute bottom-0 right-0 ${
                currentUser?.status === "dnd"
                  ? "bg-red-500"
                  : currentUser?.status === "invisible"
                    ? "bg-gray-400"
                    : "bg-emerald-500"
              }`}
            />
          </View>
          <View className="ml-2.5 flex-1">
            <Text
              className="text-[#F4EAE1] font-bold text-xs"
              numberOfLines={1}
            >
              {currentUser?.username || "Користувач"}
            </Text>
            <Text
              className={`text-[10px] font-medium ${
                currentUser?.status === "dnd"
                  ? "text-red-400"
                  : currentUser?.status === "invisible"
                    ? "text-gray-400"
                    : "text-emerald-400"
              }`}
              numberOfLines={1}
            >
              {currentUser?.tag || `#${currentUser?.status || "online"}`}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center space-x-1">
          <TouchableOpacity
            onPress={onOpenProfile}
            activeOpacity={0.7}
            className="p-1.5 rounded-lg active:bg-[#3A322C]"
          >
            <Settings size={18} color="#A6988B" />
          </TouchableOpacity>

          {onLogout && (
            <TouchableOpacity
              onPress={onLogout}
              activeOpacity={0.7}
              className="p-1.5 rounded-lg active:bg-[#3A322C]"
            >
              <LogOut size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
