
import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const app = express();
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/designmuse';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// 改进后的 CORS 配置
app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 Origin 的请求（如 curl, postman）
    if (!origin) return callback(null, true);
    
    // 自动允许所有 Vercel 子域名以及 localhost
    const isAllowed = origin.endsWith('.vercel.app') || 
                      origin.includes('localhost') || 
                      origin.includes('127.0.0.1') ||
                      origin === process.env.FRONTEND_URL;
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Unauthorized origin: ${origin}`);
      callback(new Error('CORS 不允许该来源访问'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}) as any);

app.use(express.json({ limit: '50mb' }) as any);

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// API 路由
app.get('/api/weekly/:weekId', async (req, res) => {
  const { weekId } = req.params;
  try {
    const entries = await db.query.inspirations.findMany({
      where: eq(schema.inspirations.weekId, weekId)
    });
    const notes = await db.query.weeklyNotes.findFirst({
      where: eq(schema.weeklyNotes.weekId, weekId)
    });
    res.json({ entries, notes: notes?.content || '' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: "数据库查询失败" });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const newEntry = await db.insert(schema.inspirations).values(req.body).returning();
    res.json(newEntry[0]);
  } catch (error) {
    res.status(500).json({ error: "创建灵感失败" });
  }
});

app.patch('/api/entries/:id', async (req, res) => {
  try {
    const updated = await db.update(schema.inspirations)
      .set(req.body)
      .where(eq(schema.inspirations.id, req.params.id))
      .returning();
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: "更新灵感失败" });
  }
});

app.post('/api/notes', async (req, res) => {
  const { weekId, content } = req.body;
  try {
    const existing = await db.query.weeklyNotes.findFirst({ where: eq(schema.weeklyNotes.weekId, weekId) });
    if (existing) {
      await db.update(schema.weeklyNotes).set({ content, updatedAt: new Date() }).where(eq(schema.weeklyNotes.weekId, weekId));
    } else {
      await db.insert(schema.weeklyNotes).values({ weekId, content });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "保存反射笔记失败" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend listening on port ${PORT}`);
  console.log(`✅ Standard VITE_API_URL should be: https://[your-app].vercel.app/api`);
});
