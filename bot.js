// === Импорт библиотеки ===
const TelegramBot = require("node-telegram-bot-api");

// === ⚙️ Настройки ===
const TOKEN = "7562809822:AAH_z4iejnWardESYt6qv9qdiMIuyWcRFfs"; // вставь токен из BotFather
const ADMIN_IDS = [7923034220]; // ID админов

const DAY_SUPPORT = "@blockervddnet";   // дневной оператор
const NIGHT_SUPPORT = "@Sh1ncePr1nce";  // ночной оператор

// Список пользователей, кому отказано
const deniedUsers = new Set();

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
  "3️⃣ Активность в игре (как часто играешь?):",
  "4️⃣ Количество часов в DDNet:",
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

// === Обработка решения админов ===
bot.on("callback_query", async (query) => {
  const [action, userIdStr] = query.data.split("_");
  const userId = parseInt(userIdStr);
  const msg = query.message;

  await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: msg.chat.id, message_id: msg.message_id });

  if (action === "accept") {
    await bot.sendMessage(userId, "🎉 Поздравляем! Тебя приняли в клан BKWORLD!\nВступай в чат: https://t.me/+gpOWA5NeDBFmMDhi");
    await bot.answerCallbackQuery(query.id, { text: "✅ Принят!" });
  } else {
    deniedUsers.add(userId);
    await bot.sendMessage(userId, "😢 К сожалению, тебе отказано во вступлении.\nПовторно подать анкету нельзя.");
    await bot.answerCallbackQuery(query.id, { text: "❌ Отказано" });
  }
});