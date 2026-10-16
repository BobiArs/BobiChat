import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, onSnapshot } from "firebase/firestore";

import AuthModal from "../../components/auth/AuthModal";
import ChatArea from "../../components/chat/ChatArea";
import AddFriendsModal from "../../components/friends/AddFriendsModal";
import CallOverlay from "../../components/media/CallOverlay";
import ProfileModal from "../../components/profile/ProfileModal";
import UserProfileModal from "../../components/profile/UserProfileModal";
import ChannelList, {
  Channel,
  Chat,
} from "../../components/sidebar/ChannelList";
import ServerSidebar, { Server } from "../../components/sidebar/ServerSidebar";
import { db, initDatabase } from "../database/db";
import { AuthService, UserSession } from "../services/authService";
import { dbFirestore } from "../services/firebase";

export default function Index() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<string>("dm");
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [callType, setCallType] = useState<"audio" | "video" | "screenshare">(
    "audio",
  );
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Динамічні дані з SQLite
  const [servers, setServers] = useState<Server[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  // Завантаження профілю користувача
  const loadUserProfile = () => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthOpen(false);
    } else {
      setCurrentUser(null);
      setIsAuthOpen(true);
    }
  };

  // Завантаження живих даних з SQLite
  const loadDatabaseData = () => {
    try {
      // 1. Сервери
      const serverRows = db.getAllSync<any>("SELECT * FROM servers;");
      const formattedServers: Server[] = serverRows.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon || undefined,
      }));
      setServers(formattedServers);

      // 2. Особисті чати користувача
      const chatRows = db.getAllSync<any>("SELECT * FROM chats;");
      const formattedChats: Chat[] = chatRows.map((c) => ({
        id: c.id,
        name: c.name,
        lastMessage: c.last_message || "Натисніть, щоб відкрити чат",
        isOnline: Boolean(c.is_online),
        avatar: c.avatar || undefined,
      }));
      setChats(formattedChats);

      // 3. Канали для серверів
      const channelRows = db.getAllSync<any>("SELECT * FROM channels;");
      const formattedChannels: Channel[] = channelRows.map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type as "text" | "voice",
      }));
      setChannels(formattedChannels);
    } catch (e) {
      console.error("Помилка завантаження даних з SQLite:", e);
    }
  };

  // Видалення чату зі списку
  const handleDeleteChat = async (chatId: string) => {
    try {
      // Видаляємо з локальної БД
      db.runSync("DELETE FROM messages WHERE chat_id = ?;", [chatId]);
      db.runSync("DELETE FROM chats WHERE id = ?;", [chatId]);

      if (activeChannel === chatId) {
        setActiveChannel(null);
      }
      loadDatabaseData();

      // Також очищуємо Firestore-кімнату для цього чату
      try {
        const user = AuthService.getCurrentUser();
        if (user) {
          const sorted = [user.id, chatId].sort();
          const roomId = `dm_${sorted[0]}_${sorted[1]}`;
          const messagesRef = collection(
            dbFirestore,
            "chats",
            roomId,
            "messages",
          );
          const { getDocs } = await import("firebase/firestore");
          const snap = await getDocs(messagesRef);
          const { deleteDoc, doc: fsDoc } = await import("firebase/firestore");
          snap.forEach((d) => {
            deleteDoc(fsDoc(dbFirestore, "chats", roomId, "messages", d.id));
          });
        }
      } catch (fireErr) {
        console.warn("Помилка очищення Firestore при видаленні чату:", fireErr);
      }
    } catch (e) {
      console.error("Помилка видалення чату:", e);
    }
  };


  // Відкриття профілю іншого користувача
  const handleOpenUserProfile = (user: any) => {
    if (!user) return;
    try {
      const rows = db.getAllSync<any>("SELECT * FROM users WHERE id = ?;", [
        user.id,
      ]);
      if (rows.length > 0) {
        setViewingUser(rows[0]);
        return;
      }
    } catch {}
    setViewingUser(user);
  };

  // Почати чат з користувачем із вікна його профілю
  const handleStartChatWithUser = (
    userId: string,
    userName: string,
    userAvatar?: string,
  ) => {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO chats (id, name, type, avatar, is_online, last_message)
         VALUES (?, ?, 'dm', ?, 1, 'Початок спілкування');`,
        [userId, userName, userAvatar || "", "Початок спілкування"],
      );
      loadDatabaseData();
      setActiveChannel(userId);
    } catch (e) {
      console.error("Помилка створення чату:", e);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    loadUserProfile();
  };

  // Відкриття чату "Обране" з 3-х крапок
  const handleOpenSavedMessages = () => {
    try {
      db.runSync(`
        INSERT OR IGNORE INTO chats (id, name, type, avatar, last_message, is_online)
        VALUES ('saved_messages', 'Обране', 'dm', 'BOOKMARK', 'Особистий простір для нотаток', 1);
      `);
      loadDatabaseData();
      setActiveChannel("saved_messages");
    } catch (e) {
      console.error("Помилка створення чату Обране:", e);
    }
  };

  useEffect(() => {
    initDatabase();
    loadDatabaseData();
    loadUserProfile();
  }, []);

  // Слідкуємо в реальному часі за запитами у друзі
  useEffect(() => {
    if (!currentUser?.id) return;

    const notifiedRequests = new Set<string>();

    const unsubscribe = onSnapshot(
      collection(dbFirestore, "friend_requests"),
      (snapshot) => {
        let pendingCount = 0;

        snapshot.forEach((docSnap) => {
          const req = docSnap.data();

          // 1. Новий вхідний запит у друзі для мене
          if (req.toId === currentUser.id && req.status === "pending") {
            pendingCount++;
            if (!notifiedRequests.has(req.id)) {
              notifiedRequests.add(req.id);
              Alert.alert(
                "Новий запит у друзі!",
                `${req.fromName || "Користувач"} надіслав(ла) вам запит у друзі.`,
                [
                  { text: "Пізніше", style: "cancel" },
                  {
                    text: "Переглянути",
                    onPress: () => setIsAddFriendsOpen(true),
                  },
                ],
              );
            }
          }

          // 2. Мій вихідний запит, який щойно прийняли
          if (req.fromId === currentUser.id && req.status === "accepted") {
            const acceptedKey = `accepted_${req.id}`;
            if (!notifiedRequests.has(acceptedKey)) {
              notifiedRequests.add(acceptedKey);

              try {
                const existing = db.getAllSync(
                  "SELECT id FROM chats WHERE id = ?;",
                  [req.toId],
                );
                if (existing.length === 0) {
                  db.runSync(
                    `INSERT OR REPLACE INTO users (id, username, avatar, provider)
                     VALUES (?, ?, ?, 'cloud');`,
                    [req.toId, req.toName, req.toAvatar || ""],
                  );
                  db.runSync(
                    `INSERT OR REPLACE INTO chats (id, name, type, avatar, is_online, last_message)
                     VALUES (?, ?, 'dm', ?, 1, 'Запит прийнято! Почніть спілкування');`,
                    [req.toId, req.toName, req.toAvatar || ""],
                  );
                  loadDatabaseData();
                  Alert.alert(
                    "Запит прийнято!",
                    `${req.toName} прийняв(ла) ваш запит у друзі! Чат створено.`,
                  );
                }
              } catch (e) {
                console.warn("Помилка додавання прийнятого друга:", e);
              }
            }
          }

          // 3. Мій вихідний запит, який відхилили
          if (req.fromId === currentUser.id && req.status === "rejected") {
            const rejectedKey = `rejected_${req.id}`;
            if (!notifiedRequests.has(rejectedKey)) {
              notifiedRequests.add(rejectedKey);
              Alert.alert(
                "Запит відхилено",
                `${req.toName || "Користувач"} відхилив(ла) ваш запит у друзі.`,
              );
            }
          }
        });

        setPendingRequestsCount(pendingCount);
      },
      (err) => {
        console.warn("Помилка підписки на запити у друзі:", err);
      },
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  const currentChatName =
    activeChannel === "saved_messages"
      ? "Обране"
      : activeTab === "dm"
        ? chats.find((c) => c.id === activeChannel)?.name || "Чат"
        : `# ${channels.find((c) => c.id === activeChannel)?.name || "Канал"}`;

  const currentChatAvatar = chats.find((c) => c.id === activeChannel)?.avatar;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1E1A17",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <StatusBar style="light" />

      {!activeChannel ? (
        <View className="flex-1 flex-row">
          <ServerSidebar
            activeTab={activeTab}
            setActiveTab={(id) => {
              setActiveTab(id);
              setActiveChannel(null);
              loadDatabaseData();
            }}
            servers={servers}
          />

          <ChannelList
            activeTab={activeTab}
            activeChannel={activeChannel || ""}
            setActiveChannel={(id) => setActiveChannel(id)}
            chats={chats}
            channels={channels}
            currentUser={currentUser}
            pendingRequestsCount={pendingRequestsCount}
            onOpenProfile={() => setIsProfileOpen(true)}
            onLogout={handleLogout}
            onOpenAddFriends={() => setIsAddFriendsOpen(true)}
            onOpenSavedMessages={handleOpenSavedMessages}
            onDeleteChat={handleDeleteChat}
            onViewUserProfile={handleOpenUserProfile}
          />
        </View>
      ) : (
        <ChatArea
          chatId={activeChannel}
          chatName={currentChatName}
          chatAvatar={currentChatAvatar}
          isOnline={true}
          onBack={() => {
            setActiveChannel(null);
            loadDatabaseData();
          }}
          onStartCall={(type) => {
            setCallType(type);
            setIsCallActive(true);
          }}
          onViewUserProfile={() => {
            if (activeChannel) {
              handleOpenUserProfile({
                id: activeChannel,
                username: currentChatName,
                avatar: currentChatAvatar,
              });
            }
          }}
        />
      )}

      {/* Модалка входу/реєстрації */}
      <AuthModal
        visible={isAuthOpen}
        onSuccess={() => {
          loadUserProfile();
          loadDatabaseData();
        }}
      />

      {/* Модалка налаштувань власного профілю */}
      <ProfileModal
        visible={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={() => {
          loadUserProfile();
          loadDatabaseData();
        }}
      />

      {/* Модалка перегляду чужого профілю */}
      <UserProfileModal
        visible={Boolean(viewingUser)}
        user={viewingUser}
        onClose={() => setViewingUser(null)}
        onStartChat={handleStartChatWithUser}
        onStartCall={(type) => {
          setCallType(type);
          setIsCallActive(true);
        }}
      />

      {/* Дзвінки та Демонстрація екрана 1080p 60FPS */}
      <CallOverlay
        visible={isCallActive}
        callType={callType}
        chatName={currentChatName}
        onEndCall={() => setIsCallActive(false)}
      />

      {/* Модалка додавання друзів */}
      <AddFriendsModal
        visible={isAddFriendsOpen}
        onClose={() => setIsAddFriendsOpen(false)}
        onFriendAdded={() => {
          loadUserProfile();
          loadDatabaseData();
        }}
        onViewUserProfile={handleOpenUserProfile}
      />
    </View>
  );
}
