const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

const BOT_TOKEN  = process.env.BOT_TOKEN  || '8773209170:AAF1J0xOv96zENQ09tAzIG056_7DS8AeRks';
const CHANNEL_ID = process.env.CHANNEL_ID || '@Zenedge_trade';
const PORT       = process.env.PORT       || 8080;
const TWELVE_KEY = process.env.TWELVE_KEY || '1c93dd7752f841eaab0f40642e5c5346';

const bot = new TelegramBot(BOT_TOKEN);
const app = express();
app.use(express.json());

function toshkentVaqt() {
    const now = new Date();
    const tk  = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5 * 3600000);
    return `${String(tk.getDate()).padStart(2,'0')}.${String(tk.getMonth()+1).padStart(2,'0')} ${String(tk.getHours()).padStart(2,'0')}:${String(tk.getMinutes()).padStart(2,'0')} (Toshkent)`;
}

async function getNarx() {
    try {
        const res = await axios.get(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_KEY}`, { timeout: 5000 });
        return parseFloat(res.data.price).toFixed(2);
    } catch { return '—'; }
}

function formatSignal(type, narx, vaqt) {
    const signals = {
        'ORB_BUY_0600':      { emoji: '🟢⚡', title: 'ORB BUY SIGNAL',              desc: '06:00 zona — YUQORIGA!',    tip: 'Zona ustida pozitsiya oching' },
        'ORB_SELL_0600':     { emoji: '🔴⚡', title: 'ORB SELL SIGNAL',             desc: '06:00 zona — PASTGA!',      tip: 'Zona ostida pozitsiya oching' },
        'ORB_BUY_0900':      { emoji: '🟢⚡', title: 'ORB BUY SIGNAL',              desc: '09:00 zona — YUQORIGA!',    tip: 'Zona ustida pozitsiya oching' },
        'ORB_SELL_0900':     { emoji: '🔴⚡', title: 'ORB SELL SIGNAL',             desc: '09:00 zona — PASTGA!',      tip: 'Zona ostida pozitsiya oching' },
        'ORB_BUY_1200':      { emoji: '🟢⚡', title: 'ORB BUY SIGNAL',              desc: '12:00 zona — YUQORIGA!',    tip: 'Zona ustida pozitsiya oching' },
        'ORB_SELL_1200':     { emoji: '🔴⚡', title: 'ORB SELL SIGNAL',             desc: '12:00 zona — PASTGA!',      tip: 'Zona ostida pozitsiya oching' },
        'ORB_BUY_1800':      { emoji: '🟢⚡', title: 'ORB BUY SIGNAL',              desc: '18:00 zona — YUQORIGA!',    tip: 'Zona ustida pozitsiya oching' },
        'ORB_SELL_1800':     { emoji: '🔴⚡', title: 'ORB SELL SIGNAL',             desc: '18:00 zona — PASTGA!',      tip: 'Zona ostida pozitsiya oching' },
        'M5_BUY':            { emoji: '💥🟢', title: 'M5 BUY ENTRY',                desc: 'Zona yuqori buzildi!',      tip: 'M5 yopilishida kiring' },
        'M5_SELL':           { emoji: '💥🔴', title: 'M5 SELL ENTRY',               desc: 'Zona quyi buzildi!',        tip: 'M5 yopilishida kiring' },
        'W2_BUY':            { emoji: '🌊🟢', title: 'ELLIOTT W2 BUY',              desc: '2-tolqin pullback BUY!',    tip: 'Fibonacci 38-62% kirish' },
        'W2_SELL':           { emoji: '🌊🔴', title: 'ELLIOTT W2 SELL',             desc: '2-tolqin pullback SELL!',   tip: 'Fibonacci 38-62% kirish' },
        'W3_BUY':            { emoji: '🚀🟢', title: 'ELLIOTT W3 BUY',              desc: '3-tolqin KUCHLI BUY!',      tip: 'Eng kuchli tolqin!' },
        'W3_SELL':           { emoji: '🚀🔴', title: 'ELLIOTT W3 SELL',             desc: '3-tolqin KUCHLI SELL!',     tip: 'Eng kuchli tolqin!' },
        'ZONA_BUZILDI_BUY':  { emoji: '⚠️🟢', title: 'ZONA BUZILDI — TESKARI BUY',  desc: 'M5 zona pastini yopdi!',   tip: 'Pozitsiyani almashtiring' },
        'ZONA_BUZILDI_SELL': { emoji: '⚠️🔴', title: 'ZONA BUZILDI — TESKARI SELL', desc: 'M5 zona yuqorisini yopdi!',tip: 'Pozitsiyani almashtiring' },
    };
    const s = signals[type] || { emoji: '📊', title: type, desc: 'Signal keldi', tip: '' };
    return `${s.emoji} <b>ZEN|EDGE — XAUUSD</b>
━━━━━━━━━━━━━━━━━
<b>${s.title}</b>
${s.desc}
━━━━━━━━━━━━━━━━━
💰 <b>Narx:</b> $${narx}
🕐 <b>Vaqt:</b> ${vaqt}
💡 <i>${s.tip}</i>
━━━━━━━━━━━━━━━━━
⚠️ <i>Kafolat emas. Risklarni boshqaring!</i>
📢 @Zenedge_trade`;
}

app.post('/webhook', async (req, res) => {
    try {
        const msg = (req.body.signal || req.body.message || req.body.text || '').toUpperCase();
        let t = '';
        if      (msg.includes('06:00 BUY')  || msg.includes('0600 BUY'))  t = 'ORB_BUY_0600';
        else if (msg.includes('06:00 SELL') || msg.includes('0600 SELL')) t = 'ORB_SELL_0600';
        else if (msg.includes('09:00 BUY')  || msg.includes('0900 BUY'))  t = 'ORB_BUY_0900';
        else if (msg.includes('09:00 SELL') || msg.includes('0900 SELL')) t = 'ORB_SELL_0900';
        else if (msg.includes('12:00 BUY')  || msg.includes('1200 BUY'))  t = 'ORB_BUY_1200';
        else if (msg.includes('12:00 SELL') || msg.includes('1200 SELL')) t = 'ORB_SELL_1200';
        else if (msg.includes('18:00 BUY')  || msg.includes('1800 BUY'))  t = 'ORB_BUY_1800';
        else if (msg.includes('18:00 SELL') || msg.includes('1800 SELL')) t = 'ORB_SELL_1800';
        else if (msg.includes('M5 BUY'))                                   t = 'M5_BUY';
        else if (msg.includes('M5 SELL'))                                  t = 'M5_SELL';
        else if (msg.includes('W2 BUY'))                                   t = 'W2_BUY';
        else if (msg.includes('W2 SELL'))                                  t = 'W2_SELL';
        else if (msg.includes('W3 BUY'))                                   t = 'W3_BUY';
        else if (msg.includes('W3 SELL'))                                  t = 'W3_SELL';
        else if (msg.includes('BUZILDI') && msg.includes('BUY'))           t = 'ZONA_BUZILDI_BUY';
        else if (msg.includes('BUZILDI') && msg.includes('SELL'))          t = 'ZONA_BUZILDI_SELL';
        else t = msg.slice(0, 20) || 'SIGNAL';
        const narx = await getNarx();
        const vaqt = toshkentVaqt();
        await bot.sendMessage(CHANNEL_ID, formatSignal(t, narx, vaqt), { parse_mode: 'HTML' });
        res.json({ ok: true, signal: t, narx });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.get('/test', async (req, res) => {
    const narx = await getNarx();
    const vaqt = toshkentVaqt();
    const t    = req.query.type || 'M5_BUY';
    await bot.sendMessage(CHANNEL_ID, formatSignal(t, narx, vaqt), { parse_mode: 'HTML' });
    res.json({ ok: true, narx, vaqt });
});

app.get('/', (req, res) => {
    res.json({ status: 'ZEN|EDGE Bot ishlayapti', vaqt: toshkentVaqt() });
});

app.listen(PORT, () => console.log(`ZEN|EDGE Bot — Port: ${PORT}`));
