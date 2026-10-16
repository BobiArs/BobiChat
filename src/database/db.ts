import * as SQLite from "expo-sqlite";

// Відкриваємо/створюємо локальну базу даних BobiChat
export const db = SQLite.openDatabaseSync("bobichat.db");

export const initDatabase = () => {
  try {
    // Вмикаємо підтримку Foreign Keys
    db.execSync("PRAGMA foreign_keys = ON;");

    // Таблиця користувачів
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        avatar TEXT,
        custom_status TEXT,
        status TEXT DEFAULT 'online',
        tag TEXT DEFAULT '#online',
        provider TEXT DEFAULT 'email',
        created_at INTEGER
      );
    `);

    // Безпечна міграція колонок на випадок існуючої БД
    try {
      db.execSync("ALTER TABLE users ADD COLUMN email TEXT;");
    } catch {}
    try {
      db.execSync("ALTER TABLE users ADD COLUMN password TEXT;");
    } catch {}
    try {
      db.execSync("ALTER TABLE users ADD COLUMN custom_status TEXT;");
    } catch {}
    try {
      db.execSync("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'online';");
    } catch {}
    try {
      db.execSync("ALTER TABLE users ADD COLUMN tag TEXT DEFAULT '#online';");
    } catch {}
    try {
      db.execSync(
        "ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'email';",
      );
    } catch {}
    try {
      db.execSync("ALTER TABLE users ADD COLUMN created_at INTEGER;");
    } catch {}

    // Таблиця активної сесії (без каскадного видалення, щоб сесія ніколи не скидалася)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS active_session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        user_id TEXT NOT NULL
      );
    `);

    // Таблиця чатів та груп
    db.execSync(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        avatar TEXT,
        last_message TEXT,
        is_online INTEGER DEFAULT 1
      );
    `);

    try {
      db.execSync("ALTER TABLE chats ADD COLUMN last_message TEXT;");
    } catch {}
    try {
      db.execSync("ALTER TABLE chats ADD COLUMN is_online INTEGER DEFAULT 1;");
    } catch {}

    // Таблиця серверів
    db.execSync(`
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT
      );
    `);

    // Таблиця каналів серверів
    db.execSync(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY NOT NULL,
        server_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
      );
    `);

    // Таблиця повідомлень
    db.execSync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        chat_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        is_me INTEGER DEFAULT 1,
        status TEXT DEFAULT 'sent',
        msg_type TEXT DEFAULT 'text',
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
      );
    `);

    try {
      db.execSync(
        "ALTER TABLE messages ADD COLUMN msg_type TEXT DEFAULT 'text';",
      );
    } catch {}
    try {
      db.execSync(
        "ALTER TABLE messages ADD COLUMN is_edited INTEGER DEFAULT 0;",
      );
    } catch {}
    try {
      db.execSync("ALTER TABLE messages ADD COLUMN edited_at INTEGER;");
    } catch {}
    try {
      db.execSync(
        "ALTER TABLE messages ADD COLUMN reactions TEXT DEFAULT '{}';",
      );
    } catch {}
    try {
      db.execSync("ALTER TABLE messages ADD COLUMN created_at INTEGER;");
    } catch {}

    // Таблиця P2P-подій
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_events (
        id TEXT PRIMARY KEY NOT NULL,
        chat_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // ОЧИЩЕННЯ: Видаляємо всі застарілі тестові профілі, залишаючи чистий лист і лише поточну активну сесію
    try {
      db.execSync(
        "DELETE FROM users WHERE id != 'bot_user' AND id NOT IN (SELECT user_id FROM active_session WHERE id = 1);",
      );
      db.execSync(
        "DELETE FROM chats WHERE id IN ('1', '2', 'bot_bobi', 'group_bobi_team');",
      );
      db.execSync("DELETE FROM servers WHERE id = 'srv_dev';");
      db.execSync("DELETE FROM channels WHERE server_id = 'srv_dev';");
    } catch {}

    // Єдиний тестовий асистент "Bot" у списку користувачів для пошуку
    db.runSync(`
      INSERT OR REPLACE INTO users (id, username, email, password, avatar, custom_status, status, tag, provider, created_at)
      VALUES ('bot_user', 'Bot', 'bot@bobichat.app', '', 'BOT', 'Bobi AI Assistant • 1080p 60FPS', 'online', '#0001', 'bot', 1);
    `);

    // Створюємо чат "Обране" (Збережені повідомлення)
    db.runSync(`
      INSERT OR IGNORE INTO chats (id, name, type, avatar, last_message, is_online)
      VALUES ('saved_messages', 'Обране', 'dm', 'BOOKMARK', 'Особистий простір для нотаток', 1);
    `);

    console.log("SQLite ініціалізовано");
  } catch (error) {
    console.error("Помилка ініціалізації SQLite:", error);
  }
};
