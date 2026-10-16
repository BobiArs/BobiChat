import { db } from "@/database/db";
import { AuthService } from "@/services/authService";
import { dbFirestore } from "@/services/firebase";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Message } from "../components/chat/ChatArea";

// Детермінований ідентифікатор кімнати для 1-на-1 чату, спільний для обох співрозмовників
const getFirestoreRoomId = (chatId: string, currentUserId?: string) => {
  if (
    chatId === "saved_messages" ||
    chatId.startsWith("srv_") ||
    chatId.startsWith("ch_") ||
    !currentUserId
  ) {
    return chatId;
  }
  const sorted = [currentUserId, chatId].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
};

/**
 * Оновлює поле last_message в таблиці chats на основі останнього повідомлення,
 * яке фактично залишилось у SQLite. Якщо повідомлень нема — очищує прев'ю.
 */
const refreshLastMessage = (chatId: string) => {
  try {
    const lastRows = db.getAllSync<any>(
      `SELECT text FROM messages WHERE chat_id = ? ORDER BY created_at DESC, timestamp DESC LIMIT 1;`,
      [chatId],
    );
    if (lastRows.length > 0) {
      const lastText = lastRows[0].text;
      const preview = lastText?.startsWith("[image:")
        ? "📷 Фотографія"
        : lastText;
      db.runSync(`UPDATE chats SET last_message = ? WHERE id = ?;`, [
        preview,
        chatId,
      ]);
    } else {
      db.runSync(`UPDATE chats SET last_message = ? WHERE id = ?;`, [
        "",
        chatId,
      ]);
    }
  } catch {}
};

