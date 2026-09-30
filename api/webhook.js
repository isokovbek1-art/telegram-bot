const TELEGRAM_TOKEN = "8997483422:AAGJJrSCqemUpWmyPpI_WbdMX0zfb730TfY";
const CODECRAFT_API_URL = "https://codecraftapi.com/v1/chat/completions";
const CODECRAFT_API_KEY = "cc_w31yQ9P9BFrDow8j25gwrFLJ2DNQUFAegViAYS0WofXHmKwG";
const MODEL = "claude-opus-5.5";

async function sendTelegram(chatId, text) {
  const chunks = [];
  let t = text || "(bo'sh javob)";
  while (t.length > 0) {
    chunks.push(t.slice(0, 4000));
    t = t.slice(4000);
  }
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(200).send("Bot ishlayapti ✅");
    return;
  }

  res.status(200).send("OK");

  try {
    const update = req.body;
    const message = update && update.message;
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text;

    if (text === "/start") {
      await sendTelegram(chatId, "Salom! 👋 Men AI yordamchiman. Menga istalgan savolingizni yozing.");
      return;
    }

    const apiRes = await fetch(CODECRAFT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CODECRAFT_API_KEY}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 1,
        max_tokens: 4096,
        messages: [{ role: "user", content: text }],
      }),
    });

    const rawText = await apiRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      await sendTelegram(chatId, "⚠️ API'dan noto'g'ri javob keldi (" + apiRes.status + "): " + rawText.slice(0, 300));
      return;
    }

    if (!apiRes.ok) {
      const detail = (data.error && data.error.message) || JSON.stringify(data);
      await sendTelegram(chatId, "⚠️ Xatolik (" + apiRes.status + "): " + detail);
      return;
    }

    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "(bo'sh javob)";
    await sendTelegram(chatId, reply);
  } catch (err) {
    console.error(err);
  }
};
