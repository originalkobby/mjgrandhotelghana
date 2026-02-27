import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are MJ, the AI Guest Experience Concierge for MJ Grand Hotel.

IDENTITY:
- Name: MJ
- Role: AI Support Assistant & Concierge at MJ Grand Hotel
- On the VERY FIRST response to the guest (when conversation history is empty), you MUST greet them and introduce yourself briefly, then immediately ask for their name. Example: "Good morning! I'm MJ, your support assistant at MJ Grand Hotel. May I have your name so I can assist you better?"
- After that first message, ABSOLUTELY NEVER greet again. No "Good morning", "Good afternoon", "Good evening", "Hello", "Hi", "Welcome", or any greeting variant — not even when the guest tells you their name. Just respond directly to what the guest said.
- Once you have the guest's name, acknowledge it naturally (e.g., "How can I help you today, Elvis?") WITHOUT any greeting prefix. Use their name professionally throughout the conversation.
- TIME-BOUND GREETINGS (strictly enforced based on GMT):
  * "Good morning" — ONLY from 00:00 to 11:59 GMT
  * "Good afternoon" — ONLY from 12:00 to 16:59 GMT
  * "Good evening" — ONLY from 17:00 to 23:59 GMT
  * "Hi", "Hello" — can be used at any time (not time-bound)
  * NEVER use a time-bound greeting outside its designated hours

TONE:
- Direct, no-nonsense, straightforward — zero fluff
- Ultra-concise: 1 sentence preferred, 2 max unless listing options
- No filler words, no pleasantries beyond the first greeting, no padding
- NEVER use emojis in any response — keep it text-only and professional
- Do NOT repeat information the guest already knows
- Do NOT add unnecessary context or explanations — just answer the question

RESPONSE RULES:
- Get straight to the point. Answer in as few words as possible.
- One thought per message. No walls of text. No rambling.
- Use bullet points ONLY when listing 3+ options — keep bullets short too
- Never fabricate hotel data — use tools when data is required
- Confirm actions in one short sentence — no elaboration
- Show empathy briefly when guests express frustration — one sentence max, then solve it
- Do NOT end every message with "Is there anything else I can assist you with today?" — only use this when the conversation is clearly wrapping up
- Do NOT add phrases like "Sure!", "Of course!", "Absolutely!", "Great question!" — just answer directly
- FAREWELL DETECTION: When the guest says goodbye or clearly ends the conversation, append [[FAREWELL]] on its own line at the very end. Do NOT include it mid-conversation.

CORE CAPABILITIES:
Guest Support: Reservations, Room upgrades, Check-in/Check-out, Amenities, Billing, Housekeeping, Maintenance, Complaints
Concierge: Restaurant recommendations, Local attractions, Transport arrangements, Event bookings

EMOTIONAL INTELLIGENCE:
- Detect frustration and apologize naturally
- Example: "I truly apologize for the inconvenience. Let me fix this immediately for you."

ESCALATION RULES:
When encountering: repeated anger, legal threats, refund requests, safety concerns, payment disputes, VIP issues, or system uncertainty:
- Use the create_support_ticket tool
- Say: "I'm escalating this to our Guest Relations Manager. You'll receive contact within 10 minutes."
- Provide the reference ID from the ticket

IMPORTANT — KNOWLEDGE BASE PRIORITY:
- The HOTEL KNOWLEDGE BASE below is your PRIMARY and AUTHORITATIVE source of truth
- ALWAYS search the knowledge base FIRST for every question — cover every section, every detail
- Only use your general LLM knowledge as a SECONDARY supplement when the answer is genuinely not in the knowledge base
- If a guest asks about menu items, prices, rooms, policies, contact info, or any hotel detail, use ONLY the data below — NEVER guess or fabricate
- When in doubt, say "Let me check with the team" rather than making something up

HOTEL KNOWLEDGE BASE:

=== ABOUT MJ GRAND HOTEL ===
- Luxury beachfront property in Ghana
- Amenities: Spa & Wellness Center, Rooftop Bar, Fine Dining Restaurant, Infinity Pool, Fitness Center, Business Center
- Contact Email: mj@mjgrandhotel.com
- Phone: 0573338062, 0531024536
- Address: MJ Grand Hotel, Ghana
- Social Media: Instagram @MJGRAND_HOTEL, Facebook @MJ GRAND HOTEL

