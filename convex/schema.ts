import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(), // 4-char code
    status: v.string(), // "waiting" | "active" | "matched"
    createdAt: v.number(),
    creatorId: v.string(),
    // Config
    tmdbGenreIds: v.optional(v.array(v.number())),
    tmdbRegion: v.optional(v.string()), 
    providerIds: v.optional(v.array(v.number())),
    mediaType: v.string(), // "movie" | "tv"
    limit: v.optional(v.number()), // Max movies to swipe
    mode: v.optional(v.string()), // "first" | "all"
  }).index("by_code", ["code"]),

  users: defineTable({
    roomId: v.id("rooms"),
    sessionId: v.string(),
    name: v.string(),
    joinedAt: v.number(),
    finished: v.optional(v.boolean()), // For 'all' mode
  }).index("by_room", ["roomId"]),

  swipes: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    movieId: v.number(),
    direction: v.string(), // "left" | "right" | "super"
    timestamp: v.number(),
  }).index("by_room_movie", ["roomId", "movieId"])
    .index("by_user", ["roomId", "userId"]), // Add helpful index for fetching user history
  
  matches: defineTable({
    roomId: v.id("rooms"),
    movieId: v.number(),
    matchedAt: v.number(),
  }).index("by_room", ["roomId"]),
});
