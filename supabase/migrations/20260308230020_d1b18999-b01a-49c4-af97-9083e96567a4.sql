-- Menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Public read access for active items
CREATE POLICY "Anyone can view active menu items"
  ON public.menu_items FOR SELECT
  USING (is_active = true);

-- Admin full access via has_role
CREATE POLICY "Admins can manage menu items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed all existing menu data
INSERT INTO public.menu_items (category, name, description, price, sort_order) VALUES
-- Hot Appetizers
('Hot Appetizers', 'Spicy Chicken Wings', 'Juicy fried chicken wings in hot green chilli sauce', 'GH₵ 90', 1),
('Hot Appetizers', 'Beef Cocktail Khebab', 'Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato', 'GH₵ 100', 2),
('Hot Appetizers', 'Beef Samosa', 'Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato', 'GH₵ 80', 3),
('Hot Appetizers', 'Hot Chilli Gizzard', 'Chilli sauce, tender fried gizzard', 'GH₵ 85', 4),
('Hot Appetizers', 'Honey Glazed Chicken Wings', 'Juicy fried chicken wings in spicy honey', 'GH₵ 90', 5),
('Hot Appetizers', 'Golden Fried Prawns', 'Marinated prawns, bread crumbs, cocktail sauce', 'GH₵ 120', 6),
('Hot Appetizers', 'Goat Meat Pepper Soup', 'Goat meat pieces, hot pepper soup stock (serve with bread rolls)', 'GH₵ 150', 7),
('Hot Appetizers', 'Chicken Cocktail Kebab', 'Tender chicken, white pepper grilled bell pepper, onion & tomato', 'GH₵ 120', 8),
('Hot Appetizers', 'Shrimps Avocado Cocktail', 'Spicy steamed shrimps, cocktail sauce, lettuce, cucumber, fresh tomato, celery', 'GH₵ 120', 9),
('Hot Appetizers', 'Chicken Pepper Soup', 'Diced chicken, hot pepper soup stock (serve with bread rolls)', 'GH₵ 120', 10),
('Hot Appetizers', 'Mix Vegetable Soup', 'Mushroom, carrot, french beans, zucchini, cabbage, pumpkin, vegetables stock, bouquet-garni (serve with bread rolls)', 'GH₵ 120', 11),
('Hot Appetizers', 'Pumpkin Soup', 'Vegetables stock, pumpkin, bouquet (serve with bread rolls)', 'GH₵ 100', 12),
-- Salads
('Salads', 'Chef''s Salad', 'Lettuce, tomato, carrot, cucumber, onions, chicken flakes, black olives, boiled egg, sliced apple', 'GH₵ 150', 1),
('Salads', 'MJ Special Salad', 'Lettuce, fresh tomato, carrot, cucumber, onions, chicken flakes, beef flakes, shrimps, boiled egg, black olives', 'GH₵ 200', 2),
('Salads', 'Seafood Salad', 'Prawns, squid, grouper fish, lettuce, fresh tomato, carrot, cucumber, onions, tartar sauce', 'GH₵ 250', 3),
('Salads', 'Greek Salad', 'Lettuce, fresh tomato, cucumber, onions, black olives, feta cheese, vinaigrette dressing', 'GH₵ 110', 4),
('Salads', 'Ghanaian Salad', 'Lettuce, carrot, cucumber, onions, boiled egg, baked beans, sardine, fresh tomato, black olives', 'GH₵ 200', 5),
('Salads', 'Tuna Salad', 'Chunk tuna, lettuce, fresh tomato, onions, cucumber, carrot, olive oil, white pepper, black olive', 'GH₵ 120', 6),
('Salads', 'Potato Salad', 'Potatoes, cucumber, carrot, green bell pepper, onions, egg', 'GH₵ 100', 7),
('Salads', 'Chicken Caesar Salad', 'Lettuce, sun-dried tomatoes, onions, grilled chicken flakes, black olives, parmesan cheese, croutons', 'GH₵ 120', 8),
-- Chicken Meals
('Chicken Meals', 'Spicy Grilled Chicken', '', 'GH₵ 150', 1),
('Chicken Meals', 'Hawaiian Chicken Khebeb', '', 'GH₵ 150', 2),
('Chicken Meals', 'Chicken Alfredo', '', 'GH₵ 180', 3),
('Chicken Meals', 'Chicken Khebab', '', 'GH₵ 130', 4),
('Chicken Meals', 'Chicken Fried Rice', '', 'GH₵ 160', 5),
('Chicken Meals', 'Chicken Soup', '', 'GH₵ 180', 6),
('Chicken Meals', 'Spicy Turkey Wings', '', 'GH₵ 150', 7),
('Chicken Meals', 'Grilled/Fried Chicken Breast', '', 'GH₵ 150', 8),
('Chicken Meals', 'Chicken Breast Veg Stir Fry', '', 'GH₵ 150', 9),
('Chicken Meals', 'Shredded Chicken Sauce', '', 'GH₵ 150', 10),
('Chicken Meals', 'Chicken Provençal', '', 'GH₵ 180', 11),
('Chicken Meals', 'Saucy Chicken Pasta', '', 'GH₵ 180', 12),
-- Kids Meals
('Kids Meals', 'Crispy Chicken Fingers', '', 'GH₵ 100', 1),
('Kids Meals', 'Diced Chicken & Pasta in Tomato Sauce', '', 'GH₵ 150', 2),
('Kids Meals', 'Mini-Chicken & Rice', '', 'GH₵ 120', 3),
-- Fish Meals
('Fish Meals', 'Grilled/Fried Casava Fish', '', 'GH₵ 170', 1),
('Fish Meals', 'Grilled/Fried Grouper Fillet', 'Ginger, garlic, complete seasoning, lemon juice, mustard, fresh parsley', 'GH₵ 200', 2),
('Fish Meals', 'Grilled/Fried Tilapia', 'Black pepper, cayenne pepper, ginger, garlic, lemon juice', 'M: GH₵ 150 / L: GH₵ 200', 3),
('Fish Meals', 'Fish Fingers', 'Shredded grouper fillet, ginger, garlic, white pepper, egg, breadcrumbs', 'GH₵ 200', 4),
('Fish Meals', 'Grilled/Fried Snapper Fish', '', 'GH₵ 150', 5),
('Fish Meals', 'Fish Khebab', 'Grouper fillet, ginger, garlic, white pepper, grilled onions, green bell pepper & tomato', 'GH₵ 200', 6),
('Fish Meals', 'Breaded Fish Fillet', 'White pepper, ginger, garlic, breadcrumbs', 'GH₵ 200', 7),
('Fish Meals', 'Grilled/Fried Barracuba Fish', '', 'GH₵ 180', 8),
('Fish Meals', 'Tilapia Stew', 'Tomato sauce, carrot, zucchini, bell pepper, white wine', 'GH₵ 200', 9),
('Fish Meals', 'Grouper Provençal', '', 'GH₵ 200', 10),
('Fish Meals', 'Snapper Provençal', '', 'GH₵ 150', 11),
-- Beef Meals
('Beef Meals', 'Beef Pepper Steak', 'Beef fillet, mustard, black pepper, salt, grilled tomato, onion ring', 'GH₵ 190', 1),
('Beef Meals', 'MJ Mixed Grill', 'Goat meat, beef, chicken, sausage, vegetable, fried egg', 'GH₵ 220', 2),
('Beef Meals', 'Beef Provençal', 'Juicy fried beef, fresh tomato sauce, vegetables, red wine', 'GH₵ 200', 3),
('Beef Meals', 'Grilled T-Bone Steak', 'Bone-in tenderloin, garlic/ginger powder, mustard, salt, black pepper', 'GH₵ 200', 4),
('Beef Meals', 'Shredded Beef Sauce', 'Shredded beef fillet, carrot, onions, bell pepper, oyster sauce, butter, soy sauce', 'GH₵ 190', 5),
('Beef Meals', 'Grilled Goat', '', 'GH₵ 200', 6),
('Beef Meals', 'Assorted Meat Pot', 'Goat, meat, beef', 'GH₵ 180', 7),
('Beef Meals', 'Hawaiian Beef Khebab', '', 'GH₵ 150', 8),
('Beef Meals', 'Beef Stroganoff', '', 'GH₵ 180', 9),
('Beef Meals', 'Saucy Beef Pasta', '', 'GH₵ 190', 10),
-- Seafood
('Seafood', 'Mediterranean Seafood', '', 'GH₵ 250', 1),
('Seafood', 'Stir Fried Seafood', '', 'GH₵ 250', 2),
('Seafood', 'Grilled Prawns', '', 'GH₵ 200', 3),
('Seafood', 'Saucy Shrimps & Pasta', '', 'GH₵ 200', 4),
('Seafood', 'Fisherman''s Basket', '', 'GH₵ 250', 5),
('Seafood', 'Lobster Thermidor', '', 'GH₵ 250', 6),
('Seafood', 'Grilled Lobster', '', 'GH₵ 250', 7),
('Seafood', 'Shrimps Sauce', '', 'GH₵ 180', 8),
('Seafood', 'Shrimps Fried Rice', '', 'GH₵ 170', 9),
('Seafood', 'Fisherman''s Soup', '', 'GH₵ 250', 10),
('Seafood', 'Shrimps Spaghetti Royal', '', 'GH₵ 200', 11),
-- MJ Specials
('MJ Specials', 'MJ Fried Rice', 'Shredded beef, chicken, sausage, egg', 'GH₵ 150', 1),
('MJ Specials', 'MJ Jollof Rice', 'Shredded beef, chicken, sausage, egg', 'GH₵ 150', 2),
('MJ Specials', 'Boatemaa''s Special', 'Beef, chicken, sausage, shrimps, eggs', 'GH₵ 200', 3),
('MJ Specials', 'Pork Chops', '', 'GH₵ 250', 4),
('MJ Specials', 'Lamb Chops', '', 'GH₵ 250', 5),
('MJ Specials', 'Egg Fried Rice', '', 'GH₵ 100', 6),
('MJ Specials', 'MJ Beef Fried Rice', '', 'GH₵ 190', 7),
('MJ Specials', 'MJ Assorted Pasta', '', 'GH₵ 200', 8),
('MJ Specials', 'MJ Beef Jollof Rice', '', 'GH₵ 190', 9),
-- Local Dishes
('Local Dishes', 'Goat Light Soup', '', 'GH₵ 180', 1),
('Local Dishes', 'Goat Okro Soup', 'With banku, semolina, or eba', 'GH₵ 200', 2),
('Local Dishes', 'Snapper Garden Eggs Stew', '', 'GH₵ 150', 3),
('Local Dishes', 'Grilled Tilapia', 'With banku', 'M: GH₵ 170 / L: GH₵ 200', 4),
('Local Dishes', 'Special Gari Foto', 'Goat, chicken, grouper, snapper, beef. Protein will determine the price', '', 5),
('Local Dishes', 'Chicken Light Soup', '', 'GH₵ 170', 6),
('Local Dishes', 'Ebunuebunu (Green Soup)', 'With goat: GH₵ 200 | With tilapia: GH₵ 200 | With chicken: GH₵ 130 | With dry fish: GH₵ 200 | With snapper: GH₵ 170', '', 7),
('Local Dishes', 'Assorted Soup / Ebunuebunu', 'Sails, dry fish, salmon', 'GH₵ 300', 8),
('Local Dishes', 'Assorted Okro', '', 'GH₵ 250', 9),
('Local Dishes', 'Fish Palava', 'With yam, plantain, or cocoyam', 'GH₵ 180', 10),
('Local Dishes', 'Tilapia Soup', '', 'GH₵ 200', 11),
('Local Dishes', 'Assorted Peanut Soup', '', 'GH₵ 250', 12),
('Local Dishes', 'Fried Tilapia', '', 'GH₵ 170', 13),
-- Burgers & Sandwiches
('Burgers & Sandwiches', 'Chicken Burger', '', 'GH₵ 150', 1),
('Burgers & Sandwiches', 'Beef Burger', '', 'GH₵ 150', 2),
('Burgers & Sandwiches', 'Cheese Burger', '', 'GH₵ 200', 3),
('Burgers & Sandwiches', 'Beef Wrap', '', 'GH₵ 140', 4),
('Burgers & Sandwiches', 'Chicken Wrap', '', 'GH₵ 140', 5),
('Burgers & Sandwiches', 'Vegetable Wrap', '', 'GH₵ 140', 6),
('Burgers & Sandwiches', 'Club Sandwich', '', 'GH₵ 150', 7),
('Burgers & Sandwiches', 'Tuna Sandwich', '', 'GH₵ 120', 8),
('Burgers & Sandwiches', 'Cheese Sandwich', '', 'GH₵ 140', 9),
-- Pizza
('Pizza', 'MJ Lover''s Rock Pizza', '', 'L: GH₵ 200 / M: GH₵ 150', 1),
('Pizza', 'Chicken & Ham Pizza', '', 'L: GH₵ 150 / M: GH₵ 120', 2),
('Pizza', 'Vegetarian Pizza', '', 'L: GH₵ 150 / M: GH₵ 130', 3),
('Pizza', 'Beef & Mushroom Pizza', '', 'L: GH₵ 150 / M: GH₵ 130', 4),
('Pizza', 'MJ Pepperoni Pizza', '', 'L: GH₵ 180 / M: GH₵ 150', 5),
('Pizza', 'Seafood Pizza', '', 'L: GH₵ 250 / M: GH₵ 170', 6),
('Pizza', 'Margherita Pizza', '', 'L: GH₵ 120 / M: GH₵ 100', 7),
('Pizza', 'Hawaiian Pizza', '', 'L: GH₵ 170 / M: GH₵ 150', 8),
-- Vegetarian
('Vegetarian', 'Stir Fried Vegetables', '', 'GH₵ 90', 1),
('Vegetarian', 'Sauteed Vegetables and Chickpeas', '', 'GH₵ 100', 2),
('Vegetarian', 'Vegetable Soup', '', 'GH₵ 90', 3),
('Vegetarian', 'Vegetarian Egusi Stew', '', 'GH₵ 90', 4),
('Vegetarian', 'Pita Bread & Hummus', '', 'GH₵ 90', 5),
('Vegetarian', 'Mix Vegetable Stew', '', 'GH₵ 90', 6),
('Vegetarian', 'Beans Stew', '', 'GH₵ 120', 7),
('Vegetarian', 'Spaghetti Pomodoro', '', 'GH₵ 150', 8),
-- Desserts
('Desserts', 'Fruit Platter', '', 'GH₵ 80', 1),
('Desserts', 'Fruit Salad', '', 'GH₵ 80', 2),
('Desserts', 'Ice Cream', '', 'GH₵ 80', 3),
('Desserts', 'Crumble Apple', '', 'GH₵ 80', 4),
('Desserts', 'Mohalabia Milk Pudding', '', 'GH₵ 80', 5),
('Desserts', 'Pan Cake', '', 'GH₵ 80', 6),
('Desserts', 'Chris Cake', '', 'GH₵ 80', 7),
('Desserts', 'American Cake', '', 'GH₵ 80', 8),
-- Extras
('Extras', 'Extra Stew', '', 'GH₵ 30', 1),
('Extras', 'Extra Vegetables', '', 'GH₵ 40', 2),
('Extras', 'Extra Pepper', '', 'GH₵ 20', 3),
-- Side Orders
('Side Orders', 'Fried Rice', '', 'GH₵ 50', 1),
('Side Orders', 'Sauteed Potato', '', 'GH₵ 50', 2),
('Side Orders', 'Kelewele', '', 'GH₵ 40', 3),
('Side Orders', 'Jollof Rice', '', 'GH₵ 40', 4),
('Side Orders', 'Plain Rice', '', 'GH₵ 40', 5),
('Side Orders', 'Potato Chips', '', 'GH₵ 50', 6),
('Side Orders', 'Vegetable Rice', '', 'GH₵ 50', 7),
('Side Orders', 'Fried Plantain', '', 'GH₵ 40', 8),
('Side Orders', 'Banku', '', 'GH₵ 30', 9),
('Side Orders', 'Fried Yam', '', 'GH₵ 30', 10),
('Side Orders', 'Fufu', '', 'GH₵ 30', 11),
-- Take Out Packs
('Take Out Packs', 'Take Away Pack', '', 'GH₵ 30', 1),
('Take Out Packs', 'Aluminium Pack', '', 'GH₵ 50', 2),
('Take Out Packs', 'Paper Bag', '', 'GH₵ 15', 3);