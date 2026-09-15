/**
 * Global Connect — Database Schema (PostgreSQL via Drizzle ORM)
 *
 * Normalized tables for users, auth tokens, payments/activations,
 * conversations, messages, calls, bookings, reviews, notifications,
 * reports, blocks and admin-managed content (FAQs & announcements).
 */
import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ---------------------------------- Users --------------------------------- */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("member"), // member | admin
    // pending_activation | active | suspended | banned
    status: text("status").notNull().default("pending_activation"),
    emailVerified: boolean("email_verified").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false), // admin trust badge
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    country: text("country"),
    languages: jsonb("languages").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    interests: jsonb("interests").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    availability: text("availability"),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_status_idx").on(t.status), index("users_country_idx").on(t.country)],
);

/* --------------------- Email verification / password reset ----------------- */

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    type: text("type").notNull(), // email_verify | password_reset
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId, t.type)],
);

/* ------------------- Payments & account activations ------------------------ */
/* Designed to be upgraded later to automatic M-Pesa (Daraja) and card        */
/* payments: `method` + `payload` hold gateway-specific data.                  */

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull().default(90), // minor units of currency
    currency: text("currency").notNull().default("KES"),
    method: text("method").notNull().default("mpesa_paybill"), // mpesa_paybill | mpesa_auto | card
    reference: text("reference").notNull(), // M-Pesa confirmation code etc.
    proofUrl: text("proof_url"), // uploaded confirmation screenshot
    note: text("note"),
    payload: jsonb("payload").$type<Record<string, unknown>>(), // future gateway payload
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    reviewedBy: integer("reviewed_by"),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_status_idx").on(t.status), index("payments_user_idx").on(t.userId)],
);

/* ------------------------------ Conversations ------------------------------ */

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  isGroup: boolean("is_group").notNull().default(false),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("conv_participants_unique").on(t.conversationId, t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("text"), // text | image
    content: text("content"), // text body or emoji-capable string
    imageUrl: text("image_url"), // data URL for shared images
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conv_idx").on(t.conversationId, t.createdAt)],
);

/* Typing indicators with a short TTL */
export const typingStates = pgTable(
  "typing_states",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("typing_unique").on(t.conversationId, t.userId)],
);

/* ----------------------------- Voice/Video calls --------------------------- */
/* WebRTC signaling data (SDP offers/answers + ICE candidates) is persisted    */
/* here so calls work over a simple polling transport and can later be moved   */
/* to Socket.IO without schema changes.                                        */

export const calls = pgTable(
  "calls",
  {
    id: serial("id").primaryKey(),
    callerId: integer("caller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    calleeId: integer("callee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("voice"), // voice | video
    status: text("status").notNull().default("ringing"), // ringing | active | ended | declined | missed
    offerSdp: text("offer_sdp"),
    answerSdp: text("answer_sdp"),
    callerCandidates: jsonb("caller_candidates").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
    calleeCandidates: jsonb("callee_candidates").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("calls_callee_idx").on(t.calleeId, t.status), index("calls_caller_idx").on(t.callerId)],
);

/* --------------------------------- Bookings -------------------------------- */

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hostId: integer("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    note: text("note"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min").notNull().default(30),
    status: text("status").notNull().default("pending"), // pending | accepted | declined | cancelled | completed
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bookings_host_idx").on(t.hostId, t.status), index("bookings_requester_idx").on(t.requesterId)],
);

/* --------------------------------- Reviews --------------------------------- */

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetId: integer("target_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: integer("booking_id"),
    rating: integer("rating").notNull(), // 1..5
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reviews_unique_pair").on(t.authorId, t.targetId)],
);

/* ------------------------------- Notifications ----------------------------- */

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("system"), // message | booking | payment | report | system | call
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.read)],
);

/* ---------------------------------- Reports -------------------------------- */

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: integer("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportedUserId: integer("reported_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status").notNull().default("open"), // open | resolved | dismissed
    resolutionNote: text("resolution_note"),
    reviewedBy: integer("reviewed_by"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_status_idx").on(t.status)],
);

/* ----------------------------------- Blocks -------------------------------- */

export const blocks = pgTable(
  "blocks",
  {
    id: serial("id").primaryKey(),
    blockerId: integer("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: integer("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("blocks_unique_pair").on(t.blockerId, t.blockedId)],
);

/* --------------------------- Admin-managed content -------------------------- */

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------------- Types ----------------------------------- */

export type User = typeof users.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
