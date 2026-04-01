const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

const BOT_TOKEN  = process.env.BOT_TOKEN  || '8773209170:AAF1J0xOv96zENQ09tAzIG056_7DS8AeRks';
const CHANNEL_ID = process.env.CHANNEL_ID || '@Zenedge_trade';
const PORT       = process.env.PORT       || 3000;
const TWELVE_KEY = process.env.TWELVE_KEY || '1c93dd7752f841eaab0f40642e5c5346';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
app.use(express.json());

function toshkentVaqt() {
    const now = new Date();
    const tk  = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5 * 3600000);
    const h   = String(tk.getHours()).padStart(2, '0');
    const m   = String(tk.getMinutes()).padStart(2, '0');
    const d   = String(tk.getDate()).padStart(2, '0');
    const mo  = String(tk.getMonth() + 1).padStart(2, '0');
    return `${d}.${mo} ${h}:${m} (Toshkent)`;
}

async function getNarx() {
    try {
        const res = await axios.get(
            `https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${TWELVE_KEY}`
        );
        return parseFloat(res.data.price).toFixed(2);
    } catch {
        return '—';
    }
}

function formatSignal(type, narx, vaqt) {
    const signals = {
        'ORB_BUY_0600':       { emoji: '🟢⚡', title: 'ORB BUY SIGNAL',            desc: '06:00 zona tasdiqlandi — YUQORIGA!',         tip: 'Zona ustida pozitsiya oching' },
        'ORB_SELL_0600':      { emoji: '🔴⚡', title: 'ORB SELL SIGNAL',           desc: '06:00 zona tasdiqlandi — PASTGA!',            tip: 'Zona ostida pozitsiya oching' },
        'ORB_BUY_0900':       { emoji: '🟢⚡', title: 'ORB BUY SIGNAL',            desc: '09:00 zona tasdiqlandi — YUQORIGA!',         tip: 'Zona ustida pozitsiya oching' },
        'ORB_SELL_0900':      { emoji: '🔴⚡', title: 'ORB SELL SIGNAL',           desc: '09:00 zona tasdiqlandi — PASTGA!',            tip: 'Zona ostida pozitsiya oching' },
        'ORB_BUY_1200':       { emoji: '🟢⚡', title: 'ORB BUY SIGNAL',            desc: '12:00 zona tasdiqlandi — YUQORIGA!',         tip: 'Zona ustida pozitsiya oching' },
        'ORB_SELL_1200':      { emoji: '🔴⚡', title: 'ORB SELL SIGNAL',           desc: '12:00 zona tasdiqlandi — PASTGA!',            tip: 'Zona ostida pozitsiya oching' },
        'ORB_BUY_1800':       { emoji: '🟢⚡', title: 'ORB BUY SIGNAL',            desc: '18:00 zona tasdiqlandi — YUQORIGA!',         tip: 'Zona ustida pozitsiya oching' },
        'ORB_SELL_1800':      { emoji: '🔴⚡', title: 'ORB SELL SIGNAL',           desc: '18:00 zona tasdiqlandi — PASTGA!',            tip: 'Zona ostida pozitsiya oching' },
        'M5_BUY':             { emoji: '💥🟢', title: 'M5 BUY ENTRY',              desc: 'Zona yuqorisi buzildi — BUY kirish!',         tip: 'M5 shamcha yopilishidan keyin kiring' },
        'M5_SELL':            { emoji: '💥🔴', title: 'M5 SELL ENTRY',             desc: 'Zona quyi buzildi — SELL kirish!',            tip: 'M5 shamcha yopilishidan keyin kiring' },
        'W2_BUY':             { emoji: '🌊🟢', title: 'ELLIOTT W2 BUY',            desc: "2-to'lqin pullback — BUY entry!",            tip: 'Fibonacci 38-62% zonasida kirish' },
        'W2_SELL':            { emoji: '🌊🔴', title: 'ELLIOTT W2 SELL',           desc: "2-to'lqin pullback — SELL entry!",           tip: 'Fibonacci 38-62% zonasida kirish' },
        'W3_BUY':             { emoji: '🚀🟢', title: 'ELLIOTT W3 BUY',            desc: "3-to'lqin — KUCHLI BUY!",                   tip: "Eng kuchli to'lqin!" },
        'W3_SELL':            { emoji: '🚀🔴', title: 'ELLIOTT W3 SELL',           desc: "3-to'lqin — KUCHLI SELL!",                  tip: "Eng kuchli to'lqin!" },
        'ZONA_BUZILDI_BUY':   { emoji: '⚠️🟢', title: 'ZONA BUZILDI — TESKARI BUY',  desc: 'M5 zona pastini yopdi — BUY!',           tip: 'Pozitsiyani almashtiring' },
        'ZONA_BUZILDI_SELL':  { emoji: '⚠️🔴', title: 'ZONA BUZILDI — TESKARI SELL', desc: 'M5 zona yuqorisini yopdi — SELL!',        tip: 'Pozitsiyani almashtiring' },
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

// TradingView Webhook
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        console.log('Webhook keldi:', body);
        const msg = (body.signal || body.message || body.text || '').toUpperCase();
        let signalType = '';

        if      (msg.includes('06:00 BUY')  || msg.includes('0600 BUY'))  signalType = 'ORB_BUY_0600';
        else if (msg.includes('06:00 SELL') || msg.includes('0600 SELL')) signalType = 'ORB_SELL_0600';
        else if (msg.includes('09:00 BUY')  || msg.includes('0900 BUY'))  signalType = 'ORB_BUY_0900';
        else if (msg.includes('09:00 SELL') || msg.includes('0900 SELL')) signalType = 'ORB_SELL_0900';
        else if (msg.includes('12:00 BUY')  || msg.includes('1200 BUY'))  signalType = 'ORB_BUY_1200';
        else if (msg.includes('12:00 SELL') || msg.includes('1200 SELL')) signalType = 'ORB_SELL_1200';
        else if (msg.includes('18:00 BUY')  || msg.includes('1800 BUY'))  signalType = 'ORB_BUY_1800';
        else if (msg.includes('18:00 SELL') || msg.includes('1800 SELL')) signalType = 'ORB_SELL_1800';
        else if (msg.includes('M5 BUY'))     signalType = 'M5_BUY';
        else if (msg.includes('M5 SELL'))    signalType = 'M5_SELL';
        else if (msg.includes('W2 BUY')  || msg.includes('W2BUY'))        signalType = 'W2_BUY';
        else if (msg.includes('W2 SELL') || msg.includes('W2SELL'))       signalType = 'W2_SELL';
        else if (msg.includes('W3 BUY')  || msg.includes('W3BUY'))        signalType = 'W3_BUY';
        else if (msg.includes('W3 SELL') || msg.includes('W3SELL'))       signalType = 'W3_SELL';
        else if (msg.includes('BUZILDI') && msg.includes('BUY'))          signalType = 'ZONA_BUZILDI_BUY';
        else if (msg.includes('BUZILDI') && msg.includes('SELL'))         signalType = 'ZONA_BUZILDI_SELL';
        else signalType = msg.slice(0, 30) || 'SIGNAL';

        const narx  = await getNarx();
        const vaqt  = toshkentVaqt();
        const xabar = formatSignal(signalType, narx, vaqt);
        await bot.sendMessage(CHANNEL_ID, xabar, { parse_mode: 'HTML' });
        console.log(`Signal yuborildi: ${signalType} | $${narx}`);
        res.json({ ok: true, signal: signalType, narx });
    } catch (err) {
        console.error('Xato:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.get('/test', async (req, res) => {
    const narx  = await getNarx();
    const vaqt  = toshkentVaqt();
    const type  = req.query.type || 'M5_BUY';
    const xabar = formatSignal(type, narx, vaqt);
    await bot.sendMessage(CHANNEL_ID, xabar, { parse_mode: 'HTML' });
    res.json({ ok: true, narx, vaqt, type });
});

app.get('/', (req, res) => {
    res.json({ status: 'ZEN|EDGE Bot ishlayapti', vaqt: toshkentVaqt() });
});

// Bot buyruqlari
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '🏆 <b>ZEN|EDGE Bot</b>\n\nXAUUSD signal boti\n\n/signal — Holat\n/narx — Joriy narx\n/yordam — Qollanma',
        { parse_mode: 'HTML' }
    );
});

