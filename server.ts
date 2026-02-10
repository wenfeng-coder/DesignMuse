
import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';

const app = express();
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/designmuse';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// 1. 关键代码修复：跨域配置
// Use 'as any' to satisfy TypeScript when Connect middleware signatures slightly differ from Express RequestHandler
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // 部署时替换为 Vercel 域名
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}) as any);

// Middleware for parsing JSON, cast to any to resolve PathParams type mismatch
app.use(express.json({ limit: '50mb' }) as any);

// 获取整周数据
app.get('/api/weekly/:weekId', async (req, res) => {
  const { weekId } = req.params;
  const entries = await db.query.inspirations.findMany({
    where: eq(schema.inspirations.weekId, weekId)
  });
  const notes = await db.query.weeklyNotes.findFirst({
    where: eq(schema.weeklyNotes.weekId, weekId)
  });
  res.json({ entries, notes: notes?.content || '' });
});

// 保存灵感
app.post('/api/entries', async (req, res) => {
  const newEntry = await db.insert(schema.inspirations).values(req.body).returning();
  res.json(newEntry[0]);
});

// 更新标签/分析结果
app.patch('/api/entries/:id', async (req, res) => {
  const updated = await db.update(schema.inspirations)
    .set(req.body)
    .where(eq(schema.inspirations.id, req.params.id))
    .returning();
  res.json(updated[0]);
});

// 保存笔记
app.post('/api/notes', async (req, res) => {
  const { weekId, content } = req.body;
  const existing = await db.query.weeklyNotes.findFirst({ where: eq(schema.weeklyNotes.weekId, weekId) });
  if (existing) {
    await db.update(schema.weeklyNotes).set({ content, updatedAt: new Date() }).where(eq(schema.weeklyNotes.weekId, weekId));
  } else {
    await db.insert(schema.weeklyNotes).values({ weekId, content });
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
