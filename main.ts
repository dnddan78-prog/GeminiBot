import { Bot, Context, InlineKeyboard } from "https://deno.land/x/grammy/mod.ts";
import { callGemini } from "./gemini.ts";
import { Storage } from "./storage.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const GEMINI_KEY = Deno.env.get("DEFAULT_API_KEY");
const OWNERS = (Deno.env.get("OWNERS") || "").split(",").map((s) => Number(s.trim()));
const FORCE_JOIN_CHANNEL = Deno.env.get("FORCE_JOIN_CHANNEL") || "";
const USE_WEBHOOK = (Deno.env.get("USE_WEBHOOK") || "false").toLowerCase() === "true";
const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL") || "";

if (!BOT_TOKEN) throw new Error("BOT_TOKEN missing");
if (!GEMINI_KEY) throw new Error("DEFAULT_API_KEY missing");

const bot = new Bot(BOT_TOKEN);
const storage = new Storage("./db.json");

function isOwner(id?: number) {
  return id ? OWNERS.includes(id) : false;
}

// Optional force join
bot.use(async (ctx, next) => {
  if (!FORCE_JOIN_CHANNEL || ctx.chat?.type !== "private") return next();
  try {
    const member = await ctx.api.getChatMember(FORCE_JOIN_CHANNEL, ctx.from!.id);
    if (["left", "kicked"].includes(member.status)) {
      const kb = new InlineKeyboard().url("Join channel", `https://t.me/${FORCE_JOIN_CHANNEL.replace(/^@/, "")}`);
      return ctx.reply("🚫 Please join the required channel to use this bot.", { reply_markup: kb });
    }
  } catch {
    console.warn("Force join check skipped");
  }
  return next();
});

bot.command("start", (ctx) => {
  storage.bumpStat("starts");
  return ctx.reply("👋 Hi! Send me a message and I’ll reply with Gemini. Use /reset to clear memory.");
});

bot.command("reset", (ctx) => {
  storage.clearConversation(ctx.from!.id);
  return ctx.reply("🧹 Memory cleared!");
});

bot.command("stats", (ctx) => {
  if (!isOwner(ctx.from?.id)) return ctx.reply("❌ Owners only.");
  const stats = storage.getStats();
  return ctx.reply(`📊 Stats:\nUsers: ${stats.uniqueUsers}\nMessages: ${stats.totalMessages}\nStarts: ${stats.starts}\nUptime: ${storage.uptime()}`);
});

bot.on("message:text", async (ctx) => {
  const uid = ctx.from!.id;
  storage.recordMessage(uid);

  const thinking = await ctx.reply("💭 Thinking...");
  const history = storage.getConversation(uid);
  history.push({ role: "user", text: ctx.message.text });

  try {
    const reply = await callGemini(history, GEMINI_KEY);
    history.push({ role: "assistant", text: reply });
    storage.setConversation(uid, history);
    try {
      await ctx.api.editMessageText(ctx.chat.id, thinking.message_id, reply);
    } catch {
      await ctx.reply(reply);
    }
  } catch {
    await ctx.reply("❌ Error with Gemini API.");
  }
});

bot.catch((err) => console.error("Bot error:", err));

if (USE_WEBHOOK && WEBHOOK_URL) {
  await bot.api.setWebhook(WEBHOOK_URL);
  console.log("✅ Webhook set to:", WEBHOOK_URL);
} else {
  console.log("🤖 Bot starting with long polling...");
  await bot.start();
}
