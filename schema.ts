
import { pgTable, text, timestamp, integer, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';

export const inspirations = pgTable('inspirations', {
  id: uuid('id').primaryKey().defaultRandom(),
  weekId: varchar('week_id', { length: 20 }).notNull(), // e.g. "2024-W12"
  dayKey: varchar('day_key', { length: 10 }).notNull(), // e.g. "2024-03-20"
  imageUrl: text('image_url').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  caption: text('caption'),
  orientation: varchar('orientation', { length: 20 }).default('square'),
  decorType: varchar('decor_type', { length: 20 }).notNull(),
  rotation: integer('rotation').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const weeklyNotes = pgTable('weekly_notes', {
  weekId: varchar('week_id', { length: 20 }).primaryKey(),
  content: text('content').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});
