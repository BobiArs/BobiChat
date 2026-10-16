import { db } from "../database/db";

export interface SyncEvent {
  id: string;
  chat_id: string;
  event_type: "NEW_MSG" | "EDIT_MSG" | "REACTION";
  payload: string; // JSON рядок
  created_at: number;
}

export const P2PEngine = {
  // Отримати останні події чату з локальної БД для відправки іншому пристрою
  getEventsSince: (chatId: string, lastTimestamp: number): SyncEvent[] => {
    try {
      return db.getAllSync<SyncEvent>(
        "SELECT * FROM sync_events WHERE chat_id = ? AND created_at > ? ORDER BY created_at ASC",
        [chatId, lastTimestamp],
      );
    } catch (error) {
      console.error("Помилка зчитування sync_events:", error);
      return [];
    }
  },

  // Вшивання докачаних подій від іншого користувача у свою локальну БД
  applyRemoteEvents: (events: SyncEvent[]) => {
    events.forEach((event) => {
      try {
        // Перевіряємо, чи немає вже цієї події в локальній БД
        const existing = db.getAllSync(
          "SELECT id FROM sync_events WHERE id = ?",
          [event.id],
        );

        if (existing.length === 0) {
          // 1. Записуємо подію в журнал
          db.runSync(
            "INSERT INTO sync_events (id, chat_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)",
            [
              event.id,
              event.chat_id,
              event.event_type,
              event.payload,
              event.created_at,
            ],
          );

          // 2. Якщо це нове повідомлення — додаємо його у таблицю messages
          if (event.event_type === "NEW_MSG") {
            const msg = JSON.parse(event.payload);
            db.runSync(
              `INSERT OR IGNORE INTO messages (id, chat_id, sender_id, text, timestamp, is_me, status)
               VALUES (?, ?, ?, ?, ?, 0, 'delivered')`,
              [msg.id, event.chat_id, msg.senderId, msg.text, msg.timestamp],
            );
          }
        }
      } catch (error) {
        console.error("Помилка застосування P2P події:", error);
      }
    });
  },
};
