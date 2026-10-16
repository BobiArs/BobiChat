import { MessageSquare, Plus } from "lucide-react-native";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export interface Server {
  id: string;
  name: string;
  icon?: string;
}

interface ServerSidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  servers: Server[];
}

export default function ServerSidebar({
  activeTab,
  setActiveTab,
  servers,
}: ServerSidebarProps) {
  const isDmActive = activeTab === "dm";

  return (
    <View className="w-[72px] shrink-0 h-full bg-[#1E1A17] border-r border-[#3A322C]/50 items-center py-3">
      {/* Кнопка Особисті повідомлення (DM) */}
      <View className="w-full items-center justify-center relative mb-2">
        {isDmActive && (
          <View className="absolute left-0 w-1.5 h-8 bg-[#E89D43] rounded-r-full" />
        )}
        <TouchableOpacity
          onPress={() => setActiveTab("dm")}
          activeOpacity={0.7}
          className={`w-12 h-12 rounded-2xl items-center justify-center ${
            isDmActive ? "bg-[#E89D43]" : "bg-[#2A2420] active:bg-[#3A322C]"
          }`}
        >
          <MessageSquare
            size={22}
            color={isDmActive ? "#1E1A17" : "#C89968"}
          />
        </TouchableOpacity>
      </View>

      <View className="w-8 h-[2px] bg-[#3A322C]/70 rounded-full mb-3" />

      {/* Список серверів */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center", gap: 10 }}
        className="w-full flex-1"
      >
        {servers.map((server) => {
          const isActive = activeTab === server.id;
          return (
            <View
              key={server.id}
              className="w-full items-center justify-center relative"
            >
              {isActive && (
                <View className="absolute left-0 w-1.5 h-8 bg-[#E89D43] rounded-r-full" />
              )}
              <TouchableOpacity
                onPress={() => setActiveTab(server.id)}
                activeOpacity={0.7}
                className={`w-12 h-12 items-center justify-center overflow-hidden ${
                  isActive
                    ? "rounded-xl border-2 border-[#E89D43] bg-[#3A322C]"
                    : "rounded-2xl bg-[#2A2420] active:bg-[#3A322C]"
                }`}
              >
                {server.icon ? (
                  <Image
                    source={{ uri: server.icon }}
                    className="w-full h-full"
                  />
                ) : (
                  <Text className="text-[#F4EAE1] font-bold text-sm">
                    {server.name.substring(0, 2).toUpperCase()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          activeOpacity={0.7}
          className="w-12 h-12 rounded-2xl bg-[#2A2420] items-center justify-center border border-dashed border-[#C89968]/50 active:bg-[#3A322C]"
        >
          <Plus size={20} color="#C89968" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
