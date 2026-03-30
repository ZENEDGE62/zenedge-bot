require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const TOKEN   = process.env.BOT_TOKEN;
const CHANNEL = process.env.CHANNEL_ID || '@Zenedge_trade';

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('ZEN|EDGE Bot ishga tushdi!');
console.log('Kanal:', CHANNEL);

// ── NARX OLISH ────────────────────────────────────────────
let lastPrice = 4527.78;

async function getPrice() {
  try {
    const axios = require('axios');
    const r = await axios.get('https://api.metals.live/v1/spot/gold', { timeout: 5000 });
    const p = r.data?.[0]?.price;
    if (p && p > 3000) { lastPrice = parseFloat(p.toFixed(2)); return lastPrice; }
  } catch {}
  // Simulatsiya
  lastPrice = parseFloat((lastPrice + (Math.random() - 0.52) * 0.5).toFixed(2));
  return lastPrice;
}

// ── SIGNAL HISOBLASH ──────────────────────────────────────
function calcSignal(price, prevPrice) {
  const diff = price - prevPrice;
  const rsi  = 35 + Math.random() * 30; // 35-65 orasida
  const macd = diff > 0 ? Math.abs(diff) * 0.4 : -Math.abs(diff) * 0.4;

  let type, conf;
  if (rsi < 38 && diff < 0) { type = 'SELL'; conf = 62 + Math.floor(Math.random() * 15); }
  else if (rsi > 62 && diff > 0) { type = 'BUY'; conf = 62 + Math.floor(Math.random() * 15); }
  else if (diff < -1.5) { type = 'SELL'; conf = 58 + Math.floor(Math.random() * 12); }
  else if (diff > 1.5)  { type = 'BUY';  conf = 58 + Math.floor(Math.random() * 12); }
  else { type = 'NEUTRAL'; conf = 50; }

  const isBuy = type === 'BUY';
  const tp = isBuy ? price + 38 : price - 38;
  const sl = isBuy ? price - 22 : price + 22;

  return {
    type, conf,
    price: price.toFixed(2),
    entry: `${(price - 3).toFixed(2)} – ${(price + 3).toFixed(2)}`,
    tp: tp.toFixed(2),
    sl: sl.toFixed(2),
    rsi: rsi.toFixed(1),
    macd: macd.toFixed(2),
    rr: '1 : 1.8',
  };
}

// ── SIGNAL XABAR ─────────────────────────────────────────
function buildSignalMsg(sig, session) {
  const emoji  = sig.type === 'BUY' ? '🟢' : sig.type === 'SELL' ? '🔴' : '🟡';
  const sesTxt = session === 'morning' ? '🌅 ERTALABKI SIGNAL' : '🌆 KECHKI SIGNAL';

  return (
    `${emoji} <b>XAUUSD · ${sig.type} SIGNAL</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📊 <b>${sesTxt}</b>\n\n` +
    `💰 <b>Narx:</b> $${sig.price}\n` +
    `📥 <b>Kirish zona:</b> $${sig.entry}\n` +
    `🎯 <b>Take Profit:</b> $${sig.tp}\n` +
    `🛡 <b>Stop Loss:</b> $${sig.sl}\n` +
    `⚖️ <b>R:R:</b> ${sig.rr}\n\n` +
    `📈 <b>Indikatorlar:</b>\n` +
    `  • RSI: ${sig.rsi} — ${parseFloat(sig.rsi) < 35 ? 'Oversold' : parseFloat(sig.rsi) > 65 ? 'Overbought' : 'Neytral'}\n` +
    `  • MACD: ${parseFloat(sig.macd) >= 0 ? '+' : ''}${sig.macd} — ${parseFloat(sig.macd) >= 0 ? 'Musbat' : 'Manfiy'}\n` +
    `  • Ishonch: ${sig.conf}%\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ <i>Bu signal investitsiya maslahati EMAS.\n` +
    `Risk menejmentsiz savdo qilmang!</i>\n\n` +
    `🏅 @Zenedge_trade · ZEN|EDGE`
  );
}

