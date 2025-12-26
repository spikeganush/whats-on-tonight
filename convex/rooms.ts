import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Create a new room
export const create = mutation({
  args: {
    sessionId: v.string(),
    name: v.string(), // Creator name
    mediaType: v.string(),
    tmdbGenreIds: v.optional(v.array(v.number())),
    tmdbRegion: v.optional(v.string()),
    providerIds: v.optional(v.array(v.number())),
    limit: v.optional(v.number()),
    mode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate 4 digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const roomId = await ctx.db.insert('rooms', {
      code,
      status: 'waiting',
      createdAt: Date.now(),
      creatorId: args.sessionId,
      mediaType: args.mediaType,
      tmdbGenreIds: args.tmdbGenreIds,
      tmdbRegion: args.tmdbRegion,
      providerIds: args.providerIds,
      limit: args.limit,
      mode: args.mode,
      randomSeed: Math.random(),
    });

    // Add creator as first user
    await ctx.db.insert('users', {
      roomId,
      sessionId: args.sessionId,
      name: args.name,
      joinedAt: Date.now(),
    });

    return { roomId, code };
  },
});

export const leave = mutation({
  args: {
    roomId: v.id('rooms'),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get the user
    const user = await ctx.db
      .query('users')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (!user) return;

    // 2. Delete this user's swipes
    const swipes = await ctx.db
      .query('swipes')
      .withIndex('by_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', user._id),
      )
      .collect();

    for (const swipe of swipes) {
      await ctx.db.delete(swipe._id);
    }

    // 3. Delete the user
    await ctx.db.delete(user._id);

    // 4. Check if room is empty
    const remainingUsers = await ctx.db
      .query('users')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .collect();

    if (remainingUsers.length === 0) {
      // Delete the room
      await ctx.db.delete(args.roomId);

      // Delete all matches for this room
      const matches = await ctx.db
        .query('matches')
        .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
        .collect();

      for (const match of matches) {
        await ctx.db.delete(match._id);
      }

      // (Optional) Delete any remaining swipes if we missed something (though we deleted user's swipes above)
      // Since all users are gone, their swipes should be gone too if we did it for each user.
      // But purely for the room cleanup:
      const remainingSwipes = await ctx.db
        .query('swipes')
        .withIndex('by_room_movie', (q) => q.eq('roomId', args.roomId))
        .collect();

      for (const s of remainingSwipes) {
        await ctx.db.delete(s._id);
      }
    }
  },
});

// Join a room
export const join = mutation({
  args: {
    code: v.string(),
    sessionId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .first();

    if (!room) {
      throw new Error('Room not found');
    }

    // Check if user already joined
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_room', (q) => q.eq('roomId', room._id))
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (existingUser) {
      return { roomId: room._id, userId: existingUser._id };
    }

    const userId = await ctx.db.insert('users', {
      roomId: room._id,
      sessionId: args.sessionId,
      name: args.name,
      joinedAt: Date.now(),
    });

    return { roomId: room._id, userId };
  },
});

export const startGame = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');

    await ctx.db.patch(args.roomId, { status: 'active' });
  },
});

// Get room details
export const get = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

// Get users in room
export const listUsers = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .collect();
  },
});

// Get match for room
export const getMatch = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('matches')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .first();
  },
});

// Get user swipes for a room (to filter unseen movies)
export const getUserSwipes = query({
  args: { roomId: v.id('rooms'), sessionId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (!user) return [];

    const swipes = await ctx.db
      .query('swipes')
      .withIndex('by_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', user._id),
      )
      .collect();

    return swipes.map((s) => s.movieId);
  },
});
// Get all matches for a room
export const getMatches = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('matches')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .collect();
  },
});
