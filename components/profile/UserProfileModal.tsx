import { Image } from "expo-image";
import {
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Tag,
  Video,
  X,
} from "lucide-react-native";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export interface UserProfileData {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  custom_status?: string;
  customStatus?: string;
  status?: "online" | "dnd" | "invisible" | string;
  tag?: string;
  created_at?: number | string;
}

interface UserProfileModalProps {
  visible: boolean;
  user: UserProfileData | null;
  onClose: () => void;
  onStartChat?: (userId: string, userName: string, userAvatar?: string) => void;
  onStartCall?: (type: "audio" | "video") => void;
}

export default function UserProfileModal({
  visible,
  user,
  onClose,
  onStartChat,
  onStartCall,
}: UserProfileModalProps) {
  if (!visible || !user) return null;

  const username = user.username || "Користувач";
  const avatar = user.avatar;
  const status = user.status || "online";
  const tag = user.tag || "#online";
  const customStatus =
    user.custom_status || user.customStatus || "Користувач Bobi Chat";
  const email = user.email || "";

  const isDnd = status === "dnd";
  const isInvisible = status === "invisible";
  const statusColor = isDnd
    ? "bg-red-500"
    : isInvisible
      ? "bg-gray-400"
      : "bg-emerald-500";
  const statusText = isDnd
    ? "Не турбувати"
    : isInvisible
      ? "Невидимий"
      : "В мережі";

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/70 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-[#1E1A17] border-t border-[#3A322C] rounded-t-3xl max-h-[85%] flex-col overflow-hidden">
              {/* Шапка-банер */}
              <View className="h-28 bg-[#3A322C] relative justify-between p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center bg-[#1E1A17]/60 px-3 py-1 rounded-full border border-[#3A322C]">
                    <Sparkles size={12} color="#E89D43" />
                    <Text className="text-[#E89D43] text-xs font-bold ml-1.5">
                      Профіль Bobi Chat
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    className="p-2 bg-[#1E1A17]/70 rounded-full"
                  >
                    <X size={18} color="#F4EAE1" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Аватар по центру, накладений на банер */}
              <View className="px-6 -mt-14 flex-row items-end justify-between">
                <View className="relative">
                  <View className="w-24 h-24 rounded-full bg-[#E89D43] items-center justify-center border-4 border-[#1E1A17] overflow-hidden shadow-2xl">
                    {avatar && avatar.length > 5 ? (
                      <Image
                        source={{ uri: avatar }}
                        contentFit="cover"
                        style={{ width: "100%", height: "100%" }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Text className="text-[#1E1A17] font-bold text-3xl">
                        {username.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View
                    className={`w-5 h-5 rounded-full border-2 border-[#1E1A17] absolute bottom-1 right-1 ${statusColor}`}
                  />
                </View>

                {/* Швидкі кнопки дій */}
                <View className="flex-row space-x-2 pb-1">
                  {onStartCall && (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          onClose();
                          onStartCall("audio");
                        }}
                        activeOpacity={0.7}
                        className="p-3 bg-[#2A2420] rounded-2xl border border-[#3A322C] mr-2 active:bg-[#3A322C]"
                      >
                        <Phone size={18} color="#E89D43" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          onClose();
                          onStartCall("video");
                        }}
                        activeOpacity={0.7}
                        className="p-3 bg-[#2A2420] rounded-2xl border border-[#3A322C] mr-2 active:bg-[#3A322C]"
                      >
                        <Video size={18} color="#E89D43" />
                      </TouchableOpacity>
                    </>
                  )}

                  {onStartChat && (
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onStartChat(user.id, username, avatar);
                      }}
                      activeOpacity={0.8}
                      className="px-4 py-3 bg-[#E89D43] rounded-2xl flex-row items-center shadow-lg"
                    >
                      <MessageSquare size={18} color="#1E1A17" />
                      <Text className="text-[#1E1A17] font-bold text-xs ml-2">
                        Написати
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <ScrollView
                className="px-6 pt-4 pb-8"
                showsVerticalScrollIndicator={false}
              >
                {/* Ім'я та статус */}
                <View className="mb-4">
                  <View className="flex-row items-center">
                    <Text
                      className="text-[#F4EAE1] font-bold text-2xl"
                      numberOfLines={1}
                    >
                      {username}
                    </Text>
                    <Text className="text-[#E89D43] font-semibold text-sm ml-2">
                      {tag}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <View
                      className={`w-2.5 h-2.5 rounded-full ${statusColor} mr-2`}
                    />
                    <Text className="text-[#A6988B] text-xs font-medium">
                      {statusText}
                    </Text>
                  </View>
                </View>

                {/* Про мене / Custom Status */}
                <View className="bg-[#2A2420] p-4 rounded-2xl border border-[#3A322C] mb-4">
                  <Text className="text-[#A6988B] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    Про мене
                  </Text>
                  <Text className="text-[#F4EAE1] text-sm leading-5 font-medium">
                    {customStatus}
                  </Text>
                </View>

                {/* Інформація про акаунт */}
                <View className="bg-[#2A2420] p-4 rounded-2xl border border-[#3A322C] mb-6 space-y-3">
                  <Text className="text-[#A6988B] text-[11px] font-bold uppercase tracking-wider mb-2">
                    Дані профілю
                  </Text>

                  {email ? (
                    <View className="flex-row items-center my-1">
                      <View className="w-8 h-8 rounded-xl bg-[#3A322C] items-center justify-center mr-3">
                        <Mail size={16} color="#E89D43" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#A6988B] text-[10px]">
                          Електронна пошта
                        </Text>
                        <Text
                          className="text-[#F4EAE1] text-xs font-semibold"
                          numberOfLines={1}
                        >
                          {email}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  <View className="flex-row items-center my-1">
                    <View className="w-8 h-8 rounded-xl bg-[#3A322C] items-center justify-center mr-3">
                      <Tag size={16} color="#E89D43" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#A6988B] text-[10px]">
                        ID користувача
                      </Text>
                      <Text
                        className="text-[#F4EAE1] text-xs font-semibold"
                        numberOfLines={1}
                      >
                        {user.id}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
