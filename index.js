import express from "express";
import fetch from "node-fetch";

const app = express();

async function checkSite() {
  try {
    const url = "https://github.com/Arseniy082/www-"; // замени на свой сайт
    const response = await fetch(url);
    const html = await response.text();
    if (html.includes("Имя")) console.log("✅ Найдено имя");
    else console.log("❌ Имя не найдено");
  } catch (err) {
    console.error("Ошибка:", err.message);
  }
}

setInterval(checkSite, 10 * 60 * 1000);
checkSite();

app.get("/", (req, res) => res.send("Бот запущен ✅"));
app.listen(3000, () => console.log("Сервер запущен на порту 3000"));
