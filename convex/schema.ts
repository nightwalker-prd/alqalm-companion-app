import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  progress: defineTable({
    userId: v.id("users"),
    lessonId: v.string(),
    exerciseIndex: v.number(),
    correct: v.boolean(),
    attemptedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_lesson", ["userId", "lessonId"]),

  mastery: defineTable({
    userId: v.id("users"),
    itemType: v.union(v.literal("word"), v.literal("grammar")),
    itemId: v.string(),
    strength: v.number(),
    lastPracticed: v.number(),
    timesCorrect: v.number(),
    timesIncorrect: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_item", ["userId", "itemType", "itemId"]),
});
