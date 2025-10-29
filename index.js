import fetch from "node-fetch"; // библиотека для запросов к сайтам

async function checkSite() {
  try {
    // 🔗 Укажи здесь свой сайт:
    const url = "https://example.com"; 

    // Отправляем запрос на сайт
    const response = await fetch(url);
    const html = await response.text();

    // Проверяем, содержит ли страница определённое слово или имя
    if (html.includes("Имя")) {
      console.log("✅ Найдено имя на странице:", new Date().toLocaleTimeString());
    } else {
      console.log("❌ Имя не найдено на странице:", new Date().toLocaleTimeString());
    }
  } catch (err) {
    console.error("⚠️ Ошибка при проверке сайта:", err.message);
  }
}

// Первый запуск сразу
checkSite();

// Повторять каждые 10 минут (600 000 миллисекунд)
setInterval(checkSite, 10 * 60 * 1000);
