import { db } from "@/database/db";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, dbFirestore } from "./firebase";

export interface UserSession {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  customStatus?: string;
  status: "online" | "dnd" | "invisible";
  tag: string;
  provider: "email" | "google";
}

export const AuthService = {
  // Отримання поточного авторизованого користувача з активної сесії SQLite
  getCurrentUser: (): UserSession | null => {
    try {
      const rows = db.getAllSync<any>(`
        SELECT u.* FROM users u
        JOIN active_session s ON u.id = s.user_id
        WHERE s.id = 1
      `);

      if (rows.length > 0) {
        const user = rows[0];
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar || "",
          customStatus: user.custom_status || "",
          status: (user.status as "online" | "dnd" | "invisible") || "online",
          tag: user.tag || `#${user.status || "online"}`,
          provider: (user.provider as "email" | "google") || "email",
        };
      }
      return null;
    } catch (e) {
      console.error("Помилка зчитування сесії з SQLite:", e);
      return null;
    }
  },

  // Синхронізація профілю з Cloud Firestore
  syncUserToCloud: async (user: Partial<UserSession>) => {
    if (!user.id) return;
    try {
      await setDoc(
        doc(dbFirestore, "users", user.id),
        {
          id: user.id,
          username: user.username || "",
          email: user.email || "",
          avatar: user.avatar || "",
          customStatus: user.customStatus || "",
          status: user.status || "online",
          tag: user.tag || "#online",
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    } catch (e) {
      console.error("Помилка синхронізації профілю у Firestore:", e);
    }
  },

  // Завантаження всіх користувачів із Cloud Firestore та порівняння з SQLite
  fetchCloudUsers: async (): Promise<any[]> => {
    try {
      const querySnapshot = await getDocs(collection(dbFirestore, "users"));
      const users: any[] = [];

      const current = AuthService.getCurrentUser();
      const currentId = current?.id || "";

      querySnapshot.forEach((docSnap) => {
        const u = docSnap.data();
        const uid = u.id || docSnap.id;
        const username = u.username || "Користувач";
        const email = u.email || `${uid}@cloud.user`;
        const avatar = u.avatar || "";
        const customStatus = u.customStatus || u.custom_status || "";
        const status = u.status || "online";
        const tag = u.tag || "#online";
        const updatedAt = u.updatedAt || Date.now();

        const userItem = {
          id: uid,
          username,
          email,
          avatar,
          custom_status: customStatus,
          status,
          tag,
          updatedAt,
        };
        users.push(userItem);

        if (uid !== currentId) {
          try {
            db.runSync(
              `INSERT OR REPLACE INTO users (id, username, email, password, avatar, custom_status, status, tag, provider, created_at)
               VALUES (?, ?, ?, '', ?, ?, ?, ?, 'cloud', ?);`,
              [
                uid,
                username,
                email,
                avatar,
                customStatus,
                status,
                tag,
                updatedAt,
              ],
            );
          } catch {
            try {
              db.runSync(
                `UPDATE users SET username = ?, avatar = ?, custom_status = ?, status = ?, tag = ? WHERE id = ?;`,
                [username, avatar, customStatus, status, tag, uid],
              );
            } catch {}
          }
        }
      });

      // Порівняння: видаляємо з SQLite користувачів, яких видалили з Firebase!
      const validCloudIds = new Set(users.map((u) => u.id));

      try {
        const localCloudUsers = db.getAllSync<any>(
          "SELECT id FROM users WHERE provider = 'cloud';",
        );
        for (const loc of localCloudUsers) {
          if (!validCloudIds.has(loc.id) && loc.id !== currentId && loc.id !== "bot_user") {
            db.runSync("DELETE FROM users WHERE id = ?;", [loc.id]);
            db.runSync("DELETE FROM chats WHERE id = ?;", [loc.id]);
            db.runSync("DELETE FROM messages WHERE chat_id = ?;", [loc.id]);
          }
        }
      } catch (cleanErr) {
        console.warn("Помилка очищення видалених акаунтів з SQLite:", cleanErr);
      }

      return users;
    } catch (e) {
      console.error("Помилка завантаження акаунтів із Firestore:", e);
      return [];
    }
  },

  // Реєстрація нового акаунта у Pure Firebase Auth + Cloud Firestore + Local SQLite
  register: async (
    username: string,
    email: string,
    password?: string,
    provider: "email" | "google" = "email",
  ): Promise<{ success: boolean; error?: string; user?: UserSession }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = username.trim();
      const pass = password || "123456";

      // 1. Створюємо офіційний акаунт у Firebase Authentication
      let firebaseUid = `usr_${Date.now()}`;
      try {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          pass,
        );
        firebaseUid = userCred.user.uid;
      } catch (fbErr: any) {
        if (fbErr.code !== "auth/email-already-in-use") {
          if (fbErr.code === "auth/operation-not-allowed") {
            console.warn(
              "⚠️ Firebase Auth: Спосіб входу 'Email/Password' вимкнено у Firebase Console!\n" +
              "Увімкніть його: Firebase Console -> Authentication -> Sign-in method -> Email/Password -> Enable",
            );
          } else {
            console.log("Попередження Firebase Auth:", fbErr.message);
          }
        }
      }

      const tag = `#${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Зберігаємо у локальну базу даних SQLite
      db.runSync(
        `INSERT OR REPLACE INTO users (id, username, email, password, custom_status, status, tag, provider, created_at)
         VALUES (?, ?, ?, ?, 'Користувач Bobi Chat', 'online', ?, ?, ?);`,
        [
          firebaseUid,
          cleanName,
          cleanEmail,
          pass,
          tag,
          provider,
          Date.now(),
        ],
      );

      db.runSync(
        `INSERT OR REPLACE INTO active_session (id, user_id) VALUES (1, ?);`,
        [firebaseUid],
      );

      const user: UserSession = {
        id: firebaseUid,
        username: cleanName,
        email: cleanEmail,
        customStatus: "Користувач Bobi Chat",
        status: "online",
        tag,
        provider,
      };

      // 3. Синхронізуємо профіль у Cloud Firestore
      await AuthService.syncUserToCloud(user);

      return { success: true, user };
    } catch (e: any) {
      console.error("Помилка реєстрації:", e);
      return {
        success: false,
        error: e.message || "Помилка створення акаунта у Firebase",
      };
    }
  },

  // Вхід в акаунт через Pure Firebase Auth
  login: async (
    email: string,
    password?: string,
    provider: "email" | "google" = "email",
    googleName?: string,
  ): Promise<{ success: boolean; error?: string; user?: UserSession }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const pass = password || "123456";

      // 1. Авторизуємось через Firebase Authentication
      let firebaseUid = "";
      try {
        const userCred = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          pass,
        );
        firebaseUid = userCred.user.uid;
      } catch {
        // Якщо акаунт ще не зареєстрований у Firebase Auth — автоматично реєструємо
        const regRes = await AuthService.register(
          googleName || cleanEmail.split("@")[0] || "Користувач",
          cleanEmail,
          pass,
          provider,
        );
        return regRes;
      }

      // 2. Отримуємо або оновлюємо дані у локальній SQLite
      let rows = db.getAllSync<any>(
        "SELECT * FROM users WHERE id = ? OR LOWER(email) = ?;",
        [firebaseUid, cleanEmail],
      );

      let userRow = rows[0];

      if (!userRow) {
        const tag = `#${Math.floor(1000 + Math.random() * 9000)}`;
        const fallbackName = googleName || cleanEmail.split("@")[0] || "Користувач";

        db.runSync(
          `INSERT INTO users (id, username, email, password, custom_status, status, tag, provider, created_at)
           VALUES (?, ?, ?, ?, 'Користувач Bobi Chat', 'online', ?, ?, ?);`,
          [
            firebaseUid,
            fallbackName,
            cleanEmail,
            pass,
            tag,
            provider,
            Date.now(),
          ],
        );

        userRow = {
          id: firebaseUid,
          username: fallbackName,
          email: cleanEmail,
          custom_status: "Користувач Bobi Chat",
          status: "online",
          tag,
          provider,
        };
      }

      db.runSync(
        `INSERT OR REPLACE INTO active_session (id, user_id) VALUES (1, ?);`,
        [userRow.id],
      );

      const user: UserSession = {
        id: userRow.id,
        username: userRow.username,
        email: userRow.email,
        avatar: userRow.avatar || "",
        customStatus: userRow.custom_status || "",
        status: (userRow.status as "online" | "dnd" | "invisible") || "online",
        tag: userRow.tag || "#online",
        provider: (userRow.provider as "email" | "google") || provider,
      };

      await AuthService.syncUserToCloud(user);

      return { success: true, user };
    } catch (e: any) {
      console.error("Помилка входу:", e);
      return { success: false, error: e.message || "Помилка входу у Firebase" };
    }
  },

  // Оновлення профілю
  updateProfile: (
    userId: string,
    username: string,
    customStatus: string,
    status: "online" | "dnd" | "invisible",
    avatar?: string,
  ): boolean => {
    try {
      const tag = `#${status}`;
      db.runSync(
        `UPDATE users SET username = ?, custom_status = ?, status = ?, tag = ?, avatar = ? WHERE id = ?;`,
        [
          username.trim(),
          customStatus.trim(),
          status,
          tag,
          avatar || "",
          userId,
        ],
      );

      AuthService.syncUserToCloud({
        id: userId,
        username,
        customStatus,
        status,
        tag,
        avatar,
      });

      return true;
    } catch (e) {
      console.error("Помилка оновлення профілю:", e);
      return false;
    }
  },

  // Вихід з акаунта
  logout: (): boolean => {
    try {
      signOut(auth).catch(() => {});
      db.runSync("DELETE FROM active_session;");
      return true;
    } catch (e) {
      console.error("Помилка виходу:", e);
      return false;
    }
  },

  // 1. Відправка запиту у друзі
  sendFriendRequest: async (targetUser: {
    id: string;
    username: string;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const me = AuthService.getCurrentUser();
    if (!me || !targetUser?.id) {
      return { success: false, error: "Користувач не авторизований" };
    }

    const reqId = `${me.id}_${targetUser.id}`;
    try {
      await setDoc(
        doc(dbFirestore, "friend_requests", reqId),
        {
          id: reqId,
          fromId: me.id,
          fromName: me.username,
          fromAvatar: me.avatar || "",
          toId: targetUser.id,
          toName: targetUser.username,
          toAvatar: targetUser.avatar || "",
          status: "pending",
          createdAt: Date.now(),
        },
        { merge: true },
      );
      return { success: true };
    } catch (e: any) {
      console.error("Помилка відправки запиту у друзі:", e);
      return { success: false, error: e.message };
    }
  },

  // 2. Отримання запитів у друзі (вхідні та вихідні)
  getFriendRequests: async (): Promise<{ incoming: any[]; outgoing: any[] }> => {
    const me = AuthService.getCurrentUser();
    if (!me) return { incoming: [], outgoing: [] };

    try {
      const snap = await getDocs(collection(dbFirestore, "friend_requests"));
      const incoming: any[] = [];
      const outgoing: any[] = [];

      snap.forEach((d) => {
        const data = d.data();
        if (data.toId === me.id && data.status === "pending") {
          incoming.push(data);
        }
        if (data.fromId === me.id) {
          outgoing.push(data);
        }
      });

      return { incoming, outgoing };
    } catch (e) {
      console.error("Помилка отримання запитів у друзі:", e);
      return { incoming: [], outgoing: [] };
    }
  },

  // 3. Прийняти запит у друзі (створює чат з обох сторін)
  acceptFriendRequest: async (req: any): Promise<boolean> => {
    try {
      const me = AuthService.getCurrentUser();
      if (!me) return false;

      // Оновлюємо статус у Firestore
      await setDoc(
        doc(dbFirestore, "friend_requests", req.id),
        { status: "accepted", updatedAt: Date.now() },
        { merge: true },
      );

      // Додаємо друга до свого списку чатів
      db.runSync(
        `INSERT OR REPLACE INTO chats (id, name, type, avatar, is_online, last_message)
         VALUES (?, ?, 'dm', ?, 1, 'Друзі у Bobi Chat! Почніть спілкування');`,
        [req.fromId, req.fromName, req.fromAvatar || ""],
      );

      return true;
    } catch (e) {
      console.error("Помилка прийняття запиту:", e);
      return false;
    }
  },

  // 4. Відхилити запит у друзі
  rejectFriendRequest: async (requestId: string): Promise<boolean> => {
    try {
      await setDoc(
        doc(dbFirestore, "friend_requests", requestId),
        { status: "rejected", updatedAt: Date.now() },
        { merge: true },
      );
      return true;
    } catch (e) {
      console.error("Помилка відхилення запиту:", e);
      return false;
    }
  },
};