export function useLocalChat(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const currentUser = AuthService.getCurrentUser();

  // Зберігаємо ID повідомлень, які були видалені локально ("у себе"),
  // щоб onSnapshot "added" не вставив їх назад при перемонтуванні/початковому снапшоті.
  const deletedIdsRef = useRef<Set<string>>(new Set());

  const loadLocalMessages = () => {
    if (!chatId) return;
    try {
      const rows = db.getAllSync<any>(
        "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC, timestamp ASC",
        [chatId],
      );
      setMessages(
        rows.map((row) => {
          let reactionsMap: { [key: string]: string[] } = {};
          try {
            if (row.reactions) {
              reactionsMap = JSON.parse(row.reactions);
            }
          } catch {}

          return {
            id: row.id,
            senderId: row.sender_id,
            text: row.text,
            timestamp: row.timestamp,
            isMe: row.sender_id === currentUser?.id || Boolean(row.is_me),
            status: row.status,
            isEdited: Boolean(row.is_edited),
            createdAt: row.created_at || undefined,
            reactions: reactionsMap,
          };
        }),
      );
    } catch (e) {
      console.error("Помилка зчитування з SQLite:", e);
    }
  };

  // При зміні chatId — скидаємо список видалених
  useEffect(() => {
    deletedIdsRef.current = new Set();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    // Спочатку миттєво показуємо повідомлення з SQLite
    loadLocalMessages();

    // Спільна кімната в Firestore для обох користувачів
    const roomId = getFirestoreRoomId(chatId, currentUser?.id);
    const messagesRef = collection(dbFirestore, "chats", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(200));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let hasChange = false;
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const msgId = change.doc.id;

        if (change.type === "added") {
          // Якщо повідомлення було видалено локально — пропускаємо, не вставляємо назад
          if (deletedIdsRef.current.has(msgId)) {
            return;
          }

          const isMyMsg = data.senderId === currentUser?.id;
          const reactionsJson = JSON.stringify(data.reactions || {});

          try {
            db.runSync(
              `INSERT OR IGNORE INTO messages (id, chat_id, sender_id, text, timestamp, is_me, status, is_edited, created_at, reactions)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                msgId,
                chatId,
                data.senderId,
                data.text,
                data.timestamp,
                isMyMsg ? 1 : 0,
                "read",
                data.isEdited ? 1 : 0,
                data.createdAt || Date.now(),
                reactionsJson,
              ],
            );
            hasChange = true;
          } catch {}
        } else if (change.type === "modified") {
          try {
            const reactionsJson = JSON.stringify(data.reactions || {});
            db.runSync(
              `UPDATE messages SET text = ?, is_edited = ?, reactions = ? WHERE id = ?;`,
              [data.text, data.isEdited ? 1 : 0, reactionsJson, msgId],
            );
            hasChange = true;
          } catch {}
        } else if (change.type === "removed") {
          try {
            db.runSync(`DELETE FROM messages WHERE id = ?;`, [msgId]);
            deletedIdsRef.current.add(msgId);
            hasChange = true;
          } catch {}
        }
      });

      if (hasChange) {
        refreshLastMessage(chatId);
        loadLocalMessages();
      }
    });

    return () => unsubscribe();
  }, [chatId, currentUser?.id]);

  const sendMessage = async (text: string) => {
    if (!chatId || !text.trim() || !currentUser) return;

    const cleanText = text.trim();
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    // Єдиний унікальний ID для локальної БД та Firestore (усуває дублювання)
    const localId = `msg_${now}_${Math.random().toString(36).substring(2, 7)}`;

    // Якщо цей ID раніше було видалено — знімаємо прапорець
    deletedIdsRef.current.delete(localId);

    // 1. Оптимістично записуємо в локальну SQLite
    try {
      db.runSync(
        `INSERT OR REPLACE INTO messages (id, chat_id, sender_id, text, timestamp, is_me, status, is_edited, created_at, reactions)
         VALUES (?, ?, ?, ?, ?, 1, 'sent', 0, ?, '{}');`,
        [localId, chatId, currentUser.id, cleanText, timeStr, now],
      );
      const previewText = cleanText.startsWith("[image:")
        ? "📷 Фотографія"
        : cleanText;
      db.runSync(`UPDATE chats SET last_message = ? WHERE id = ?;`, [
        previewText,
        chatId,
      ]);
      loadLocalMessages();
    } catch (e) {
      console.warn("Помилка локального запису повідомлення:", e);
    }

    const msgPayload = {
      id: localId,
      senderId: currentUser.id,
      text: cleanText,
      timestamp: timeStr,
      createdAt: now,
      isEdited: false,
      reactions: {},
    };

    try {
      // 2. Відправляємо в спільну Firestore кімнату з ідентичним docId localId (усуває дублікат!)
      const roomId = getFirestoreRoomId(chatId, currentUser.id);
      await setDoc(
        doc(dbFirestore, "chats", roomId, "messages", localId),
        msgPayload,
      );
    } catch (error) {
      console.warn("Помилка відправки в Firestore:", error);
    }
  };

  // Редагування повідомлення (протягом 7 днів від дати надсилання)
  const editMessage = async (
    messageId: string,
    newText: string,
  ): Promise<boolean> => {
    if (!chatId || !newText.trim() || !currentUser) return false;

    const trimmed = newText.trim();
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg || !targetMsg.isMe) return false;

    // Перевірка терміну 7 днів
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (targetMsg.createdAt && Date.now() - targetMsg.createdAt > sevenDaysMs) {
      return false;
    }

    try {
      db.runSync(
        `UPDATE messages SET text = ?, is_edited = 1, edited_at = ? WHERE id = ?;`,
        [trimmed, Date.now(), messageId],
      );
      refreshLastMessage(chatId);
      loadLocalMessages();

      const roomId = getFirestoreRoomId(chatId, currentUser.id);
      await setDoc(
        doc(dbFirestore, "chats", roomId, "messages", messageId),
        { text: trimmed, isEdited: true, editedAt: Date.now() },
        { merge: true },
      );
      return true;
    } catch (e) {
      console.error("Помилка редагування повідомлення:", e);
      return false;
    }
  };

  // Поставити / зняти реакцію на будь-яке повідомлення
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!chatId || !currentUser) return;

    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    const currentReactions: { [key: string]: string[] } = targetMsg.reactions
      ? { ...targetMsg.reactions }
      : {};

    const userList = currentReactions[emoji]
      ? [...currentReactions[emoji]]
      : [];
    const userIndex = userList.indexOf(currentUser.id);

    if (userIndex >= 0) {
      userList.splice(userIndex, 1);
      if (userList.length === 0) {
        delete currentReactions[emoji];
      } else {
        currentReactions[emoji] = userList;
      }
    } else {
      userList.push(currentUser.id);
      currentReactions[emoji] = userList;
    }

    const reactionsJson = JSON.stringify(currentReactions);

    try {
      db.runSync(`UPDATE messages SET reactions = ? WHERE id = ?;`, [
        reactionsJson,
        messageId,
      ]);
      loadLocalMessages();

      const roomId = getFirestoreRoomId(chatId, currentUser.id);
      await setDoc(
        doc(dbFirestore, "chats", roomId, "messages", messageId),
        { reactions: currentReactions },
        { merge: true },
      );
    } catch (e) {
      console.error("Помилка встановлення реакції:", e);
    }
  };

  const deleteMessage = async (messageId: string, forEveryone: boolean) => {
    if (!chatId) return;

    try {
      // Позначаємо як видалений локально, щоб onSnapshot не вставив назад
      deletedIdsRef.current.add(messageId);

      db.runSync("DELETE FROM messages WHERE id = ? AND chat_id = ?", [
        messageId,
        chatId,
      ]);

      // Оновлюємо last_message на основі реального останнього повідомлення
      refreshLastMessage(chatId);

      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      if (forEveryone && currentUser) {
        const roomId = getFirestoreRoomId(chatId, currentUser.id);
        await deleteDoc(
          doc(dbFirestore, "chats", roomId, "messages", messageId),
        );
      }
    } catch (error) {
      console.error("Помилка видалення повідомлення:", error);
    }
  };

  return {
    messages,
    sendMessage,
    editMessage,
    toggleReaction,
    deleteMessage,
  };
}

