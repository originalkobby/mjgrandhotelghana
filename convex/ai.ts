import { action, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const chat = action({
  args: {
    guestId: v.optional(v.string()),
    guestName: v.optional(v.string()),
    messages: v.array(v.object({ role: v.string(), content: v.string() })),
  },
  handler: async (ctx, args) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI API key not configured");

    // 1. Fetch dynamic context (rooms, rates, etc.)
    const rooms = await ctx.runQuery(api.rooms.listActiveRooms);
    const fxRate = 15.0; // Example rate, should be fetched from a dynamic source

    const systemPrompt = `You are MJ, the AI Concierge for MJ Grand Hotel... 
    Current Rooms: ${JSON.stringify(rooms)}
    Current Exchange Rate: 1 USD = ${fxRate} GHS`;

    // 2. Call AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          ...args.messages,
        ],
      }),
    });

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // 3. Log conversation if guestId is provided
    if (args.guestId) {
      await ctx.runMutation(api.ai.logMessages, {
        guestId: args.guestId,
        userMessage: args.messages[args.messages.length - 1].content,
        assistantMessage: assistantMessage,
      });
    }

    return assistantMessage;
  },
});

export const logMessages = mutation({
  args: {
    guestId: v.string(),
    userMessage: v.string(),
    assistantMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("conversations", {
      guest_id: args.guestId,
      role: "user",
      message: args.userMessage,
      created_at: new Date().toISOString(),
    });
    await ctx.db.insert("conversations", {
      guest_id: args.guestId,
      role: "assistant",
      message: args.assistantMessage,
      created_at: new Date().toISOString(),
    });
  },
});