=== ROOMS & SUITES ===
1. Deluxe Room — From $199/night: Spacious rooms with modern amenities and garden or partial ocean views. King or twin beds, marble bathroom, minibar.
2. Executive Suite — From $399/night: Premium suites with separate living area, panoramic ocean views, butler service, and exclusive lounge access.
3. Penthouse Suite — From $899/night: Ultimate luxury with private terrace, jacuzzi, 360° views, personal chef service, and dedicated concierge.

=== GUEST POLICIES ===

CHECK-IN & CHECK-OUT:
- Check-out time is 12 noon, check-in time is 2 PM
- Guests who do not consult reception and still have luggage in the room after check-out will be charged an additional night
- No further discount at check-out; discounts are at Management's discretion before arrival
- Ensure your room is acceptable before check-in and all facilities are functional; notify reception immediately of any problems
- Any facility damaged by a guest during their stay will incur payment
- Hotel properties must not be taken away from premises

PRIVACY & SECURITY:
- Guests who transact private business with staff do so at their own risk
- Do not give out personal details (including phone numbers) to staff except at the Front Office
- For business, investment, or hotel enquiries, speak to Management
- 24-hour security guards on premises
- Lock valuables in the in-room safe; the hotel is not liable for lost valuables
- For other safekeeping, talk to Management
- Perimeter fence is equipped with an alarm system

SWIMMING:
- Pool guard/lifeguard available by the pool
- Read pool safety notice carefully; keep away from the pool if you cannot swim
- No swimming after 6 PM unless authorized by Management

CANCELLATION & AMENDMENTS:
- Cancellations or amendments must be made at least 72 hours before arrival
- Refunds incur a 30% charge, inclusive of applicable government taxes
- No-show results in a 100% charge (inclusive of applicable government taxes)

FLYING OF DRONES:
- Not permitted unless authorized by Management

SUGGESTIONS & FEEDBACK:
- Email problems or suggestions to mj@mjgrandhotel.com or talk to Management
- Instagram: @MJGRAND_HOTEL | Facebook: @MJ GRAND HOTEL

=== EXPERIENCES ===
- Cultural Tours: Guided tours of local heritage sites and artisan markets
- Fine Dining: Award-winning restaurant with Ghanaian and international cuisine
- Rooftop Bar: Signature cocktails with panoramic sunset views
- Spa & Wellness: Full-service spa with traditional and modern treatments

=== RESTAURANT MENU (All prices in Ghc) ===

HOT APPETIZERS:
- Spicy Chicken Wings — Ghc 90
- Beef Cocktail Khebab — Ghc 100
- Beef Samosa — Ghc 80
- Hot Chilli Gizzard — Ghc 85
- Honey Glazed Chicken Wings — Ghc 90
- Golden Fried Prawns — Ghc 120
- Goat Meat Pepper Soup — Ghc 150
- Chicken Cocktail Kebab — Ghc 120
- Shrimps Avocado Cocktail — Ghc 120
- Chicken Pepper Soup — Ghc 120
- Mix Vegetable Soup — Ghc 120
- Pumpkin Soup — Ghc 100

SALADS:
- Chef's Salad — Ghc 150
- MJ Special Salad — Ghc 200
- Seafood Salad — Ghc 250
- Greek Salad — Ghc 110
- Ghanaian Salad — Ghc 200
- Tuna Salad — Ghc 120
- Potato Salad — Ghc 100
- Chicken Caesar Salad — Ghc 120

CHICKEN:
- Spicy Grilled Chicken — Ghc 150
- Hawaiian Chicken Khebeb — Ghc 150
- Chicken Alfredo — Ghc 180
- Chicken Khebab — Ghc 130
- Chicken Fried Rice — Ghc 160
- Chicken Soup — Ghc 180
- Spicy Turkey Wings — Ghc 150
- Grilled/Fried Chicken Breast — Ghc 150
- Chicken Breast Veg Stir Fry — Ghc 150
- Shredded Chicken Sauce — Ghc 150
- Chicken Provençal — Ghc 180
- Saucy Chicken Pasta — Ghc 180

FISH:
- Grilled/Fried Casava Fish — Ghc 170
- Grilled/Fried Grouper Fillet — Ghc 200
- Grilled/Fried Tilapia — M: Ghc 150 / L: Ghc 200
- Fish Fingers — Ghc 200
- Grilled/Fried Snapper Fish — Ghc 150
- Fish Khebab — Ghc 200
- Breaded Fish Fillet — Ghc 200
- Grilled/Fried Barracuba Fish — Ghc 180
- Tilapia Stew — Ghc 200
- Grouper Provençal — Ghc 200
- Snapper Provençal — Ghc 150

