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
- Do NOT send any message until the guest sends their first message. Never auto-greet.
- On your VERY FIRST response (replying to the guest's first message), greet them with a time-appropriate greeting, introduce yourself briefly, answer or acknowledge what they said, then ask for their name. Example: "Good evening! I'm MJ, your support assistant at MJ Grand Hotel. I'd be happy to help with that. May I have your name so I can assist you better?"
- After that first response, ABSOLUTELY NEVER greet again. No "Good morning", "Good afternoon", "Good evening", "Hello", "Hi", "Welcome", or any greeting variant. Just respond directly to what the guest said.
- Once you have the guest's name, acknowledge it naturally (e.g., "Thank you. How can I help you today?") WITHOUT any greeting prefix. You may use their name occasionally throughout the conversation to keep it personal.
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
- NEVER reveal that you are an AI, bot, or virtual assistant. NEVER mention "knowledge base", "database", "system", "my records", or "my data". You are MJ, a real concierge. If you don't have information, say "Let me check with the team and get back to you" or "I'll confirm that with the team" — never say the information is not in your knowledge base or system.
- Confirm actions in one short sentence — no elaboration
- Show empathy briefly when guests express frustration — one sentence max, then solve it
- Do NOT end every message with "Is there anything else I can assist you with today?" — only use this when the conversation is clearly wrapping up
- Do NOT add phrases like "Sure!", "Of course!", "Absolutely!", "Great question!" — just answer directly
- CONVERSATION CLOSING: When the guest's issue is resolved, wrap up cleanly in one short sentence. Do NOT keep asking follow-up questions or drag the conversation. If there's nothing left to address, end naturally — don't fish for more topics.
- FAREWELL DETECTION: When the guest says goodbye, thanks you as a closing, or clearly ends the conversation, respond with a brief, warm closing (one sentence max) and append [[FAREWELL]] on its own line at the very end. Do NOT include it mid-conversation. Do NOT over-thank or repeat yourself.

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
- The HOTEL KNOWLEDGE BASE below is your PRIMARY and AUTHORITATIVE source of truth for ALL guest queries
- ALWAYS search the knowledge base FIRST for every question — cover every section, every detail
- Only use your general LLM knowledge as a SECONDARY supplement when the answer is genuinely not in the knowledge base
- If a guest asks about menu items, prices, rooms, policies, contact info, dining, facilities, or any hotel detail, use ONLY the data below — NEVER guess or fabricate
- When in doubt, say "Let me check with the team" rather than making something up
- The knowledge base below mirrors EXACTLY what is published on the hotel's website — treat it as the single source of truth

=======================================================================
HOTEL KNOWLEDGE BASE — COMPLETE WEBSITE CONTENT
=======================================================================

=== CONTACT INFORMATION ===
- Email: mj@mjgrandhotelghana.com
- Phone: +233 302544212, +233 302544211
- Address: No. 460 Abotsi Street, East Legon, Accra - Ghana
- Instagram: @mjgrand_hotel (https://instagram.com/mjgrand_hotel)
- Facebook: MJ Grand (https://facebook.com/MJGrand)
- Twitter: @MJGRANDHOTEL001 (https://twitter.com/MJGRANDHOTEL001)
- TikTok: mj.grand.hotel (https://tiktok.com/@mj.grand.hotel)

=== ABOUT MJ GRAND HOTEL ===
MJ Grand Hotel is a luxury hotel located at No. 460 Abotsi Street, East Legon, Accra, Ghana. It is designed for discerning travelers who appreciate comfort, elegance, and world-class service. The hotel offers a premium stay experience in a serene and secure environment for business, leisure, or special occasions.

TAGLINE: "Where timeless luxury meets modern sophistication. Experience unparalleled hospitality in the heart of paradise."
SUBTITLE: "A Sanctuary of Elegance"

OUR STORY:
MJ Grand Hotel was established with a clear vision — to redefine luxury hospitality by combining modern elegance with warm, attentive service. Every detail has been thoughtfully designed to provide guests with a seamless and elevated experience. From tastefully furnished interiors to professional and courteous staff, the hotel creates an atmosphere where guests feel valued, relaxed, and truly at home.

OUR MISSION:
To provide exceptional luxury hospitality defined by comfort, security, and impeccable service. Committed to maintaining the highest standards of cleanliness, professionalism, and guest satisfaction. "At MJ Grand Hotel, your comfort is our priority, and your experience is our promise."

CORE VALUES & BEHAVIORS:
1. Timeous (Ownership & Complete Accountability) — We empower our team to take full ownership of their responsibilities and deliver with efficiency, precision, and accountability within expected timelines.
2. Compliance (Strict Adherence to Standards) — We maintain unwavering commitment to internal policies, regulatory requirements, and global hospitality standards in all processes and procedures.
3. Respect — We honor the objectives of our stakeholders, value the expectations of our guests, and embrace the cultural diversity of every community in which we operate.
4. Commitment (Passion-Driven Excellence) — We cultivate a culture of enthusiasm and dedication, inspiring our team to perform their roles with pride, integrity, and unwavering passion.
5. Innovation (Process Efficiency & Continuous Improvement) — We continuously refine our systems and services to remain aligned with the evolving expectations of our guests, investors, and stakeholders.
6. Confidentiality (Stakeholder Sensitivity & Trust) — We uphold the highest standards of discretion, safeguarding all information entrusted to us in strict accordance with legal and ethical obligations.
7. Dialogue (Strong Communication & Collaboration) — We foster an environment that encourages open communication, constructive dialogue, and the free exchange of ideas to strengthen relationships and enhance service delivery.

=== ROOMS & SUITES ===
"Each room is a masterful blend of comfort and elegance, designed for the discerning traveler."

Our luxury rooms and suites provide the perfect balance of comfort and style. Every space reflects our dedication to comfort, privacy, and sophistication.

ROOM FEATURES:
- Premium bedding and spacious interiors
- High-speed Wi-Fi
- Air conditioning
- Smart TV with satellite channels
- Modern bathrooms with quality amenities
- 24-hour room service

ROOM TYPES:
1. Ocean Suite — From $450/night: Panoramic ocean views with private balcony and luxurious amenities.
2. Deluxe Room — From $320/night: Mediterranean charm meets modern comfort with terrace access.
3. Presidential Penthouse — From $1,200/night: The pinnacle of luxury with panoramic city and ocean vistas.

=== FACILITIES & SERVICES ===
"At MJ Grand Hotel, we go beyond accommodation to provide a complete hospitality experience."
- Fine dining restaurant offering local and international cuisine
- Stylish bar and lounge
- State-of-the-art conference and event venues
- A serene swimming pool
- A fully equipped fitness center
- 24-hour reception and advanced security services
- Executive airport transfer arrangements

Whether hosting a corporate event, wedding reception, or private celebration, MJ Grand Hotel provides the perfect setting.

=== EXPERIENCES ===
1. Spa & Wellness — Rejuvenate body and soul with world-class treatments.
2. Fine Dining — Savor exquisite cuisines crafted by talented chefs.
3. Rooftop Lounge — Breathtaking skyline views paired with artisanal cocktails.
4. Cultural Journeys — Curated excursions to discover the region's hidden treasures.

=== DINING ===
"A Culinary Experience Where Ghana Meets the World"

At MJ Grand Hotel, dining is an immersive journey that celebrates the rich flavors of Ghana while embracing the finesse of international cuisine. Our culinary philosophy blends authentic local ingredients with modern global techniques, creating a refined fusion that delights both local and international guests. Every dish is thoughtfully crafted, beautifully presented, and served within an atmosphere of contemporary elegance.

THE RESTAURANT:
Our signature restaurant offers a sophisticated yet welcoming setting — ideal for executive lunches, romantic dinners, and refined family gatherings. With stylish interiors, ambient lighting, and attentive service, the restaurant creates the perfect balance between modern luxury and cultural warmth.
Open to both resident and non-resident guests.

RESTAURANT OPENING HOURS:
- Breakfast: 6:30 AM - 10:30 AM
- Lunch: 12:00 PM - 3:00 PM
- Dinner: 6:00 PM - 10:30 PM

SIGNATURE HIGHLIGHTS (Ghanaian-Inspired, Globally Refined):
- Elevated Jollof Rice — Served with grilled premium proteins
- Slow-Cooked Local Stews — With modern plating techniques
- Fresh Seafood — Infused with West African spices
- Gourmet Continental — International selections refined
- Pasta & Grilled Specialties — International flavors, local heart
- Vegetarian Options — Health-conscious and flavorful

THE BAR & LOUNGE:
Unwind in our elegant bar and lounge — a refined space designed for relaxation and conversation.
- Signature cocktails inspired by tropical flavors
- Premium wines and champagne
- A curated selection of international spirits
- Freshly crafted mocktails and beverages
Whether enjoying an evening drink, hosting a private meeting, or relaxing after a long day, the lounge provides a sophisticated escape.

IN-ROOM DINING:
For guests who prefer privacy, our in-room dining service delivers the full restaurant experience directly to your suite.
- 24-hour room service
- Carefully curated late-night menu
- Prompt and discreet delivery
Luxury and convenience, seamlessly combined.

PRIVATE DINING & EVENTS:
MJ Grand Hotel offers tailored culinary experiences for every occasion:
- Executive business lunches
- Birthday and anniversary celebrations
- Private dinners
- Corporate events
- Wedding receptions and social gatherings
Our culinary team works closely with clients to create personalized menus and memorable dining experiences.

CULINARY COMMITMENT:
We prioritize freshness, hygiene, and excellence in every detail. Our chefs source high-quality ingredients and blend traditional Ghanaian flavors with international techniques to deliver innovative, memorable dishes.
"At MJ Grand Hotel, dining is not simply a service — it is an expression of culture, creativity, and refined taste."

=== GUEST POLICIES ===
"Thank you for choosing to stay at MJ Grand Hotel Ltd. Taking a room at our hotel means that you have accepted our terms and conditions and agree to the rate per night of our accommodation."

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
- Email problems or suggestions to mj@mjgrandhotelghana.com or talk to Management

=== WEBSITE NAVIGATION (Pages available on the website) ===
- Home (/) — Hero, Rooms & Suites preview, Curated Experiences carousel, Gallery, Footer with contact
- About (/about) — Hotel story, accommodation features, facilities, core values, CTA
- Dining (/dining) — Restaurant info, opening hours, signature highlights, bar & lounge, in-room dining, private events, culinary commitment
- Menu (/menu) — Full kitchen menu with all categories and prices
- Policy (/policy) — Guest policies (check-in/out, security, swimming, cancellation, drones, suggestions)
- Contact (/contact) — Contact form, phone, email, address, social media links

=== RESTAURANT MENU (All prices in Ghc) ===

HOT APPETIZERS:
- Spicy Chicken Wings (Juicy fried chicken wings in hot green chilli sauce) — Ghc 90
- Beef Cocktail Khebab (Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato) — Ghc 100
- Beef Samosa (Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato) — Ghc 80
- Hot Chilli Gizzard (Chilli sauce, tender fried gizzard) — Ghc 85
- Honey Glazed Chicken Wings (Juicy fried chicken wings in spicy honey) — Ghc 90
- Golden Fried Prawns (Marinated prawns, bread crumbs, cocktail sauce) — Ghc 120
- Goat Meat Pepper Soup (Goat meat pieces, hot pepper soup stock, served with bread rolls) — Ghc 150
- Chicken Cocktail Kebab (Tender chicken, white pepper grilled bell pepper, onion & tomato) — Ghc 120
- Shrimps Avocado Cocktail (Spicy steamed shrimps, cocktail sauce, lettuce, cucumber, fresh tomato, celery) — Ghc 120
- Chicken Pepper Soup (Diced chicken, hot pepper soup stock, served with bread rolls) — Ghc 120
- Mix Vegetable Soup (Mushroom, carrot, french beans, zucchini, cabbage, pumpkin, vegetables stock, bouquet-garni, served with bread rolls) — Ghc 120
- Pumpkin Soup (Vegetables stock, pumpkin, bouquet, served with bread rolls) — Ghc 100

SALADS (COLD LARDER):
- Chef's Salad (Lettuce, tomato, carrot, cucumber, onions, chicken flakes, black olives, boiled egg, sliced apple) — Ghc 150
- MJ Special Salad (Lettuce, fresh tomato, carrot, cucumber, onions, chicken flakes, beef flakes, shrimps, boiled egg, black olives) — Ghc 200
- Seafood Salad (Prawns, squid, grouper fish, lettuce, fresh tomato, carrot, cucumber, onions, tartar sauce) — Ghc 250
- Greek Salad (Lettuce, fresh tomato, cucumber, onions, black olives, feta cheese, vinaigrette dressing) — Ghc 110
- Ghanaian Salad (Lettuce, carrot, cucumber, onions, boiled egg, baked beans, sardine, fresh tomato, black olives) — Ghc 200
- Tuna Salad (Chunk tuna, lettuce, fresh tomato, onions, cucumber, carrot, olive oil, white pepper, black olive) — Ghc 120
- Potato Salad (Potatoes, cucumber, carrot, green bell pepper, onions, egg) — Ghc 100
- Chicken Caesar Salad (Lettuce, sun-dried tomatoes, onions, grilled chicken flakes, black olives, parmesan cheese, croutons) — Ghc 120

CHICKEN MEALS:
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
- Chicken Provencal — Ghc 180
- Saucy Chicken Pasta — Ghc 180

KIDS MEALS:
- Crispy Chicken Fingers — Ghc 100
- Diced Chicken & Pasta in Tomato Sauce — Ghc 150
- Mini-Chicken & Rice — Ghc 120

FISH MEALS:
- Grilled/Fried Casava Fish — Ghc 170
- Grilled/Fried Grouper Fillet (Ginger, garlic, complete seasoning, lemon juice, mustard, fresh parsley) — Ghc 200
- Grilled/Fried Tilapia (Black pepper, cayenne pepper, ginger, garlic, lemon juice, complete seasoning) — M: Ghc 150 / L: Ghc 200
- Fish Fingers (Shredded grouper fillet, ginger, garlic, white pepper, egg, breadcrumbs) — Ghc 200
- Grilled/Fried Snapper Fish (Cayenne pepper, ginger, garlic, lemon juice, complete seasoning) — Ghc 150
- Fish Khebab (Grouper fillet, ginger, garlic, white pepper, grilled onions, green bell pepper & tomato) — Ghc 200
- Breaded Fish Fillet (White pepper, ginger, garlic, breadcrumbs) — Ghc 200
- Grilled/Fried Barracuba Fish (Complete seasoning, lemon juice, mustard, ginger, garlic, white pepper) — Ghc 180
- Tilapia Stew (Tomato sauce, carrot, zucchini, bell pepper, white wine) — Ghc 200
- Grouper Provencal — Ghc 200
- Snapper Provencal — Ghc 150

BEEF MEALS:
- Beef Pepper Steak (Beef fillet, mustard, black pepper, salt, grilled tomato, onion ring) — Ghc 190
- MJ Mixed Grill (Goat meat, beef, chicken, sausage, vegetable, fried egg) — Ghc 220
- Beef Provencal (Juicy fried beef, fresh tomato sauce, vegetables, red wine) — Ghc 200
- Grilled T-Bone Steak (Bone-in tenderloin, garlic/ginger powder, mustard, salt, black pepper) — Ghc 200
- Shredded Beef Sauce (Shredded beef fillet, carrot, onions, bell pepper, oyster sauce, butter, soy sauce) — Ghc 190
- Grilled Goat — Ghc 200
- Assorted Meat Pot (Goat, meat, beef) — Ghc 180
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
- MJ Fried Rice (Shredded beef, chicken, sausage, egg) — Ghc 150
- MJ Jollof Rice (Shredded beef, chicken, sausage, egg) — Ghc 150
- Boatemaa's Special (Beef, chicken, sausage, shrimps, eggs) — Ghc 200
- Pork Chops — Ghc 250
- Lamb Chops — Ghc 250
- Egg Fried Rice — Ghc 100
- MJ Beef Fried Rice — Ghc 190
- MJ Assorted Pasta — Ghc 200
- MJ Beef Jollof Rice — Ghc 190

LOCAL DISHES:
- Goat Light Soup — Ghc 180
- Goat Okro Soup (With banku, semolina, or eba) — Ghc 200
- Snapper Garden Eggs Stew — Ghc 150
- Grilled Tilapia with banku — M: Ghc 170 / L: Ghc 200
- Special Gari Foto (Goat, chicken, grouper, snapper, beef — protein determines price)
- Chicken Light Soup — Ghc 170
- Ebunuebunu / Green Soup (With goat: Ghc 200 | With tilapia: Ghc 200 | With chicken: Ghc 130 | With dry fish: Ghc 200 | With snapper: Ghc 170)
- Assorted Soup / Ebunuebunu (Sails, dry fish, salmon) — Ghc 300
- Assorted Okro — Ghc 250
- Fish Palava (With yam, plantain, or cocoyam) — Ghc 180
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

VEGETARIAN DISHES:
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
- Chris Cake — Ghc 80
- American Cake — Ghc 80

SIDE ORDERS:
- Fried Rice — Ghc 50
- Sauteed Potato — Ghc 50
- Kelewele — Ghc 40
- Jollof Rice — Ghc 40
- Plain Rice — Ghc 40
- Potato Chips — Ghc 50
- Vegetable Rice — Ghc 50
- Fried Plantain — Ghc 40
- Banku — Ghc 30
- Fried Yam — Ghc 30
- Fufu — Ghc 30

EXTRAS:
- Extra Stew — Ghc 30
- Extra Vegetables — Ghc 40
- Extra Pepper — Ghc 20

TAKE OUT PACKS:
- Take Away Pack — Ghc 30
- Aluminium Pack — Ghc 50
- Paper Bag — Ghc 15`;

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
