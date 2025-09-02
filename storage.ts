import { ensureFile } from "https://deno.land/std/fs/mod.ts";

type Conversation = { role: "user" | "assistant"; text: string }[];

export class Storage {
  path: string;
  db: { conversations: Record<string, Conversation>; stats: any; createdAt: string };

  constructor(path = "./db.json") {
    this.path = path;
    this.db = { conversations: {}, stats: { uniqueUsers: 0, totalMessages: 0, starts: 0 }, createdAt: new Date().toISOString() };
    this.load();
  }

  private load() {
    try {
      const raw = Deno.readTextFileSync(this.path);
      this.db = JSON.parse(raw);
    } catch {
      ensureFile(this.path);
      this.save();
    }
  }

  private save() {
    Deno.writeTextFileSync(this.path, JSON.stringify(this.db, null, 2));
  }

  getConversation(uid: number): Conversation {
    return (this.db.conversations[uid] ||= []);
  }

  setConversation(uid: number, conv: Conversation) {
    this.db.conversations[uid] = conv.slice(-100);
    this.db.stats.uniqueUsers = Object.keys(this.db.conversations).length;
    this.save();
  }

  clearConversation(uid: number) {
    delete this.db.conversations[uid];
    this.save();
  }

  recordMessage(uid: number) {
    this.db.stats.totalMessages++;
    this.save();
  }

  bumpStat(key: string) {
    this.db.stats[key] = (this.db.stats[key] || 0) + 1;
    this.save();
  }

  getStats() {
    return this.db.stats;
  }

  uptime() {
    const created = new Date(this.db.createdAt).getTime();
    const diff = Date.now() - created;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  }
}