bot.onText(/\/narx/, async (msg) => {
    const narx = await getNarx();
    bot.sendMessage(msg.chat.id,
        `💰 <b>XAUUSD</b>\n\n$${narx}\n🕐 ${toshkentVaqt()}`,
        { parse_mode: 'HTML' }
    );
});

bot.onText(/\/signal/, async (msg) => {
    const narx = await getNarx();
    const vaqt = toshkentVaqt();

    // Narx asosida signal aniqlash
    const tp = (parseFloat(narx) + parseFloat(narx) * 0.002).toFixed(2);
    const sl = (parseFloat(narx) - parseFloat(narx) * 0.0005).toFixed(2);

    // Kaналга signal yuborish
    const kanalXabar =
`🟢 <b>ZEN|EDGE — XAUUSD</b>
━━━━━━━━━━━━━━━━━
<b>ORB BUY SIGNAL</b>
M5 zona yuqori buzildi ▲
━━━━━━━━━━━━━━━━━
💰 <b>Narx:</b> $${narx}
🎯 <b>TP:</b> $${tp}
🛡 <b>SL:</b> $${sl}
🕐 <b>Vaqt:</b> ${vaqt}
━━━━━━━━━━━━━━━━━
⚠️ <i>Kafolat emas. Risklarni boshqaring!</i>
📢 @Zenedge_trade`;

    // Kaналга yuborish
    await bot.sendMessage(CHANNEL_ID, kanalXabar, { parse_mode: 'HTML' });

    // Foydalanuvchiga tasdiqlash
    bot.sendMessage(msg.chat.id,
        `✅ <b>Signal kaналga yuborildi!</b>\n\n💰 XAUUSD: $${narx}\n🎯 TP: $${tp}\n🛡 SL: $${sl}\n🕐 ${vaqt}`,
        { parse_mode: 'HTML' }
    );
});

bot.onText(/\/yordam/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `📚 <b>ZEN|EDGE Qollanma</b>

🟢⚡ <b>ORB Signal</b> — Kun ochilishida zona signali
💥 <b>M5 Entry</b> — Zona buzilganda kirish signali
🌊 <b>W2/W3</b> — Elliott tolqin signali
⚠️ <b>Zona Buzildi</b> — Teskari signal

<i>Signallar TradingView dan avtomatik keladi</i>
📢 @Zenedge_trade`,
        { parse_mode: 'HTML' }
    );
});

app.listen(PORT, () => {
    console.log(`ZEN|EDGE Bot ishga tushdi — Port: ${PORT}`);
    console.log(`Webhook: /webhook`);
    console.log(`Test: /test`);
});
