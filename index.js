import { Telegraf } from 'telegraf';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = parseInt(process.env.OWNER_ID);
let coowners = [];

// Load coowners
if (fs.existsSync('coowners.json')) {
  coowners = JSON.parse(fs.readFileSync('coowners.json'));
}

function isAdmin(id) {
  return id === ownerId || coowners.includes(id);
}

bot.start((ctx) => ctx.reply("Hello! I am your AI assistant bot."));

bot.command("add", (ctx) => {
  const id = ctx.message.from.id;
  const parts = ctx.message.text.split(" ");
  const username = parts[1];
  if (!isAdmin(id)) return ctx.reply("❌ You are not authorized.");
  if (!username) return ctx.reply("⚠️ Provide a username.");
  const clean = username.replace("@", "");
  if (!coowners.includes(clean)) {
    coowners.push(clean);
    fs.writeFileSync("coowners.json", JSON.stringify(coowners));
    ctx.reply(`✅ Added @${clean} as co-owner.`);
  } else {
    ctx.reply(`⚠️ @${clean} is already a co-owner.`);
  }
});

bot.command("unadd", (ctx) => {
  const id = ctx.message.from.id;
  const parts = ctx.message.text.split(" ");
  const username = parts[1];
  if (!isAdmin(id)) return ctx.reply("❌ You are not authorized.");
  if (!username) return ctx.reply("⚠️ Provide a username.");
  const clean = username.replace("@", "");
  coowners = coowners.filter(u => u !== clean);
  fs.writeFileSync("coowners.json", JSON.stringify(coowners));
  ctx.reply(`❌ Removed @${clean} from co-owner list.`);
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text.toLowerCase();
  const from = ctx.message.from;

  // Auto-reply
  if (["hi", "hello"].includes(text)) {
    return ctx.reply(`Hello ${from.first_name}! How can I help you?`);
  }

  // Forward to owner + co-owners
  try {
    await bot.telegram.sendMessage(ownerId, `From ${from.username || from.first_name}: ${ctx.message.text}`);
    for (const coowner of coowners) {
      await bot.telegram.sendMessage(`@${coowner}`, `From ${from.username || from.first_name}: ${ctx.message.text}`);
    }
  } catch (e) {
    console.log("Forwarding failed:", e.message);
  }
});

bot.launch()
  .then(() => console.log("🤖 Bot is LIVE"))
  .catch(err => console.error("❌ Bot launch error:", err));