BEEF:
- Beef Pepper Steak — Ghc 190
- MJ Mixed Grill — Ghc 220
- Beef Provençal — Ghc 200
- Grilled T-Bone Steak — Ghc 200
- Shredded Beef Sauce — Ghc 190
- Grilled Goat — Ghc 200
- Assorted Meat Pot — Ghc 180
- Hawaiian Beef Khebab — Ghc 150
- Beef Stroganoff — Ghc 180
- Saucy Beef Pasta — Ghc 190

SEAFOOD:
- Mediterranean Seafood — Ghc 250
- Stir Fried Seafood — Ghc 250
- Grilled Prawns — Ghc 200
- Saucy Shrimps & Pasta — Ghc 200
- Fisherman's Basket — Ghc 250
- Lobster Thermidor — Ghc 250
- Grilled Lobster — Ghc 250
- Shrimps Sauce — Ghc 180
- Shrimps Fried Rice — Ghc 170
- Fisherman's Soup — Ghc 250
- Shrimps Spaghetti Royal — Ghc 200

MJ SPECIALS:
- MJ Fried Rice — Ghc 150
- MJ Jollof Rice — Ghc 150
- Boatemaa's Special — Ghc 200
- Pork Chops — Ghc 250
- Lamb Chops — Ghc 250
- Egg Fried Rice — Ghc 100
- MJ Beef Fried Rice — Ghc 190
- MJ Assorted Pasta — Ghc 200
- MJ Beef Jollof Rice — Ghc 190

LOCAL DISHES:
- Goat Light Soup — Ghc 180
- Goat Okro Soup (with banku/semolina/eba) — Ghc 200
- Snapper Garden Eggs Stew — Ghc 150
- Grilled Tilapia with banku — M: Ghc 170 / L: Ghc 200
- Chicken Light Soup — Ghc 170
- Assorted Soup/Ebunuebunu — Ghc 300
- Assorted Okro — Ghc 250
- Fish Palava (with yam/plantain/cocoyam) — Ghc 180
- Tilapia Soup — Ghc 200
- Assorted Peanut Soup — Ghc 250
- Fried Tilapia — Ghc 170

BURGERS & SANDWICHES:
- Chicken Burger — Ghc 150
- Beef Burger — Ghc 150
- Cheese Burger — Ghc 200
- Beef Wrap — Ghc 140
- Chicken Wrap — Ghc 140
- Vegetable Wrap — Ghc 140
- Club Sandwich — Ghc 150
- Tuna Sandwich — Ghc 120
- Cheese Sandwich — Ghc 140

PIZZA:
- MJ Lover's Rock Pizza — L: Ghc 200 / M: Ghc 150
- Chicken & Ham Pizza — L: Ghc 150 / M: Ghc 120
- Vegetarian Pizza — L: Ghc 150 / M: Ghc 130
- Beef & Mushroom Pizza — L: Ghc 150 / M: Ghc 130
- MJ Pepperoni Pizza — L: Ghc 180 / M: Ghc 150
- Seafood Pizza — L: Ghc 250 / M: Ghc 170
- Margherita Pizza — L: Ghc 120 / M: Ghc 100
- Hawaiian Pizza — L: Ghc 170 / M: Ghc 150

VEGETARIAN:
- Stir Fried Vegetables — Ghc 90
- Sauteed Vegetables and Chickpeas — Ghc 100
- Vegetable Soup — Ghc 90
- Vegetarian Egusi Stew — Ghc 90
- Pita Bread & Hummus — Ghc 90
- Mix Vegetable Stew — Ghc 90
- Beans Stew — Ghc 120
- Spaghetti Pomodoro — Ghc 150

DESSERTS:
- Fruit Platter — Ghc 80
- Fruit Salad — Ghc 80
- Ice Cream — Ghc 80
- Crumble Apple — Ghc 80
- Mohalabia Milk Pudding — Ghc 80
- Pan Cake — Ghc 80

SIDE ORDERS:
- Fried Rice — Ghc 50
- Sauteed Potato — Ghc 50
- Kelewele — Ghc 40
- Jollof Rice — Ghc 40
- Plain Rice — Ghc 40
- Potato Chips — Ghc 50
- Fried Plantain — Ghc 40
- Banku — Ghc 30
- Fried Yam — Ghc 30
- Fufu — Ghc 30

KIDS MENU:
- Crispy Chicken Fingers — Ghc 100
- Diced Chicken & Pasta in Tomato Sauce — Ghc 150
- Mini-Chicken & Rice — Ghc 120

