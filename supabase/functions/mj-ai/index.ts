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
- On your VERY FIRST response (replying to the guest's first message), greet them with a time-appropriate greeting, introduce yourself briefly, then ANSWER or ACKNOWLEDGE what they said FULLY. Only AFTER answering their question, ask for their name — do NOT ask for the name before providing a helpful answer. Example: "Good evening! I'm MJ, your support assistant at MJ Grand Hotel. [answer their question here]. By the way, may I have your name so I can assist you better?"
- CRITICAL: If you have already answered the guest's question or provided the information they asked for, do NOT ask for their name in the same message if it would feel redundant or pushy. If the conversation flows naturally, you can ask in a follow-up message instead.
- After that first response, ABSOLUTELY NEVER greet again. No "Good morning", "Good afternoon", "Good evening", "Hello", "Hi", "Welcome", or any greeting variant. Just respond directly to what the guest said.
- Once you have the guest's name, acknowledge it naturally (e.g., "Thank you. How can I help you today?") WITHOUT any greeting prefix. You may use their name occasionally throughout the conversation to keep it personal.
- If the guest's name is already known (provided in the system context as "The guest's name is X"), do NOT ask for their name again — just use it naturally.
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

BOOKING CAPABILITIES:
You can help guests book rooms directly in this conversation. When a guest wants to book:
1. Ask for their preferred check-in and check-out dates if not provided
2. Ask how many adults and children
3. Use the search_available_rooms tool to find available rooms
4. Present the available rooms with prices clearly
5. When the guest selects a room, ask if they'd like any add-ons — use get_add_ons to show options
6. Collect guest details: full name, email, phone number
7. Summarize the booking and ask for confirmation
8. Use create_booking to finalize

BOOKING RESPONSE FORMATTING:
- When presenting rooms from search_available_rooms, format them as a clear numbered list with name, nightly rate, total, and bed type
- When presenting add-ons, list them briefly with prices
- CRITICAL: After a booking is successfully created via create_booking, you MUST ALWAYS share the booking reference code (e.g., MJ-XXXXXXXX) and the total amount prominently with the guest. This is their confirmation — never skip it. Example: "Your booking is confirmed! Reference code: **MJ-A1B2C3D4**. Total: **$80 (≈ GH₵ 1,200)**. You can use this code to check your booking status anytime."
- CURRENCY DISPLAY (CRITICAL): The website shows USD as the primary currency with GH₵ as the equivalent. ALWAYS quote prices in this exact format: "$X (≈ GH₵ Y)". Never quote GH₵ alone unless the guest explicitly asks for cedis only. Use the live exchange rate provided in the CURRENCY section of the knowledge base for any conversion you must compute yourself.

DATE HANDLING:
- When guests say "tomorrow", "next week", "this Friday", etc., calculate the actual date based on the current date provided in your context
- Always confirm dates with the guest before searching
- Dates must be in YYYY-MM-DD format when calling tools

EMOTIONAL INTELLIGENCE:
- Detect frustration and apologize naturally
- Example: "I truly apologize for the inconvenience. Let me fix this immediately for you."

ESCALATION RULES:
When encountering: repeated anger, legal threats, refund requests, safety concerns, payment disputes, VIP issues, or system uncertainty:
- Only ask for a room number if you have determined the person is a current in-house guest (e.g., they mentioned staying at the hotel, checking in, or referenced their room). Say "May I have your room number so our team can locate you quickly?"
- If the person is NOT a confirmed guest (e.g., a prospective booker, someone inquiring, or you haven't established their guest status), do NOT ask for a room number — just create the ticket without one
- Use the create_support_ticket tool (with or without room_number depending on guest status)
- Say: "I'm escalating this to our Guest Relations Manager. You'll receive contact within 10 minutes."
- Provide the reference ID from the ticket

IMPORTANT — KNOWLEDGE BASE PRIORITY:
- The HOTEL KNOWLEDGE BASE below is your PRIMARY and AUTHORITATIVE source of truth for ALL guest queries — it mirrors EXACTLY what is published on the hotel's website and managed in the hotel's dashboard
- ALWAYS consult the knowledge base FIRST and EXHAUSTIVELY for every question — check every section, every detail, every sub-point before answering
- Only use your general LLM knowledge as a SECONDARY supplement when the answer is genuinely not covered anywhere in the knowledge base
- If a guest asks about menu items, prices, rooms, policies, contact info, dining, facilities, booking, promotions, or any hotel detail, use ONLY the data below — NEVER guess or fabricate
- When information is not in the knowledge base and you cannot answer from general knowledge, say "Let me check with the team" rather than making something up
- The knowledge base includes both STATIC content (hotel descriptions, policies, contact info) and DYNAMIC content (room pricing, menu items, promotions, cancellation policies) that is fetched live from the hotel's database
- Dynamic content is always up-to-date — if a price or promotion was just changed by management, it will be reflected here
- If there is a conflict between static knowledge base content and dynamic database content, ALWAYS trust the dynamic database content as it represents the latest management decisions

=======================================================================
HOTEL KNOWLEDGE BASE — COMPLETE WEBSITE & DASHBOARD CONTENT
=======================================================================

=== CURRENCY (READ FIRST — APPLIES TO EVERY PRICE) ===
- Base display currency: USD ($)
- Equivalent currency: Ghana Cedis (GH₵)
- Live exchange rate: 1 USD = {LIVE_FX_RATE} GHS (refreshed hourly from open.er-api.com — same source as the website)
- Prices stored in our database are in GH₵, but you MUST always present them to guests as "$X (≈ GH₵ Y)"
- To convert any GH₵ amount yourself: USD = GH₵ amount ÷ {LIVE_FX_RATE}, then round to the nearest dollar
- The static restaurant menu below lists prices in GH₵ — convert each one on the fly using the rate above when quoting to guests

=== CONTACT INFORMATION ===
- Email: mj@mjgrandhotelghana.com
- Phone: +233 302544212, +233 302544211
- Address: No. 460 Abotsi Street, East Legon, Accra - Ghana
- Instagram: @mjgrand_hotel (https://instagram.com/mjgrand_hotel)
- Facebook: MJ Grand (https://facebook.com/MJGrand)
- Twitter: @MJGRANDHOTEL001 (https://twitter.com/MJGRANDHOTEL001)
- TikTok: mj.grand.hotel (https://tiktok.com/@mj.grand.hotel)
- For general enquiries: mj@mjgrandhotelghana.com or call +233 302544212
- For business, investment, or hotel enquiries: speak to Management directly
- Guests can also send a message via the Contact form on the website (Home page)
- For restaurant table reservations: call 0573338062

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

STANDARD ROOM FEATURES (all rooms include):
- Premium bedding and spacious interiors
- High-speed Wi-Fi
- Air conditioning
- Smart TV with satellite channels
- Modern bathrooms with quality amenities
- 24-hour room service
- In-room safe for valuables
- Complimentary toiletries

{DYNAMIC_ROOMS}

=== FACILITIES & SERVICES ===
"At MJ Grand Hotel, we go beyond accommodation to provide a complete hospitality experience."

FULL FACILITY LIST:
- Fine dining restaurant offering local and international cuisine (open to residents and non-residents)
- Stylish bar and lounge with signature cocktails
- State-of-the-art conference and event venues (corporate events, weddings, private celebrations)
- A serene swimming pool with poolside service (pool guard/lifeguard on duty)
- A fully equipped fitness center / gym
- Spa & Wellness center with world-class treatments
- 24-hour reception and front desk services
- Advanced security services (24-hour guards, perimeter alarm system)
- Executive airport transfer arrangements (can be booked as an add-on)
- Concierge services
- Laundry and dry cleaning (attracts a charge)
- Free parking
- Complimentary tea and coffee facility in rooms
- Complimentary bottled water on arrival day
- Bible / Quran available on request

Whether hosting a corporate event, wedding reception, or private celebration, MJ Grand Hotel provides the perfect setting.

=== GUEST SERVICES (from /guest-services page) ===
Services available to all guests:
1. Complimentary Breakfast — Served daily from 6:00 AM to 10:00 AM. Breakfast on arrival day attracts a charge.
2. Free High-Speed WiFi — Complimentary internet connection throughout the hotel.
3. Swimming Pool — Complimentary access to swimming pool facilities.
4. Airport Shuttle — Complimentary airport shuttle departs every 2 hours. Operating hours: 5:00 AM to 11:00 PM. Please confirm arrangements with the Front Office in advance.
5. Room Service — Room service available. Bible / Quran available on request.
6. Laundry Service — Laundry service attracts a charge.
7. Tea & Coffee Facility — Complimentary tea and coffee facility available in rooms.
8. Conference Facility — Conference facility available for residential and corporate events.
9. Gym — A fully equipped gym facility for guests who wish to maintain their fitness and wellness routines during their stay.
10. Catering Services — Professional catering services available for the general public, offering high-quality meals for a variety of occasions and gatherings.
11. Outdoor Events — We host outdoor events such as wedding receptions and end-of-year get-togethers, with dedicated event planning and execution.

GUEST INFORMATION:
- Check-Out Time is 12:00 Noon. Late check-out attracts a charge.
- Complimentary bottled water is provided on arrival day.

IN-HOUSE TELEPHONE DIRECTORY:
- Front Office: Extension 100 / 200 / 300
- Ankomah Restaurant: Extension 112
- Pool Bar: Extension 113
- Kitchen: Extension 114

QR CODE ACCESS:
- Guests can scan a QR code to access guest services information anytime at https://mjgrandhotel.com/guest-services

=== CURATED EXPERIENCES ===
1. Spa & Wellness — Rejuvenate body and soul with world-class treatments.
2. Fine Dining — Savor exquisite cuisines crafted by talented chefs.
3. Rooftop Lounge — Breathtaking skyline views paired with artisanal cocktails.
4. Cultural Journeys — Curated excursions to discover the region's hidden treasures.

=== GALLERY ===
The hotel features beautiful spaces including:
- Infinity pool with sunset views
- Grand lobby with chandelier
- Garden terrace dining area
- Beach club with white cabanas

=== DINING ===
"A Culinary Experience Where Ghana Meets the World"

At MJ Grand Hotel, dining is an immersive journey that celebrates the rich flavors of Ghana while embracing the finesse of international cuisine. Our culinary philosophy blends authentic local ingredients with modern global techniques, creating a refined fusion that delights both local and international guests. Every dish is thoughtfully crafted, beautifully presented, and served within an atmosphere of contemporary elegance.

THE RESTAURANT (Ankomah Restaurant):
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

FEATURED DINING EXPERIENCE — SPECIAL SUNDAY BUFFET:
- Every Sunday at MJ Grand Hotel
- A rich selection of local and international dishes
- Perfect for dining with family, friends, or colleagues
- Price: GH₵ 300 per person (quote as "$X (≈ GH₵ 300) per person" using the live rate)
- Freshly prepared meals expertly crafted by our chefs
- To reserve a table: call 0573338062

CULINARY COMMITMENT:
We prioritize freshness, hygiene, and excellence in every detail. Our chefs source high-quality ingredients and blend traditional Ghanaian flavors with international techniques to deliver innovative, memorable dishes.
"At MJ Grand Hotel, dining is not simply a service — it is an expression of culture, creativity, and refined taste."

=== STATIC RESTAURANT MENU (fallback if database menu unavailable) ===
All prices in GH₵:

HOT APPETIZERS:
- Spicy Chicken Wings (Juicy fried chicken wings in hot green chilli sauce) — GH₵ 90
- Beef Cocktail Khebab (Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato) — GH₵ 100
- Beef Samosa (Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato) — GH₵ 80
- Hot Chilli Gizzard (Chilli sauce, tender fried gizzard) — GH₵ 85
- Honey Glazed Chicken Wings (Juicy fried chicken wings in spicy honey) — GH₵ 90
- Golden Fried Prawns (Marinated prawns, bread crumbs, cocktail sauce) — GH₵ 120
- Goat Meat Pepper Soup (Goat meat pieces, hot pepper soup stock, served with bread rolls) — GH₵ 150
- Chicken Cocktail Kebab (Tender chicken, white pepper grilled bell pepper, onion & tomato) — GH₵ 120
- Shrimps Avocado Cocktail (Spicy steamed shrimps, cocktail sauce, lettuce, cucumber, fresh tomato, celery) — GH₵ 120
- Chicken Pepper Soup (Diced chicken, hot pepper soup stock, served with bread rolls) — GH₵ 120
- Mix Vegetable Soup (Mushroom, carrot, french beans, zucchini, cabbage, pumpkin, vegetables stock, bouquet-garni, served with bread rolls) — GH₵ 120
- Pumpkin Soup (Vegetables stock, pumpkin, bouquet, served with bread rolls) — GH₵ 100

COLD LARDER / SALADS:
- Chef's Salad (Lettuce, tomato, carrot, cucumber, onions, chicken flakes, black olives, boiled egg, sliced apple) — GH₵ 150
- MJ Special Salad (Lettuce, fresh tomato, carrot, cucumber, onions, chicken flakes, beef flakes, shrimps, boiled egg, black olives) — GH₵ 200
- Seafood Salad (Prawns, squid, grouper fish, lettuce, fresh tomato, carrot, cucumber, onions, tartar sauce) — GH₵ 250
- Greek Salad (Lettuce, fresh tomato, cucumber, onions, black olives, feta cheese, vinaigrette dressing) — GH₵ 110
- Ghanaian Salad (Lettuce, carrot, cucumber, onions, boiled egg, baked beans, sardine, fresh tomato, black olives) — GH₵ 200
- Tuna Salad (Chunk tuna, lettuce, fresh tomato, onions, cucumber, carrot, olive oil, white pepper, black olive) — GH₵ 120
- Potato Salad (Potatoes, cucumber, carrot, green bell pepper, onions, egg) — GH₵ 100
- Chicken Caesar Salad (Lettuce, sun-dried tomatoes, onions, grilled chicken flakes, black olives, parmesan cheese, croutons) — GH₵ 120

CHICKEN MEALS:
- Spicy Grilled Chicken — GH₵ 150
- Hawaiian Chicken Khebeb — GH₵ 150
- Chicken Alfredo — GH₵ 180
- Chicken Khebab — GH₵ 130
- Chicken Fried Rice — GH₵ 160
- Chicken Soup — GH₵ 180
- Spicy Turkey Wings — GH₵ 150
- Grilled/Fried Chicken Breast — GH₵ 150
- Chicken Breast Veg Stir Fry — GH₵ 150
- Shredded Chicken Sauce — GH₵ 150
- Chicken Provençal — GH₵ 180
- Saucy Chicken Pasta — GH₵ 180

KIDS MEALS:
- Crispy Chicken Fingers — GH₵ 100
- Diced Chicken & Pasta in Tomato Sauce — GH₵ 150
- Mini-Chicken & Rice — GH₵ 120

FISH MEALS:
- Grilled/Fried Casava Fish — GH₵ 170
- Grilled/Fried Grouper Fillet — GH₵ 200
- Grilled/Fried Tilapia — M: GH₵ 150 / L: GH₵ 200
- Fish Fingers — GH₵ 200
- Grilled/Fried Snapper Fish — GH₵ 150
- Fish Khebab — GH₵ 200
- Breaded Fish Fillet — GH₵ 200
- Grilled/Fried Barracuba Fish — GH₵ 180
- Tilapia Stew — GH₵ 200
- Grouper Provençal — GH₵ 200
- Snapper Provençal — GH₵ 150

BEEF MEALS:
- Beef Pepper Steak (Beef fillet, mustard, black pepper, salt, grilled tomato, onion ring) — GH₵ 190
- MJ Mixed Grill (Goat meat, beef, chicken, sausage, vegetable, fried egg) — GH₵ 220
- Beef Provençal (Juicy fried beef, fresh tomato sauce, vegetables, red wine) — GH₵ 200
- Grilled T-Bone Steak (Bone-in tenderloin, garlic/ginger powder, mustard, salt, black pepper) — GH₵ 200
- Shredded Beef Sauce (Shredded beef fillet, carrot, onions, bell pepper, oyster sauce, butter, soy sauce) — GH₵ 190
- Grilled Goat — GH₵ 200
- Assorted Meat Pot (Goat, meat, beef) — GH₵ 180
- Hawaiian Beef Khebab — GH₵ 150
- Beef Stroganoff — GH₵ 180
- Saucy Beef Pasta — GH₵ 190

SEAFOOD MEALS:
- Mediterranean Seafood — GH₵ 250
- Stir Fried Seafood — GH₵ 250
- Grilled Prawns — GH₵ 200
- Saucy Shrimps & Pasta — GH₵ 200
- Fisherman's Basket — GH₵ 250
- Lobster Thermidor — GH₵ 250
- Grilled Lobster — GH₵ 250
- Shrimps Sauce — GH₵ 180
- Shrimps Fried Rice — GH₵ 170
- Fisherman's Soup — GH₵ 250
- Shrimps Spaghetti Royal — GH₵ 200

MJ SPECIALS:
- MJ Fried Rice (Shredded beef, chicken, sausage, egg) — GH₵ 150
- MJ Jollof Rice (Shredded beef, chicken, sausage, egg) — GH₵ 150
- Boatemaa's Special (Beef, chicken, sausage, shrimps, eggs) — GH₵ 200
- Pork Chops — GH₵ 250
- Lamb Chops — GH₵ 250
- Egg Fried Rice — GH₵ 100
- MJ Beef Fried Rice — GH₵ 190
- MJ Assorted Pasta — GH₵ 200
- MJ Beef Jollof Rice — GH₵ 190

LOCAL DISHES:
- Goat Light Soup — GH₵ 180
- Goat Okro Soup (With banku, semolina, or eba) — GH₵ 200
- Snapper Garden Eggs Stew — GH₵ 150
- Grilled Tilapia (With banku) — M: GH₵ 170 / L: GH₵ 200
- Special Gari Foto (Goat, chicken, grouper, snapper, beef — protein determines price)
- Chicken Light Soup — GH₵ 170
- Ebunuebunu / Green Soup (With goat: GH₵ 200 | With tilapia: GH₵ 200 | With chicken: GH₵ 130 | With dry fish: GH₵ 200 | With snapper: GH₵ 170)
- Assorted Soup / Ebunuebunu (Sails, dry fish, salmon) — GH₵ 300
- Assorted Okro — GH₵ 250
- Fish Palava (With yam, plantain, or cocoyam) — GH₵ 180
- Tilapia Soup — GH₵ 200
- Assorted Peanut Soup — GH₵ 250
- Fried Tilapia — GH₵ 170

BURGERS & SANDWICHES:
- Chicken Burger — GH₵ 150
- Beef Burger — GH₵ 150
- Cheese Burger — GH₵ 200
- Beef Wrap — GH₵ 140
- Chicken Wrap — GH₵ 140
- Vegetable Wrap — GH₵ 140
- Club Sandwich — GH₵ 150
- Tuna Sandwich — GH₵ 120
- Cheese Sandwich — GH₵ 140

PIZZA:
- MJ Lover's Rock Pizza — L: GH₵ 200 / M: GH₵ 150
- Chicken & Ham Pizza — L: GH₵ 150 / M: GH₵ 120
- Vegetarian Pizza — L: GH₵ 150 / M: GH₵ 130
- Beef & Mushroom Pizza — L: GH₵ 150 / M: GH₵ 130
- MJ Pepperoni Pizza — L: GH₵ 180 / M: GH₵ 150
- Seafood Pizza — L: GH₵ 250 / M: GH₵ 170
- Margherita Pizza — L: GH₵ 120 / M: GH₵ 100
- Hawaiian Pizza — L: GH₵ 170 / M: GH₵ 150

DESSERTS:
- Fruit Platter — GH₵ 80
- Fruit Salad — GH₵ 80
- Ice Cream — GH₵ 80
- Crumble Apple — GH₵ 80
- Mohalabia Milk Pudding — GH₵ 80
- Pan Cake — GH₵ 80
- Chris Cake — GH₵ 80
- American Cake — GH₵ 80

VEGETARIAN DISHES:
- Stir Fried Vegetables — GH₵ 90
- Sauteed Vegetables and Chickpeas — GH₵ 100
- Vegetable Soup — GH₵ 90
- Vegetarian Egusi Stew — GH₵ 90
- Pita Bread & Hummus — GH₵ 90
- Mix Vegetable Stew — GH₵ 90
- Beans Stew — GH₵ 120
- Spaghetti Pomodoro — GH₵ 150

SIDE ORDERS:
- Fried Rice — GH₵ 50
- Sauteed Potato — GH₵ 50
- Kelewele — GH₵ 40
- Jollof Rice — GH₵ 40
- Plain Rice — GH₵ 40
- Potato Chips — GH₵ 50
- Vegetable Rice — GH₵ 50
- Fried Plantain — GH₵ 40
- Banku — GH₵ 30
- Fried Yam — GH₵ 30
- Fufu — GH₵ 30

EXTRAS:
- Extra Stew — GH₵ 30
- Extra Vegetables — GH₵ 40
- Extra Pepper — GH₵ 20

TAKE-OUT PACKS:
- Take Away Pack — GH₵ 30
- Aluminium Pack — GH₵ 50
- Paper Bag — GH₵ 15

=== GUEST POLICIES (from /policy page) ===
"Thank you for choosing to stay at MJ Grand Hotel Ltd. Taking a room at our hotel means that you have accepted our terms and conditions and agree to the rate per night of our accommodation."

CHECK-IN & CHECK-OUT:
- Check-in time: 2:00 PM
- Check-out time: 12:00 noon
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

IN-ROOM SAFES:
- Each guest room is equipped with a secure in-room safe for storing luggage and valuables during their stay
- Guests are kindly advised to declare valuables during physical check-in at the Front Office for proper documentation and security purposes

LOST & FOUND:
- Any items found within the hotel premises will be recorded and stored in the Lost and Found department
- Unclaimed items will be kept for a period of six (6) months, after which they will be discarded if not claimed by the owner

SWIMMING POOL:
- Pool guard/lifeguard available by the pool
- Read pool safety notice carefully; keep away from the pool if you cannot swim
- No swimming after 6 PM unless authorized by Management

RESIDENTIAL CONFERENCE:
- Conference Start Time: 8:00 AM
- Conference Closing Time: 5:00 PM
- Any use of conference facilities beyond the scheduled closing time will attract an additional charge

CANCELLATION & AMENDMENTS:
{DYNAMIC_POLICIES}

REFUND:
- For refund requests, a 30% fee will be applied to the refund amount

FLYING OF DRONES:
- Not permitted unless authorized by Management

SUGGESTIONS & FEEDBACK:
- Email problems or suggestions to mj@mjgrandhotelghana.com or talk to Management
- Follow us on Instagram @mjgrand_hotel, Facebook MJ Grand, Twitter @MJGRANDHOTEL001, and TikTok @mj.grand.hotel

=== ACTIVE PROMOTIONS ===
{DYNAMIC_PROMOTIONS}

=== BOOKING SYSTEM ===
The hotel offers a full online booking system on the website:

HOW TO BOOK:
1. Visit the Booking page (/booking) on the website
2. Select check-in/check-out dates and number of guests (adults and children)
3. Optionally enter a promo code for discounts
4. Browse available rooms with real-time pricing
5. Optionally add extras (airport pickup, spa packages, etc.)
6. Enter guest details (name, email, phone, optional: nationality, flight itinerary, arrival time, special requests)
7. Pay securely online via Paystack (mobile money or card) or choose to pay at the hotel
8. Receive a booking confirmation with a reference code (format: MJ-XXXXXXXX)

BOOKING LOOKUP:
- Guests can check their booking status on the website
- They need their booking reference code (e.g., MJ-A1B2C3D4) to look up details
- The lookup shows: booking status, payment status, dates, room, total cost, and special requests
- Guests can also cancel bookings through the lookup page (subject to cancellation policy — at least 48 hours before check-in)

PAYMENT:
- All prices are in Ghana Cedis (GH₵)
- Online payment via Paystack (supports mobile money and card payments)
- Payment can also be made at the hotel upon arrival
- Payment statuses: pending, partial, paid, refunded, failed

BOOKING STATUSES:
- Pending: Booking created, awaiting confirmation
- Confirmed: Booking confirmed
- Cancelled: Booking was cancelled
- Completed: Guest has checked out
- No-show: Guest did not arrive

=== ADD-ONS (available during booking) ===
Guests can enhance their stay with optional add-ons when booking. Use the get_add_ons tool to show current options with prices. Common add-ons include airport pickup, spa treatments, and special arrangements.

=== WEBSITE NAVIGATION ===
Pages available on the MJ Grand Hotel website:
- Home (/) — Hero video banner with "Book Your Stay" and "View Rooms" CTAs, Rooms & Suites preview (live from database), Curated Experiences carousel (Spa, Dining, Rooftop, Cultural Journeys), Gallery, Contact form, Footer with newsletter signup
- About (/about) — Hotel introduction, Our Story, Elegant Accommodation features, Exceptional Facilities & Services, Commitment to Excellence, Core Values & Behaviors, booking CTA
- Dining (/dining) — Restaurant info & opening hours, Signature Highlights with images, Bar & Lounge, In-Room Dining, Private Dining & Events, Special Sunday Buffet (GH₵ 300/person — quote in USD with cedi equivalent), Culinary Commitment, Reserve a Table CTA (tel: 0573338062), link to full menu
- Menu (/menu) — Complete restaurant menu with all categories, descriptions, and prices (live from database with static fallback)
- Guest Services (/guest-services) — Hero section, 11 services grid (Breakfast, WiFi, Pool, Shuttle, Room Service, Laundry, Tea/Coffee, Conference, Gym, Catering, Outdoor Events), Guest Information (check-out time, complimentary water), In-House Directory (phone extensions), QR Code for quick access
- Policy (/policy) — All guest policies: Check-in/Check-out, Privacy & Security, Swimming Pool, In-Room Safes, Lost & Found, Residential Conference, Cancellation & Amendments, Refund, Drones, Suggestions & Feedback
- Booking (/booking) — Full 6-step booking flow: Date Selection → Room Selection → Add-ons → Guest Details → Payment → Confirmation
- Booking Lookup (/booking/lookup) — Check booking status and manage/cancel existing reservations using reference code

=== FOOTER (on all pages) ===
- Brand: MJ Grand Hotel
- Address: No. 460 Abotsi Street, East Legon, Accra - Ghana
- Phone: +233 302544212
- Email: mj@mjgrandhotelghana.com
- Quick Links: Rooms & Suites, Dining, Policy, About
- Newsletter signup: "Receive exclusive offers and updates from MJ Grand"
- Social: Instagram, Facebook, Twitter, TikTok
- Copyright: © 2026 MJ Grand Hotel. All rights reserved.

=== ADMIN DASHBOARD (internal — do not share details with guests) ===
The hotel uses a Booking Command Center (admin dashboard) at /admin for internal management. Staff roles include admin, revenue_manager, front_desk, and finance. This is NOT guest-facing information — never mention the dashboard, admin panel, or internal tools to guests.

=== RESTAURANT MENU (DYNAMIC — from database, overrides static menu above) ===
{DYNAMIC_MENU}`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description:
        "Create an escalation/support ticket for a guest issue that needs human attention. Always ask for the guest's room number before creating a ticket.",
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
          room_number: {
            type: "string",
            description: "The guest's room number for the team to locate them",
          },
        },
        required: ["issue", "urgency"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_available_rooms",
      description:
        "Search for available rooms for given dates and guest count. Returns room options with real-time pricing and availability.",
      parameters: {
        type: "object",
        properties: {
          check_in: {
            type: "string",
            description: "Check-in date in YYYY-MM-DD format",
          },
          check_out: {
            type: "string",
            description: "Check-out date in YYYY-MM-DD format",
          },
          adults: {
            type: "number",
            description: "Number of adults (default 1)",
          },
          children: {
            type: "number",
            description: "Number of children (default 0)",
          },
        },
        required: ["check_in", "check_out"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_add_ons",
      description:
        "Get the list of available booking add-ons (airport pickup, spa, etc.) with prices.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description:
        "Create a confirmed booking for a guest. Call this only after the guest has confirmed all details.",
      parameters: {
        type: "object",
        properties: {
          room_id: {
            type: "string",
            description: "The UUID of the selected room",
          },
          check_in: {
            type: "string",
            description: "Check-in date in YYYY-MM-DD format",
          },
          check_out: {
            type: "string",
            description: "Check-out date in YYYY-MM-DD format",
          },
          adults: {
            type: "number",
            description: "Number of adults",
          },
          children: {
            type: "number",
            description: "Number of children",
          },
          guest_name: {
            type: "string",
            description: "Full name of the guest",
          },
          guest_email: {
            type: "string",
            description: "Email address of the guest",
          },
          guest_phone: {
            type: "string",
            description: "Phone number of the guest",
          },
          special_requests: {
            type: "string",
            description: "Any special requests from the guest",
          },
          add_on_ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of add-on UUIDs the guest selected",
          },
          nightly_rate: {
            type: "number",
            description: "The nightly rate that was quoted to the guest",
          },
        },
        required: [
          "room_id",
          "check_in",
          "check_out",
          "adults",
          "guest_name",
          "guest_email",
          "guest_phone",
          "nightly_rate",
        ],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_booking",
      description:
        "Look up a booking by its reference code (e.g. MJ-A1B2C3D4). Returns booking details including status, dates, room, and payment info.",
      parameters: {
        type: "object",
        properties: {
          reference_code: {
            type: "string",
            description: "The booking reference code (e.g. MJ-A1B2C3D4)",
          },
        },
        required: ["reference_code"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_booking",
      description:
        "Cancel a confirmed booking by its reference code. Only works if the booking is confirmed/pending and at least 48 hours before check-in.",
      parameters: {
        type: "object",
        properties: {
          reference_code: {
            type: "string",
            description: "The booking reference code (e.g. MJ-A1B2C3D4)",
          },
        },
        required: ["reference_code"],
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
  urgency: string,
  roomNumber?: string
) {
  const referenceId = `MJ-${Math.floor(10000 + Math.random() * 90000)}`;
  const insertPayload: any = {
    guest_id: guestId,
    issue,
    urgency,
    reference_id: referenceId,
  };
  if (roomNumber) insertPayload.room_number = roomNumber;

  const { data, error } = await supabase.from("support_tickets").insert(insertPayload).select().single();

  if (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: error.message };
  }
  return { success: true, reference_id: referenceId, ticket_id: data.id };
}

// --- Booking Tools ---
async function searchAvailableRooms(
  supabase: any,
  checkIn: string,
  checkOut: string,
  adults: number = 1,
  children: number = 0
) {
  // Fetch active rooms that fit guest count
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_active", true)
    .gte("max_adults", adults)
    .gte("max_children", children)
    .order("sort_order", { ascending: true });

  if (roomsError) {
    console.error("Error fetching rooms:", roomsError);
    return { success: false, error: "Unable to fetch rooms" };
  }

  if (!rooms || rooms.length === 0) {
    return { success: true, rooms: [], message: "No rooms available for the specified guest count." };
  }

  // Calculate number of nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return { success: false, error: "Check-out must be after check-in." };
  }

  // Generate date range
  const dates: string[] = [];
  const d = new Date(checkIn);
  while (d < checkOutDate) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }

  // Fetch inventory for these rooms and dates
  const roomIds = rooms.map((r: any) => r.id);
  const { data: inventory } = await supabase
    .from("room_inventory")
    .select("*")
    .in("room_id", roomIds)
    .in("date", dates);

  // Build availability map
  const invMap = new Map<string, any>();
  if (inventory) {
    for (const inv of inventory) {
      invMap.set(`${inv.room_id}_${inv.date}`, inv);
    }
  }

  const availableRooms = rooms.map((room: any) => {
    let available = true;
    let minAvailable = Infinity;
    let totalRate = 0;

    for (const date of dates) {
      const inv = invMap.get(`${room.id}_${date}`);
      if (inv) {
        if (inv.is_closed || inv.booked_count >= inv.total_count) {
          available = false;
          break;
        }
        minAvailable = Math.min(minAvailable, inv.total_count - inv.booked_count);
        totalRate += inv.rate_override ?? room.base_price_ghs;
      } else {
        // No inventory record = use base price, assume available
        totalRate += room.base_price_ghs;
      }
    }

    if (!available) return null;

    const avgNightlyRate = Math.round(totalRate / nights);
    const totalPrice = totalRate;

    return {
      room_id: room.id,
      name: room.name,
      slug: room.slug,
      description: room.description,
      bed_type: room.bed_type,
      size_sqm: room.size_sqm,
      amenities: room.amenities,
      nightly_rate_ghs: avgNightlyRate,
      total_price_ghs: Math.round(totalPrice),
      nights,
      rooms_left: minAvailable === Infinity ? "plenty" : minAvailable,
    };
  }).filter(Boolean);

  return {
    success: true,
    check_in: checkIn,
    check_out: checkOut,
    nights,
    adults,
    children,
    rooms: availableRooms,
  };
}

async function getAddOns(supabase: any) {
  const { data, error } = await supabase
    .from("add_ons")
    .select("id, name, description, price_ghs, icon, category")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching add-ons:", error);
    return { success: false, error: "Unable to fetch add-ons" };
  }

  return { success: true, add_ons: data || [] };
}

async function createBooking(
  supabase: any,
  args: {
    room_id: string;
    check_in: string;
    check_out: string;
    adults: number;
    children?: number;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    special_requests?: string;
    add_on_ids?: string[];
    nightly_rate: number;
  }
) {
  // Calculate nights
  const checkInDate = new Date(args.check_in);
  const checkOutDate = new Date(args.check_out);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return { success: false, error: "Invalid dates" };
  }

  // Upsert guest
  const { data: guestData, error: guestError } = await supabase
    .from("guests")
    .upsert(
      { full_name: args.guest_name, email: args.guest_email, phone: args.guest_phone },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (guestError) {
    console.error("Guest upsert error:", guestError);
    return { success: false, error: "Unable to create guest record" };
  }

  const baseTotalGhs = args.nightly_rate * nights;

  // Fetch add-ons if any
  let addOnsTotal = 0;
  let addOnRecords: any[] = [];
  if (args.add_on_ids && args.add_on_ids.length > 0) {
    const { data: addOns } = await supabase
      .from("add_ons")
      .select("id, name, price_ghs")
      .in("id", args.add_on_ids);

    if (addOns) {
      addOnRecords = addOns;
      addOnsTotal = addOns.reduce((sum: number, a: any) => sum + a.price_ghs, 0);
    }
  }

  const finalTotal = baseTotalGhs + addOnsTotal;
  const refCode = "MJ-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      reference_code: refCode,
      guest_id: guestData.id,
      room_id: args.room_id,
      check_in: args.check_in,
      check_out: args.check_out,
      adults: args.adults,
      children: args.children || 0,
      base_total_ghs: baseTotalGhs,
      add_ons_total_ghs: addOnsTotal,
      discount_ghs: 0,
      final_total_ghs: finalTotal,
      special_requests: args.special_requests || null,
      status: "confirmed",
      payment_status: "pending",
      booking_source: "mj-ai",
    })
    .select("id")
    .single();

  if (bookingError) {
    console.error("Booking creation error:", bookingError);
    return { success: false, error: "Unable to create booking" };
  }

  // Increment room_inventory.booked_count for each night
  const dates: string[] = [];
  const d = new Date(args.check_in);
  while (d < checkOutDate) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }

  for (const date of dates) {
    const { data: inv } = await supabase
      .from("room_inventory")
      .select("id, booked_count")
      .eq("room_id", args.room_id)
      .eq("date", date)
      .maybeSingle();

    if (inv) {
      await supabase.from("room_inventory").update({ booked_count: inv.booked_count + 1 }).eq("id", inv.id);
    } else {
      await supabase.from("room_inventory").insert({ room_id: args.room_id, date, total_count: 1, booked_count: 1 });
    }
  }

  // Insert add-ons
  if (addOnRecords.length > 0 && booking) {
    await supabase.from("booking_add_ons").insert(
      addOnRecords.map((a: any) => ({
        booking_id: booking.id,
        add_on_id: a.id,
        quantity: 1,
        unit_price_ghs: a.price_ghs,
        total_price_ghs: a.price_ghs,
      }))
    );
  }

  // Fetch room name for confirmation
  const { data: roomData } = await supabase
    .from("rooms")
    .select("name")
    .eq("id", args.room_id)
    .single();

  return {
    success: true,
    reference_code: refCode,
    room_name: roomData?.name || "Room",
    check_in: args.check_in,
    check_out: args.check_out,
    nights,
    adults: args.adults,
    children: args.children || 0,
    base_total_ghs: baseTotalGhs,
    add_ons_total_ghs: addOnsTotal,
    final_total_ghs: finalTotal,
    add_ons: addOnRecords.map((a: any) => a.name),
    payment_status: "pending",
    message: `Booking confirmed! Reference: ${refCode}. Total: GHS ${finalTotal}. Payment can be made at the hotel or online.`,
  };
}

async function lookupBooking(supabase: any, referenceCode: string) {
  const ref = referenceCode.trim().toUpperCase();
  if (!ref || !ref.startsWith("MJ-")) {
    return { success: false, error: "Invalid reference code format. It should start with MJ-" };
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("reference_code, status, payment_status, booking_source, ota_reference, check_in, check_out, adults, children, final_total_ghs, base_total_ghs, add_ons_total_ghs, special_requests, arrival_time, created_at, rooms(name), guests(full_name, email)")
    .eq("reference_code", ref)
    .maybeSingle();

  if (error) {
    console.error("Booking lookup error:", error);
    return { success: false, error: "Unable to look up booking" };
  }

  if (!data) {
    return { success: false, error: `No booking found with reference ${ref}` };
  }

  return {
    success: true,
    booking: {
      reference_code: data.reference_code,
      status: data.status,
      payment_status: data.payment_status,
      booking_source: (data as any).booking_source ?? "direct",
      ota_reference: (data as any).ota_reference ?? null,
      check_in: data.check_in,
      check_out: data.check_out,
      adults: data.adults,
      children: data.children,
      room_name: (data as any).rooms?.name || "Room",
      guest_name: (data as any).guests?.full_name || "Guest",
      base_total_ghs: data.base_total_ghs,
      add_ons_total_ghs: data.add_ons_total_ghs,
      final_total_ghs: data.final_total_ghs,
      special_requests: data.special_requests,
      arrival_time: data.arrival_time,
      created_at: data.created_at,
    },
  };
}

async function cancelBooking(supabase: any, referenceCode: string) {
  const ref = referenceCode.trim().toUpperCase();
  if (!ref || !ref.startsWith("MJ-")) {
    return { success: false, error: "Invalid reference code format." };
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, status, check_in, room_id")
    .eq("reference_code", ref)
    .maybeSingle();

  if (error || !booking) {
    return { success: false, error: `No booking found with reference ${ref}` };
  }

  if (booking.status !== "confirmed" && booking.status !== "pending") {
    return { success: false, error: `Booking is already ${booking.status} and cannot be cancelled.` };
  }

  const checkInDate = new Date(booking.check_in);
  const hoursUntil = (checkInDate.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 48) {
    return { success: false, error: "Cancellation is only allowed at least 48 hours before check-in." };
  }

  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);

  // Decrement room_inventory for each night
  const { data: fullBooking } = await supabase
    .from("bookings")
    .select("room_id, check_in, check_out")
    .eq("id", booking.id)
    .single();

  if (fullBooking) {
    const ciDate = new Date(fullBooking.check_in);
    const coDate = new Date(fullBooking.check_out);
    const dt = new Date(ciDate);
    while (dt < coDate) {
      const dateStr = dt.toISOString().split("T")[0];
      const { data: inv } = await supabase
        .from("room_inventory")
        .select("id, booked_count")
        .eq("room_id", fullBooking.room_id)
        .eq("date", dateStr)
        .maybeSingle();
      if (inv && inv.booked_count > 0) {
        await supabase.from("room_inventory").update({ booked_count: inv.booked_count - 1 }).eq("id", inv.id);
      }
      dt.setDate(dt.getDate() + 1);
    }
  }

  return { success: true, reference_code: ref, message: `Booking ${ref} has been cancelled successfully.` };
}

// --- Currency helpers (USD primary, GH₵ equivalent) ---
let cachedRate: { rate: number; fetchedAt: number } | null = null;
const RATE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getUsdToGhsRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < RATE_TTL_MS) {
    return cachedRate.rate;
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data?.rates?.GHS) {
      cachedRate = { rate: data.rates.GHS, fetchedAt: Date.now() };
      return cachedRate.rate;
    }
  } catch (e) {
    console.error("FX fetch failed:", e);
  }
  return cachedRate?.rate ?? 16;
}

function ghsToUsd(ghs: number, rate: number): number {
  return Math.max(1, Math.round(ghs / rate));
}

function fmtPrice(ghs: number, rate: number): string {
  return `$${ghsToUsd(ghs, rate).toLocaleString()} (≈ GH₵ ${Math.round(ghs).toLocaleString()})`;
}

/** Rewrite "GH₵ 150" / "GHS 150" / "GH? 150" tokens in free-text to "$X (≈ GH₵ 150)". */
function convertGhsTokensToDual(text: string, rate: number): string {
  return text.replace(/GH[₵CcSs]?\s?(\d{1,3}(?:,\d{3})*|\d+)/g, (_m, num) => {
    const ghs = parseInt(String(num).replace(/,/g, ""), 10);
    if (Number.isNaN(ghs)) return _m;
    return fmtPrice(ghs, rate);
  });
}

// --- Dynamic Knowledge Base Builder ---
async function buildDynamicContext(supabase: any, rate: number): Promise<string> {
  let prompt = SYSTEM_PROMPT.replaceAll("{LIVE_FX_RATE}", rate.toFixed(2));


  // Fetch active rooms
  try {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("name, base_price_ghs, description, bed_type, size_sqm, amenities, max_adults, max_children")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (rooms && rooms.length > 0) {
      const roomsText = "ROOM TYPES (live from database):\n" + rooms.map((r: any, i: number) => {
        let line = `${i + 1}. ${r.name} — From ${fmtPrice(Number(r.base_price_ghs), rate)}/night`;
        if (r.description) line += `: ${r.description}`;
        if (r.bed_type) line += ` | Bed: ${r.bed_type}`;
        if (r.size_sqm) line += ` | ${r.size_sqm} sqm`;
        if (r.max_adults) line += ` | Max: ${r.max_adults} adults, ${r.max_children} children`;
        if (r.amenities?.length) line += ` | Amenities: ${r.amenities.join(", ")}`;
        return line;
      }).join("\n");
      prompt = prompt.replace("{DYNAMIC_ROOMS}", roomsText);
    } else {
      prompt = prompt.replace("{DYNAMIC_ROOMS}", "Room information is currently being updated. Tell guests to contact reception.");
    }
  } catch {
    prompt = prompt.replace("{DYNAMIC_ROOMS}", "Room information temporarily unavailable.");
  }

  // Fetch active promotions
  try {
    const { data: promos } = await supabase
      .from("promotions")
      .select("code, description, discount_type, discount_value, end_date, room_restrictions, rooms:room_restrictions(name)")
      .eq("is_active", true);

    if (promos && promos.length > 0) {
      const now = new Date().toISOString().split("T")[0];
      const activePromos = promos.filter((p: any) => !p.end_date || p.end_date >= now);
      if (activePromos.length > 0) {
        const promosText = activePromos.map((p: any) => {
          const discount = p.discount_type === "percentage" ? `${p.discount_value}% off` : `${fmtPrice(Number(p.discount_value), rate)} off`;
          let line = `- Code: ${p.code} — ${discount}`;
          if (p.description) line += ` (${p.description})`;
          if (p.end_date) line += ` | Valid until ${p.end_date}`;
          return line;
        }).join("\n");
        prompt = prompt.replace("{DYNAMIC_PROMOTIONS}", "Current active promotions guests can use when booking:\n" + promosText + "\nIf a guest asks about deals or discounts, share these codes proactively.");
      } else {
        prompt = prompt.replace("{DYNAMIC_PROMOTIONS}", "No active promotions at this time.");
      }
    } else {
      prompt = prompt.replace("{DYNAMIC_PROMOTIONS}", "No active promotions at this time.");
    }
  } catch {
    prompt = prompt.replace("{DYNAMIC_PROMOTIONS}", "Promotion information temporarily unavailable.");
  }

  // Fetch cancellation policies
  try {
    const { data: policies } = await supabase
      .from("cancellation_policies")
      .select("name, description, deadline_hours, refund_percentage, is_default")
      .order("deadline_hours", { ascending: true });

    if (policies && policies.length > 0) {
      const policiesText = policies.map((p: any) => {
        let line = `- ${p.name}: Cancellations must be made at least ${p.deadline_hours} hours before arrival. Refund: ${p.refund_percentage}%.`;
        if (p.description) line += ` ${p.description}`;
        if (p.is_default) line += " (Default policy)";
        return line;
      }).join("\n");
      prompt = prompt.replace("{DYNAMIC_POLICIES}", policiesText);
    } else {
      prompt = prompt.replace("{DYNAMIC_POLICIES}", "- Cancellations or amendments must be made at least 72 hours before arrival\n- Refunds incur a 30% charge, inclusive of applicable government taxes\n- No-show results in a 100% charge (inclusive of applicable government taxes)");
    }
  } catch {
    prompt = prompt.replace("{DYNAMIC_POLICIES}", "- Cancellations or amendments must be made at least 72 hours before arrival\n- Refunds incur a 30% charge\n- No-show results in a 100% charge");
  }

  // Fetch menu items
  try {
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("category, name, description, price")
      .eq("is_active", true)
      .order("category")
      .order("sort_order", { ascending: true });

    if (menuItems && menuItems.length > 0) {
      const grouped: Record<string, any[]> = {};
      for (const item of menuItems) {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      }
      const menuText = Object.entries(grouped).map(([cat, items]) => {
        const itemLines = items.map((i: any) => {
          let line = `- ${i.name}`;
          if (i.description) line += ` (${i.description})`;
          if (i.price) line += ` — ${convertGhsTokensToDual(String(i.price), rate)}`;
          return line;
        }).join("\n");
        return `${cat.toUpperCase()}:\n${itemLines}`;
      }).join("\n\n");
      prompt = prompt.replace("{DYNAMIC_MENU}", `Prices shown as "$X (≈ GH₵ Y)" using live FX rate 1 USD = ${rate.toFixed(2)} GHS:\n\n` + menuText);
    } else {
      prompt = prompt.replace("{DYNAMIC_MENU}", "Menu is currently being updated. Tell guests to contact the restaurant directly.");
    }
  } catch {
    prompt = prompt.replace("{DYNAMIC_MENU}", "Menu information temporarily unavailable.");
  }

  return prompt;
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
    // Build dynamic system prompt with live DB data
    const dynamicPrompt = await buildDynamicContext(supabase);
    const systemPrompt = dynamicPrompt + memoryContext +
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
          result = await createSupportTicket(supabase, guest_id, args.issue, args.urgency, args.room_number);
        } else if (tc.function.name === "search_available_rooms") {
          result = await searchAvailableRooms(
            supabase,
            args.check_in,
            args.check_out,
            args.adults || 1,
            args.children || 0
          );
        } else if (tc.function.name === "get_add_ons") {
          result = await getAddOns(supabase);
        } else if (tc.function.name === "create_booking") {
          result = await createBooking(supabase, args);
        } else if (tc.function.name === "lookup_booking") {
          result = await lookupBooking(supabase, args.reference_code);
        } else if (tc.function.name === "cancel_booking") {
          result = await cancelBooking(supabase, args.reference_code);
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
