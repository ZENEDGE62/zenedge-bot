const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const BOT_TOKEN  = process.env.BOT_TOKEN  || '8773209170:AAF1J0xOv96zENQ09tAzIG056_7DS8AeRks';
const CHANNEL_ID = process.env.CHANNEL_ID || '@Zenedge_trade';
const TWELVE_KEY = process.env.TWELVE_KEY || '1c93dd7752f841eaab0f40642e5c5346';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('ZEN|EDGE Bot ishga tushdi!');

function toshkentVaqt() {
    const now = new Date();
    const tk = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5 * 3600000);
    return `${String(tk.getDate()).padStart(2,'0')}.${String(tk.getMonth()+1).padStart(2,'0')} ${String(tk.getHours()).padStart(2,'0')}:${String(tk.getMinutes()).padStart(2,'0')} (Toshkent)`;
}

async function getNarx() {
    try {
        const res = await axios.get(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_KEY}`, { timeout: 5000 });
        return parseFloat(res.data.price).toFixed(2);
    } catch { return '—'; }
}

async function sendSignal(type) {
    const narx = await getNarx();
    const vaqt = toshkentVaqt();
    const signals = {
        'BUY':  { emoji: '🟢', title: 'BUY SIGNAL',  desc: 'Yuqoriga yo\'nalish!' },
        'SELL': { emoji: '🔴', title: 'SELL SIGNAL', desc: 'Pastga yo\'nalish!' },
    };
    const s = signals[type] || { emoji: '📊', title: type, desc: '' };
    const msg = `${s.emoji} <b>ZEN|EDGE — XAUUSD</b>
━━━━━━━━━━━━━━━━━
<b>${s.title}</b>
${s.desc}
━━━━━━━━━━━━━━━━━
💰 <b>Narx:</b> $${narx}
🕐 <b>Vaqt:</b> ${vaqt}
━━━━━━━━━━━━━━━━━
⚠️ <i>Kafolat emas!</i>
📢 @Zenedge_trade`;
    await bot.sendMessage(CHANNEL_ID, msg, { parse_mode: 'HTML' });
    console.log(`Signal yuborildi: ${type} | $${narx}`);
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '🏆 <b>ZEN|EDGE Bot</b>\n\n/signal — Test signal\n/narx — Joriy narx', { parse_mode: 'HTML' });
});

bot.onText(/\/narx/, async (msg) => {
    const narx = await getNarx();
    bot.sendMessage(msg.chat.id, `💰 XAUUSD: $${narx}\n🕐 ${toshkentVaqt()}`, { parse_mode: 'HTML' });
});

bot.onText(/\/signal/, async (msg) => {
    await sendSignal('BUY');
    bot.sendMessage(msg.chat.id, '✅ Test signal yuborildi!');
});