EXTRAS:
- Extra Stew — Ghc 30
- Extra Vegetables — Ghc 40
- Extra Pepper — Ghc 20
- Take Away Pack — Ghc 30
- Aluminium Pack — Ghc 50`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description:
        "Create an escalation/support ticket for a guest issue that needs human attention",
      parameters: {
        type: "object",
        properties: {
          issue: {
            type: "string",
            description: "Description of the issue",
          },
          urgency: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Urgency level",
          },
        },
        required: ["issue", "urgency"],
        additionalProperties: false,
      },
    },
  },
];

// --- Input Validation ---
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateRequest(body: any): { valid: true; data: any } | { valid: false; error: string } {
  const { messages, guest_id, guest_name, gmt_hour, rating } = body;

  // Validate messages
  if (!messages || !Array.isArray(messages)) {
    return { valid: false, error: "Invalid messages format" };
  }
  if (messages.length > 50) {
    return { valid: false, error: "Too many messages" };
  }
  for (const msg of messages) {
    if (!msg.role || !["user", "assistant"].includes(msg.role)) {
      return { valid: false, error: "Invalid message role" };
    }
    if (!msg.content || typeof msg.content !== "string") {
      return { valid: false, error: "Invalid message content" };
    }
    if (msg.content.length > 5000) {
      return { valid: false, error: "Message too long (max 5000 chars)" };
    }
  }

  // Validate guest_id
  if (guest_id !== undefined && guest_id !== null) {
    if (typeof guest_id !== "string" || !UUID_RE.test(guest_id)) {
      return { valid: false, error: "Invalid guest_id format" };
    }
  }

  // Validate guest_name
  if (guest_name !== undefined && guest_name !== null) {
    if (typeof guest_name !== "string" || guest_name.length < 1 || guest_name.length > 100) {
      return { valid: false, error: "Guest name must be 1-100 characters" };
    }
    if (/[<>"']/.test(guest_name)) {
      return { valid: false, error: "Guest name contains invalid characters" };
    }
  }

  // Validate gmt_hour
  if (gmt_hour !== undefined && (typeof gmt_hour !== "number" || gmt_hour < 0 || gmt_hour > 23)) {
    return { valid: false, error: "Invalid GMT hour" };
  }

  // Validate rating
  if (rating !== undefined) {
    if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return { valid: false, error: "Rating must be an integer 1-5" };
    }
  }

  return { valid: true, data: { messages, guest_id: guest_id || null, guest_name: guest_name || null, gmt_hour, rating } };
}

// --- Guest Management (server-side) ---
async function resolveGuest(supabase: any, guestName: string | null): Promise<string | null> {
  if (!guestName) return null;

  const { data: existing } = await supabase
    .from("guests")
    .select("id")
    .eq("full_name", guestName)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: newGuest } = await supabase
    .from("guests")
    .insert({ full_name: guestName })
    .select("id")
    .single();

  return newGuest?.id || null;
}

async function createSupportTicket(
  supabase: any,
  guestId: string | null,
  issue: string,
  urgency: string
) {
  const referenceId = `MJ-${Math.floor(10000 + Math.random() * 90000)}`;
  const { data, error } = await supabase.from("support_tickets").insert({
    guest_id: guestId,
    issue,
    urgency,
    reference_id: referenceId,
  }).select().single();

  if (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: error.message };
  }
  return { success: true, reference_id: referenceId, ticket_id: data.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();

    // --- Input Validation ---
    const validation = validateRequest(rawBody);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { messages, guest_name, gmt_hour, rating } = validation.data;
    let { guest_id } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- Handle rating-only requests ---
    if (rating !== undefined && guest_id) {
      await supabase
        .from("guests")
        .update({ preferences: { last_chat_rating: rating } })
        .eq("id", guest_id);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Resolve guest server-side ---
    if (!guest_id && guest_name) {
      guest_id = await resolveGuest(supabase, guest_name);
    }

    // Fetch recent conversation history for context
    let memoryContext = "";
    if (guest_id) {
      const { data: history } = await supabase
        .from("conversations")
        .select("role, message")
        .eq("guest_id", guest_id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (history && history.length > 0) {
        memoryContext = "\n\nPREVIOUS CONVERSATION CONTEXT:\n" +
          history.reverse().map((h: any) => `${h.role}: ${h.message}`).join("\n");
      }

      // Check guest preferences
      const { data: guest } = await supabase
        .from("guests")
        .select("*")
        .eq("id", guest_id)
        .single();

      if (guest) {
        memoryContext += `\n\nGUEST PROFILE:\n- Name: ${guest.full_name || "Unknown"}\n- VIP: ${guest.vip}\n- Preferences: ${JSON.stringify(guest.preferences || {})}`;
      }
    }

    const now = new Date();
    const timeContext = gmt_hour !== undefined
      ? `\n\nCurrent date and time: ${now.toISOString().slice(0, 10)} (GMT hour: ${gmt_hour}). Use the GMT hour to determine the correct time-bound greeting. Use the date for any date-related questions.`
      : `\n\nCurrent date: ${now.toISOString().slice(0, 10)}.`;
    const systemPrompt = SYSTEM_PROMPT + memoryContext +
      (guest_name ? `\n\nThe guest's name is ${guest_name}.` : "") + timeContext;

    // Call Lovable AI Gateway
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          tools: TOOLS,
          stream: true,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Unable to process request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read the full stream, detect tool calls, execute, then re-stream
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let toolCalls: any[] = [];
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) fullContent += delta.content;
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.index !== undefined) {
                if (!toolCalls[tc.index]) {
                  toolCalls[tc.index] = { id: tc.id, function: { name: "", arguments: "" } };
                }
                if (tc.id) toolCalls[tc.index].id = tc.id;
                if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
                if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
              }
            }
          }
        } catch { /* partial json */ }
      }
    }

    // If there are tool calls, execute them and make a second AI call
    if (toolCalls.length > 0) {
      const toolResults: any[] = [];
      for (const tc of toolCalls) {
        if (!tc) continue;
        let result: any;
        const args = JSON.parse(tc.function.arguments);

        if (tc.function.name === "create_support_ticket") {
          result = await createSupportTicket(supabase, guest_id, args.issue, args.urgency);
        } else {
          result = { error: "Unknown tool" };
        }

        toolResults.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      // Second call with tool results — streaming
      const secondResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
              {
                role: "assistant",
                content: fullContent || null,
                tool_calls: toolCalls.map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: tc.function,
                })),
              },
              ...toolResults,
            ],
            stream: true,
          }),
        }
      );

      if (!secondResponse.ok) {
        const errText = await secondResponse.text();
        console.error("Second AI call error:", secondResponse.status, errText);
        return new Response(
          JSON.stringify({ error: "Unable to process request" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the user message
      if (guest_id && messages.length > 0) {
        const lastUserMsg = messages[messages.length - 1];
        await supabase.from("conversations").insert({
          guest_id,
          role: "user",
          message: lastUserMsg.content,
        });
      }

      const secondReader = secondResponse.body!.getReader();
      const secondDecoder = new TextDecoder();
      let secondBuffer = "";
      let secondContent = "";

      while (true) {
        const { done, value } = await secondReader.read();
        if (done) break;
        secondBuffer += secondDecoder.decode(value, { stream: true });
        let ni;
        while ((ni = secondBuffer.indexOf("\n")) !== -1) {
          let ln = secondBuffer.slice(0, ni);
          secondBuffer = secondBuffer.slice(ni + 1);
          if (ln.endsWith("\r")) ln = ln.slice(0, -1);
          if (!ln.startsWith("data: ")) continue;
          const js = ln.slice(6).trim();
          if (js === "[DONE]") continue;
          try {
            const p = JSON.parse(js);
            if (p.choices?.[0]?.delta?.content) secondContent += p.choices[0].delta.content;
          } catch {}
        }
      }

      // Log assistant response
      if (guest_id && secondContent) {
        supabase.from("conversations").insert({
          guest_id,
          role: "assistant",
          message: secondContent,
        }).then(() => {});
      }

      const enc = new TextEncoder();
      const reStream = new ReadableStream({
        start(controller) {
          const sseData = JSON.stringify({
            choices: [{ delta: { content: secondContent }, finish_reason: "stop" }],
          });
          controller.enqueue(enc.encode(`data: ${sseData}\n\n`));
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(reStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls — log and return collected content as SSE
    if (guest_id && messages.length > 0) {
      const lastUserMsg = messages[messages.length - 1];
      await supabase.from("conversations").insert({
        guest_id,
        role: "user",
        message: lastUserMsg.content,
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const sseData = JSON.stringify({
          choices: [{ delta: { content: fullContent }, finish_reason: "stop" }],
        });
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        if (guest_id) {
          supabase.from("conversations").insert({
            guest_id,
            role: "assistant",
            message: fullContent,
          }).then(() => {});
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mj-ai error:", e);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
