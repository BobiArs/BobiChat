import {
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Sparkles,
  Video,
  VideoOff,
} from "lucide-react-native";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface CallOverlayProps {
  visible: boolean;
  callType: "audio" | "video" | "screenshare";
  chatName: string;
  onEndCall: () => void;
}

export default function CallOverlay({
  visible,
  callType,
  chatName,
  onEndCall,
}: CallOverlayProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callType !== "audio");
  const [isScreenShare, setIsScreenShare] = useState(
    callType === "screenshare",
  );

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent={false} visible={visible}>
      <View className="flex-1 bg-[#1E1A17] justify-between p-6">
        {/* Шапка Дзвінка */}
        <View className="flex-row items-center justify-between mt-8">
          <View>
            <Text className="text-[#F4EAE1] text-2xl font-bold">
              {chatName}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2" />
              <Text className="text-[#A6988B] text-xs font-semibold">
                P2P Пряме з'єднання • 0ms latency
              </Text>
            </View>
          </View>

          {/* Плашка якості 1080p 60FPS */}
          <View className="flex-row items-center bg-[#E89D43]/20 border border-[#E89D43]/50 px-3 py-1.5 rounded-full">
            <Sparkles size={14} color="#E89D43" />
            <Text className="text-[#E89D43] text-xs font-bold ml-1.5">
              1080p 60FPS
            </Text>
          </View>
        </View>

        {/* Відео/Стрім Зона */}
        <View className="flex-1 my-6 bg-[#2A2420] border border-[#3A322C] rounded-3xl overflow-hidden items-center justify-center relative">
          {isScreenShare ? (
            <View className="items-center p-4">
              <Monitor size={64} color="#E89D43" />
              <Text className="text-[#F4EAE1] font-bold text-lg mt-4 text-center">
                Трансляція екрана 1080p 60FPS
              </Text>
              <Text className="text-[#A6988B] text-xs text-center mt-1">
                Потік транслюється напряму через P2P тунель
              </Text>
            </View>
          ) : isVideoOn ? (
            <View className="items-center">
              <Video size={48} color="#C89968" />
              <Text className="text-[#A6988B] text-sm mt-2">
                Камера увімкнена
              </Text>
            </View>
          ) : (
            <View className="w-24 h-24 rounded-full bg-[#1E1A17] border-2 border-[#E89D43] items-center justify-center">
              <Text className="text-[#E89D43] font-bold text-3xl">
                {chatName.charAt(0)}
              </Text>
            </View>
          )}

          {/* Індикатор FPS знизу екрана */}
          <View className="absolute bottom-4 left-4 bg-[#1E1A17]/80 px-3 py-1 rounded-lg border border-[#3A322C]">
            <Text className="text-emerald-400 font-bold text-[10px]">
              60.0 FPS • Bitrate: 6.2 Mbps
            </Text>
          </View>
        </View>

        {/* Панель Управління Дзвінком */}
        <View className="bg-[#2A2420] border border-[#3A322C] p-4 rounded-3xl flex-row items-center justify-around mb-4">
          <TouchableOpacity
            onPress={() => setIsMicOn(!isMicOn)}
            className={`p-4 rounded-2xl ${
              isMicOn ? "bg-[#3A322C]" : "bg-red-500/20 border border-red-500"
            }`}
          >
            {isMicOn ? (
              <Mic size={24} color="#F4EAE1" />
            ) : (
              <MicOff size={24} color="#EF4444" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsVideoOn(!isVideoOn)}
            className={`p-4 rounded-2xl ${
              isVideoOn ? "bg-[#3A322C]" : "bg-red-500/20 border border-red-500"
            }`}
          >
            {isVideoOn ? (
              <Video size={24} color="#F4EAE1" />
            ) : (
              <VideoOff size={24} color="#EF4444" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsScreenShare(!isScreenShare)}
            className={`p-4 rounded-2xl ${
              isScreenShare ? "bg-[#E89D43]" : "bg-[#3A322C]"
            }`}
          >
            <Monitor size={24} color={isScreenShare ? "#1E1A17" : "#F4EAE1"} />
          </TouchableOpacity>

          {/* Кнопка Покласти трубку */}
          <TouchableOpacity
            onPress={onEndCall}
            className="p-4 bg-red-600 rounded-2xl active:bg-red-700"
          >
            <PhoneOff size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
