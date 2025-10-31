// === Импорт библиотек ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

// === ⚙️ Настройки ===
const TOKEN = "7562809822:AAH_z4iejnWardESYt6qv9qdiMIuyWcRFfs"; // вставь сюда токен из @BotFather
const ADMIN_IDS = [7923034220 , 5874926994]; // ID админов

const DAY_SUPPORT = "@blockervddnet";   // дневной оператор
const NIGHT_SUPPORT = "@Sh1ncePr1nce";  // ночной оператор

// Список пользователей, кому отказано
const deniedUsers = new Map(); // userId -> анкета (текст)

// === Создание бота ===
const bot = new TelegramBot(TOKEN, { polling: true });
console.log("✅ Бот запущен и слушает сообщения...");

// === Главное меню ===
const mainMenu = {
  reply_markup: {
    keyboard: [
      ["📝 Заполнить анкету", "🆘 Служба поддержки"]
    ],
    resize_keyboard: true
  }
};

// === Команда /start ===
bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(msg.chat.id, "Привет! 👋 Выбери действие из меню:", mainMenu);
});

// === Служба поддержки ===
bot.on("message", async (msg) => {
  if (msg.text === "🆘 Служба поддержки") {
    const text = `
🧰 <b>Служба поддержки</b>

🕐 Дневная смена: ${DAY_SUPPORT}
🌙 Ночная смена: ${NIGHT_SUPPORT}

Пиши им по вопросам клана и игры 💬
`;
    await bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
  }
});

// === Логика анкеты ===
const formState = new Map(); // временное хранилище анкет

const questions = [
  "1️⃣ Твой ник в DDNet:",
  "2️⃣ Твоя роль в игре (когер или блокер):",
  "3️⃣ Активность в игре (как часто играешь? фото)гайд(Нужно перейти по своему нику, затем выбрать «Активность», далее «Игры». Здесь будет информация о недавно запущенных играх и количестве проведённого в них времени за указанный период):",
  "4️⃣ Количество часов в DDNet (фото):",
  "5️⃣ Играешь ли ты с читами? (честность важнее всего 😉)",
  "6️⃣ Почему хочешь вступить именно в наш клан BKWORLD? 💪",
  "7️⃣ Устройство, с которого играешь (ПК, ноут и т.п.):",
  "8️⃣ Дополнительная информация (если есть):"
];

// === Начало анкеты ===
bot.on("message", async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (msg.text === "📝 Заполнить анкету") {
    if (deniedUsers.has(userId)) {
      return bot.sendMessage(chatId, "🚫 Тебе было отказано. Повторно подать заявку нельзя.");
    }

    formState.set(userId, { step: 0, answers: [] });
    await bot.sendMessage(chatId, questions[0]);
    return;
  }

  // === Если пользователь заполняет анкету ===
  const state = formState.get(userId);
  if (state) {
    const step = state.step;
    const answers = state.answers;

    if (step < questions.length && msg.text !== "📝 Заполнить анкету") {
      answers.push(msg.text);
      state.step++;

      if (state.step < questions.length) {
        await bot.sendMessage(chatId, questions[state.step]);
      } else {
        // Анкета готова
        formState.delete(userId);

        const [nick, role, activity, hours, cheats, reason, device, extra] = answers;

        const text = `
📋 <b>Новая анкета!</b>

1️⃣ Ник: ${nick}
2️⃣ Роль: ${role}
3️⃣ Активность: ${activity}
4️⃣ Часы: ${hours}
5️⃣ Читы: ${cheats}
6️⃣ Причина: ${reason}
7️⃣ Устройство: ${device}
8️⃣ Доп. инфо: ${extra}

👤 От: @${msg.from.username || "Без ника"} (ID: ${userId})
`;

        const opts = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Принять", callback_data: `accept_${userId}` },
                { text: "❌ Отказать", callback_data: `deny_${userId}` }
              ]
            ]
          }
        };

        // Отправка анкеты админам
        for (const adminId of ADMIN_IDS) {
          await bot.sendMessage(adminId, text, opts);
        }

        await bot.sendMessage(chatId, "✅ Анкета отправлена! Ожидай решения от администрации.");
      }
    }
  }
});

// === Обработка решений админов ===
bot.on("callback_query", async (query) => {
  try {
    const data = query.data;
    const msg = query.message;

    // --- обработка обычных анкет ---
    if (data.startsWith("accept_")) {
      const userId = parseInt(data.split("_")[1]);
      await bot.sendMessage(userId, "🎉 Поздравляем! Тебя приняли в клан BKWORLD!\nВступай в чат: https://t.me/+gpOWA5NeDBFmMDhi");
      await bot.answerCallbackQuery(query.id, { text: "✅ Принят!" });
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: msg.chat.id, message_id: msg.message_id });
      return;
    }

    if (data.startsWith("deny_")) {
      const userId = parseInt(data.split("_")[1]);
      deniedUsers.set(userId, msg.text);
      await bot.sendMessage(userId, "😢 К сожалению, тебе отказано во вступлении.\nПовторно подать анкету нельзя.");
      await bot.answerCallbackQuery(query.id, { text: "❌ Отказано" });
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: msg.chat.id, message_id: msg.message_id });
      return;
    }

    // --- обработка повторного принятия ---
    if (data.startsWith("mclick_accept_")) {
      const uid = parseInt(data.split("_")[2]);
      if (deniedUsers.has(uid)) {
        deniedUsers.delete(uid);
        await bot.sendMessage(uid, "🎉 Администрация пересмотрела решение — ты принят в клан BKWORLD!\nДобро пожаловать! https://t.me/+gpOWA5NeDBFmMDhi");
        await bot.answerCallbackQuery(query.id, { text: "✅ Принят повторно" });
        await bot.editMessageText("✅ Принят повторно!", { chat_id: msg.chat.id, message_id: msg.message_id });
      } else {
        await bot.answerCallbackQuery(query.id, { text: "⚠️ Эта анкета уже была удалена." });
      }
      return;
    }
  } catch (err) {
    console.error("Ошибка при обработке callback_query:", err);
  }
});

// === Команда /mclick (для админов) ===
bot.onText(/\/mclick/, async (msg) => {
  const userId = msg.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    return bot.sendMessage(msg.chat.id, "🚫 У тебя недостаточно полномочий для этой команды.");
  }

  if (deniedUsers.size === 0) {
    return bot.sendMessage(msg.chat.id, "📭 Нет отказанных анкет на данный момент.");
  }

  for (const [uid, formText] of deniedUsers.entries()) {
    const opts = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Принять повторно", callback_data: `mclick_accept_${uid}` }]
        ]
      }
    };
    await bot.sendMessage(msg.chat.id, `📋 <b>Отказанная анкета:</b>\n\n${formText}`, opts);
  }
});

// === Команда /myid ===
bot.onText(/\/myid/, async (msg) => {
  const userId = msg.from.id;
  await bot.sendMessage(msg.chat.id, `🆔 Твой Telegram ID: <b>${userId}</b>`, { parse_mode: "HTML" });
});

// === Сервер для Render ===
const app = express();
app.get("/", (req, res) => res.send("🤖 Бот Telegram BKWORLD работает!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Сервер запущен на порту ${PORT}`));


