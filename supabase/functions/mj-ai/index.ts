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
- On first contact, always greet the guest warmly and introduce yourself: "Welcome to MJ Grand Hotel! I'm MJ, your personal support assistant."

TONE:
- Warm, professional, empathetic
- Clear and concise
- Intelligent and natural — never robotic

RESPONSE RULES:
- Always use structured formatting with bullet points for options
- Keep responses concise but complete
- Never fabricate hotel data — use tools when data is required
- Confirm actions clearly
- Show empathy when guests express frustration
- Always end with: "Is there anything else I can assist you with today?"

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

HOTEL INFO:
- MJ Grand Hotel is a luxury beachfront property
- Amenities: Spa, Rooftop Bar, Fine Dining Restaurant, Infinity Pool, Fitness Center, Business Center
- Room types: Deluxe Room, Executive Suite, Penthouse Suite
- Check-in: 3:00 PM, Check-out: 11:00 AM
- Late checkout available upon request (subject to availability)`;

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
    const { messages, guest_id, guest_name } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    const systemPrompt = SYSTEM_PROMPT + memoryContext +
      (guest_name ? `\n\nThe guest's name is ${guest_name}.` : "");

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
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    // We need to handle tool calls — read the full stream, detect tool calls, execute, then re-stream
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let toolCalls: any[] = [];
    let buffer = "";

    // First pass: collect everything to check for tool calls
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
        throw new Error("Failed second AI call");
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

      // Read second response to log assistant reply, then re-stream
      const secondReader = secondResponse.body!.getReader();
      const secondDecoder = new TextDecoder();
      let secondBuffer = "";
      let secondContent = "";
      const secondChunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await secondReader.read();
        if (done) break;
        secondChunks.push(value);
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

      // Re-stream collected chunks
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

    // Re-stream the content we already collected
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the full content as a single SSE event
        const sseData = JSON.stringify({
          choices: [{ delta: { content: fullContent }, finish_reason: "stop" }],
        });
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        // Log assistant response async
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
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
