
-- Seed rooms data
INSERT INTO public.rooms (name, slug, description, size_sqm, bed_type, max_adults, max_children, base_price_ghs, amenities, images, sort_order) VALUES
('Deluxe Room', 'deluxe-room', 'Mediterranean charm meets modern comfort with terrace access. Enjoy a spacious retreat with premium linens, a work desk, and complimentary Wi-Fi.', 35, 'King Bed', 2, 1, 800, ARRAY['Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Room Service', 'Flat Screen TV', 'Safe'], ARRAY['/room-deluxe.jpg'], 1),
('Ocean Suite', 'ocean-suite', 'Panoramic ocean views with private balcony and luxurious amenities. A separate living area, rain shower, and premium toiletries elevate your stay.', 55, 'King Bed', 2, 2, 1200, ARRAY['Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Room Service', 'Flat Screen TV', 'Safe', 'Balcony', 'Ocean View', 'Bathtub'], ARRAY['/room-suite.jpg'], 2),
('Presidential Penthouse', 'presidential-penthouse', 'The pinnacle of luxury with panoramic city and ocean vistas. Features a private dining area, butler service, and exclusive lounge access.', 120, 'Super King Bed', 4, 2, 3500, ARRAY['Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Room Service', 'Flat Screen TV', 'Safe', 'Balcony', 'Ocean View', 'Bathtub', 'Living Room', 'Butler Service', 'Lounge Access'], ARRAY['/room-penthouse.jpg'], 3);

-- Seed add-ons
INSERT INTO public.add_ons (name, description, price_ghs, icon, category, sort_order) VALUES
('Airport Pickup', 'Private car transfer from Kotoka International Airport', 250, 'car', 'transport', 1),
('Breakfast Package', 'Daily full breakfast buffet for duration of stay', 120, 'utensils', 'dining', 2),
('Romantic Setup', 'Rose petals, champagne, candles, and chocolate platter', 500, 'heart', 'experience', 3),
('Early Check-in', 'Check in from 8:00 AM (subject to availability)', 150, 'clock', 'convenience', 4),
('Late Checkout', 'Extend your checkout until 4:00 PM', 150, 'clock', 'convenience', 5),
('Spa Package', 'One-hour full body massage and spa access', 400, 'sparkles', 'wellness', 6);

-- Seed cancellation policies
INSERT INTO public.cancellation_policies (name, description, refund_percentage, deadline_hours, is_default) VALUES
('Flexible', 'Free cancellation up to 48 hours before check-in. Full refund.', 100, 48, true),
('Non-Refundable', 'No refund upon cancellation. Best rate guaranteed.', 0, 0, false);

-- Seed room inventory for next 90 days (3 rooms × 90 days)
INSERT INTO public.room_inventory (room_id, date, total_count, booked_count)
SELECT r.id, d.date, 
  CASE WHEN r.slug = 'deluxe-room' THEN 10
       WHEN r.slug = 'ocean-suite' THEN 5
       ELSE 2 END,
  0
FROM public.rooms r
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', '1 day'::INTERVAL) AS d(date);