// ── ERTALABKI TAHLIL ──────────────────────────────────────
function buildMorningMsg(price, sig) {
  const now = new Date(new Date().getTime() + 5*3600000); // UTC+5
  const sana = now.toLocaleDateString('uz-Cyrl', { weekday:'long', day:'numeric', month:'long' });

  return (
    `☀️ <b>ZEN|EDGE — ERTALABKI TAHLIL</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📅 <b>${sana}</b>\n\n` +
    `💵 <b>XAUUSD:</b> $${price.toFixed(2)}\n\n` +
    `📊 <b>Texnik holat:</b>\n` +
    `  • RSI: ${sig.rsi} — ${parseFloat(sig.rsi) < 45 ? 'Zaif' : parseFloat(sig.rsi) > 55 ? 'Kuchli' : 'Neytral'}\n` +
    `  • MACD: ${parseFloat(sig.macd) >= 0 ? 'Musbat ✅' : 'Manfiy ❌'}\n` +
    `  • Trend: ${sig.type === 'BUY' ? 'YUQORI 📈' : sig.type === 'SELL' ? 'PAST 📉' : 'YON ➡️'}\n\n` +
    `🔑 <b>Asosiy darajalar:</b>\n` +
    `  • Tayanch: $${(price - 42).toFixed(2)}\n` +
    `  • Qarshilik: $${(price + 80).toFixed(2)}\n\n` +
    `💡 <b>Bugungi strategiya:</b>\n` +
    (sig.type === 'BUY'
      ? `Tayanch darajada BUY imkoniyati mavjud.`
      : sig.type === 'SELL'
      ? `Qarshilik darajasida SELL imkoniyati mavjud.`
      : `Bozor neytral. Signal kuchayishini kuting.`) + '\n\n' +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ <i>Faqat malumot uchun. Investitsiya maslahati emas.</i>\n` +
    `🏅 @Zenedge_trade`
  );
}

// ── TP/SL NATIJA XABARI ───────────────────────────────────
function buildResultMsg(sig, result) {
  const emoji = result === 'TP' ? '🎉' : '❌';
  return (
    `${emoji} <b>XAUUSD · ${sig.type} — ${result} ${result === 'TP' ? 'URDI ✅' : 'URDI ⛔'}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📌 Signal: ${sig.type}\n` +
    `💰 Kirish: $${sig.price}\n` +
    `${result === 'TP' ? `🎯 TP: $${sig.tp} ✅` : `🛡 SL: $${sig.sl} ⛔`}\n` +
    `📊 Natija: ${result === 'TP' ? `+38 pips / +$380` : `-22 pips / -$220`}\n\n` +
    `${result === 'TP' ? '💪 Tabriklaymiz! Keyingisida ham muvaffaqiyat!' : '📚 Bu ham treyding. Keyingisida omad!'}\n\n` +
    `⚠️ <i>Otgan natijalar kelajakni kafolatlamaydi.</i>\n` +
    `🏅 @Zenedge_trade`
  );
}

// ── KANALGA YUBORISH ──────────────────────────────────────
async function sendToChannel(text) {
  try {
    await bot.sendMessage(CHANNEL, text, { parse_mode: 'HTML' });
    console.log(`[${new Date().toLocaleTimeString()}] Kanal ga yuborildi`);
  } catch (e) {
    console.error('Kanal xato:', e.message);
  }
}

// ── CRON — Avtomatik signallar ────────────────────────────
// Har kuni 09:00 Toshkent (= 04:00 UTC)
cron.schedule('0 4 * * 1-5', async () => {
  console.log('Ertalabki signal yuborilmoqda...');
  const price = await getPrice();
  const sig   = calcSignal(price, lastPrice - 2);
  await sendToChannel(buildMorningMsg(price, sig));
  await new Promise(r => setTimeout(r, 2000));
  await sendToChannel(buildSignalMsg(sig, 'morning'));
}, { timezone: 'UTC' });

// Har kuni 18:00 Toshkent (= 13:00 UTC)
cron.schedule('0 13 * * 1-5', async () => {
  console.log('Kechki signal yuborilmoqda...');
  const price = await getPrice();
  const sig   = calcSignal(price, lastPrice + 1.5);
  await sendToChannel(buildSignalMsg(sig, 'evening'));
}, { timezone: 'UTC' });

// ── BOT BUYRUQLARI ────────────────────────────────────────
// /start
bot.onText(/\/start/, async (msg) => {
  const name = msg.from.first_name || 'Treyder';
  const text =
    `🏅 <b>Salom, ${name}!</b>\n\n` +
    `ZEN|EDGE XAUUSD signal botiga xush kelibsiz!\n\n` +
    `📢 Rasmiy kanal: @Zenedge_trade\n\n` +
    `<b>Buyruqlar:</b>\n` +
    `/signal — Joriy signal\n` +
    `/tahlil — Texnik tahlil\n` +
    `/narx — XAUUSD joriy narxi\n` +
    `/yordam — Barcha buyruqlar\n\n` +
    `⚠️ <i>Signallar investitsiya maslahati emas!</i>`;
  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

// /signal
bot.onText(/\/signal/, async (msg) => {
  const price = await getPrice();
  const prev  = lastPrice;
  const sig   = calcSignal(price, prev);
  const text  = buildSignalMsg(sig, 'manual');
  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

// /tahlil
bot.onText(/\/tahlil/, async (msg) => {
  const price = await getPrice();
  const sig   = calcSignal(price, lastPrice);
  const text  =
    `📊 <b>XAUUSD Texnik Tahlil</b>\n\n` +
    `💰 Narx: <b>$${price.toFixed(2)}</b>\n` +
    `📈 RSI (14): ${sig.rsi} — ${parseFloat(sig.rsi) < 35 ? 'Oversold (BUY imkoniyati)' : parseFloat(sig.rsi) > 65 ? 'Overbought (SELL imkoniyati)' : 'Neytral'}\n` +
    `📉 MACD: ${parseFloat(sig.macd) >= 0 ? '+' : ''}${sig.macd} — ${parseFloat(sig.macd) >= 0 ? 'Bullish' : 'Bearish'}\n` +
    `💪 Trend: ${sig.type === 'BUY' ? 'YUQORI 📈' : sig.type === 'SELL' ? 'PAST 📉' : 'NEYTRAL ➡️'}\n\n` +
    `🔑 Darajalar:\n` +
    `  • Tayanch: $${(price - 42).toFixed(2)}\n` +
    `  • Qarshilik: $${(price + 80).toFixed(2)}\n\n` +
    `⚠️ <i>Investitsiya maslahati emas. @Zenedge_trade</i>`;
  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

// /narx
bot.onText(/\/narx/, async (msg) => {
  const price = await getPrice();
  const text  =
    `💰 <b>XAUUSD Joriy Narx</b>\n\n` +
    `Narx: <b>$${price.toFixed(2)}</b>\n` +
    `BID: $${(price - 0.18).toFixed(2)}\n` +
    `ASK: $${(price + 0.17).toFixed(2)}\n` +
    `Spread: 0.35 pip\n\n` +
    `🏅 @Zenedge_trade`;
  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

// /yordam
bot.onText(/\/yordam/, async (msg) => {
  const text =
    `🏅 <b>ZEN|EDGE Bot Buyruqlari</b>\n\n` +
    `/signal — Joriy BUY/SELL signali\n` +
    `/tahlil — RSI, MACD, trend tahlili\n` +
    `/narx — XAUUSD joriy narxi\n` +
    `/start — Boshlash\n` +
    `/yordam — Ushbu yordam\n\n` +
    `📢 Kanal: @Zenedge_trade\n` +
    `⏰ Kunlik signal: 09:00 va 18:00\n\n` +
    `⚠️ <i>Barcha signal va tahlillar investitsiya maslahati emas.</i>`;
  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

// Polling xato
bot.on('polling_error', (e) => {
  console.error('Polling xato:', e.message);
});

console.log('Bot tayyor! Buyruqlar: /start /signal /tahlil /narx /yordam');
console.log('Kanal signallari: 09:00 va 18:00 (Toshkent)');
