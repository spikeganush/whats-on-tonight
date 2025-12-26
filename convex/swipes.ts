import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { mutation, MutationCtx } from "./_generated/server";

export const submit = mutation({
  args: {
    roomId: v.id("rooms"),
    movieId: v.number(),
    direction: v.string(), // "left" | "right" | "super"
    sessionId: v.string(),
  },
  handler: async (ctx: MutationCtx, args: any) => {
    // 1. Record the swipe
    // (In real app we would look up userId from sessionId first, simplified here)
    // Let's assume we pass userId or look it up. 
    // For now, looking up user by session + room
    const user = await ctx.db.query("users")
        .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
        .filter((q: any) => q.eq(q.field("sessionId"), args.sessionId))
        .first();

    if (!user) throw new Error("User not found in room");

    await ctx.db.insert("swipes", {
      roomId: args.roomId,
      userId: user._id,
      movieId: args.movieId,
      direction: args.direction,
      timestamp: Date.now(),
    });

    // 2. Check for match (if ALL users liked)
    if (args.direction === "right" || args.direction === "super") {
        const users = await ctx.db.query("users")
            .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
            .collect();

        const swipes = await ctx.db.query("swipes")
            .withIndex("by_room_movie", (q: any) => q.eq("roomId", args.roomId).eq("movieId", args.movieId))
            .collect();
        
        // Filter for any positive swipe (right or super)
        const likes = swipes.filter((s: any) => s.direction === "right" || s.direction === "super");
        
        // If everyone liked
        if (likes.length === users.length) {
            // MATCH!
            await ctx.db.insert("matches", {
                roomId: args.roomId,
                movieId: args.movieId,
                matchedAt: Date.now(),
            });

            // Check room mode
            const room = await ctx.db.get(args.roomId) as Doc<"rooms"> | null;
            if (room && room.mode !== 'all') {
                 // Default behavior: stop game
                 await ctx.db.patch(args.roomId, { status: "matched" });
            }
        }
    }
  },
});
