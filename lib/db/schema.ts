import { pgTable, serial, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const presentations = pgTable('presentations', {
  id: serial('id').primaryKey(),
  shareId: text('share_id').notNull().unique(),
  title: text('title').notNull(),
  blobUrl: text('blob_url').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
})

export const presenterAnnotations = pgTable('presenter_annotations', {
  id: serial('id').primaryKey(),
  presentationId: integer('presentation_id')
    .notNull()
    .references(() => presentations.id, { onDelete: 'cascade' }),
  slideIndex: integer('slide_index').notNull(),
  annotationData: jsonb('annotation_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`NOW()`),
})
