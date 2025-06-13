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
  coowners.push(username.replace("@", ""));
  fs.writeFileSync("coowners.json", JSON.stringify(coowners));
  ctx.reply(`✅ Added @${username} as co-owner.`);
});

bot.command("unadd", (ctx) => {
  const id = ctx.message.from.id;
  const parts = ctx.message.text.split(" ");
  const username = parts[1];
  if (!isAdmin(id)) return ctx.reply("❌ You are not authorized.");
  if (!username) return ctx.reply("⚠️ Provide a username.");
  coowners = coowners.filter(u => u !== username.replace("@", ""));
  fs.writeFileSync("coowners.json", JSON.stringify(coowners));
  ctx.reply(`❌ Removed @${username} from co-owner list.`);
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text.toLowerCase();
  const from = ctx.message.from;

  // Auto reply in group if anyone says "hi", "hello"
  if (["hi", "hello"].includes(text)) {
    return ctx.reply(`Hello ${from.first_name}! How can I help you?`);
  }

  // Forward all messages to owner and coowners
  try {
    await bot.telegram.sendMessage(ownerId, `Forwarded from ${from.username || from.first_name}: ${ctx.message.text}`);
    for (const coowner of coowners) {
      await bot.telegram.sendMessage(`@${coowner}`, `Forwarded from ${from.username || from.first_name}: ${ctx.message.text}`);
    }
  } catch (e) {
    console.error("Forwarding failed:", e.message);
  }
});

bot.launch();
console.log("🤖 Bot is live with co-owner system!");
bot.launch().then(() => {
  console.log("🤖 Bot is live with co-owner support");
}).catch(err => {
  console.error("❌ Bot launch failed:", err);
});
