export type MenuItem = {
  name: string;
  description: string;
  price: string;
};

export const hotAppetizers: MenuItem[] = [
  { name: "Spicy Chicken Wings", description: "Juicy fried chicken wings in hot green chilli sauce", price: "GH₵ 90" },
  { name: "Beef Cocktail Khebab", description: "Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato", price: "GH₵ 100" },
  { name: "Beef Samosa", description: "Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato", price: "GH₵ 80" },
  { name: "Hot Chilli Gizzard", description: "Chilli sauce, tender fried gizzard", price: "GH₵ 85" },
  { name: "Honey Glazed Chicken Wings", description: "Juicy fried chicken wings in spicy honey", price: "GH₵ 90" },
  { name: "Golden Fried Prawns", description: "Marinated prawns, bread crumbs, cocktail sauce", price: "GH₵ 120" },
  { name: "Goat Meat Pepper Soup", description: "Goat meat pieces, hot pepper soup stock (serve with bread rolls)", price: "GH₵ 150" },
  { name: "Chicken Cocktail Kebab", description: "Tender chicken, white pepper grilled bell pepper, onion & tomato", price: "GH₵ 120" },
  { name: "Shrimps Avocado Cocktail", description: "Spicy steamed shrimps, cocktail sauce, lettuce, cucumber, fresh tomato, celery", price: "GH₵ 120" },
  { name: "Chicken Pepper Soup", description: "Diced chicken, hot pepper soup stock (serve with bread rolls)", price: "GH₵ 120" },
  { name: "Mix Vegetable Soup", description: "Mushroom, carrot, french beans, zucchini, cabbage, pumpkin, vegetables stock, bouquet-garni (serve with bread rolls)", price: "GH₵ 120" },
  { name: "Pumpkin Soup", description: "Vegetables stock, pumpkin, bouquet (serve with bread rolls)", price: "GH₵ 100" },
];

export const coldLarder: MenuItem[] = [
  { name: "Chef's Salad", description: "Lettuce, tomato, carrot, cucumber, onions, chicken flakes, black olives, boiled egg, sliced apple", price: "GH₵ 150" },
  { name: "MJ Special Salad", description: "Lettuce, fresh tomato, carrot, cucumber, onions, chicken flakes, beef flakes, shrimps, boiled egg, black olives", price: "GH₵ 200" },
  { name: "Seafood Salad", description: "Prawns, squid, grouper fish, lettuce, fresh tomato, carrot, cucumber, onions, tartar sauce", price: "GH₵ 250" },
  { name: "Greek Salad", description: "Lettuce, fresh tomato, cucumber, onions, black olives, feta cheese, vinaigrette dressing", price: "GH₵ 110" },
  { name: "Ghanaian Salad", description: "Lettuce, carrot, cucumber, onions, boiled egg, baked beans, sardine, fresh tomato, black olives", price: "GH₵ 200" },
  { name: "Tuna Salad", description: "Chunk tuna, lettuce, fresh tomato, onions, cucumber, carrot, olive oil, white pepper, black olive", price: "GH₵ 120" },
  { name: "Potato Salad", description: "Potatoes, cucumber, carrot, green bell pepper, onions, egg", price: "GH₵ 100" },
  { name: "Chicken Caesar Salad", description: "Lettuce, sun-dried tomatoes, onions, grilled chicken flakes, black olives, parmesan cheese, croutons", price: "GH₵ 120" },
];

export const chickenMeals: MenuItem[] = [
  { name: "Spicy Grilled Chicken", description: "", price: "GH₵ 150" },
  { name: "Hawaiian Chicken Khebeb", description: "", price: "GH₵ 150" },
  { name: "Chicken Alfredo", description: "", price: "GH₵ 180" },
  { name: "Chicken Khebab", description: "", price: "GH₵ 130" },
  { name: "Chicken Fried Rice", description: "", price: "GH₵ 160" },
  { name: "Chicken Soup", description: "", price: "GH₵ 180" },
  { name: "Spicy Turkey Wings", description: "", price: "GH₵ 150" },
  { name: "Grilled/Fried Chicken Breast", description: "", price: "GH₵ 150" },
  { name: "Chicken Breast Veg Stir Fry", description: "", price: "GH₵ 150" },
  { name: "Shredded Chicken Sauce", description: "", price: "GH₵ 150" },
  { name: "Chicken Provençal", description: "", price: "GH₵ 180" },
  { name: "Saucy Chicken Pasta", description: "", price: "GH₵ 180" },
];

export const kidsMeals: MenuItem[] = [
  { name: "Crispy Chicken Fingers", description: "", price: "GH₵ 100" },
  { name: "Diced Chicken & Pasta in Tomato Sauce", description: "", price: "GH₵ 150" },
  { name: "Mini-Chicken & Rice", description: "", price: "GH₵ 120" },
];

export const fishMeals: MenuItem[] = [
  { name: "Grilled/Fried Casava Fish", description: "Juicy fried chicken wings in hot green chilli sauce", price: "GH₵ 170" },
  { name: "Grilled/Fried Grouper Fillet", description: "Ginger, garlic, complete seasoning, lemon juice, mustard, fresh parsley. Side orders: potato chips, jollof rice, steamed rice, fried rice, sautéed potatoes, fried yam, fried plantain, mashed potatoes", price: "GH₵ 200" },
  { name: "Grilled/Fried Tilapia", description: "Black pepper, cayenne pepper, ginger, garlic, lemon juice, complete seasoning. M / L sizes. Side orders: banku, fried rice, fried yam, jollof rice, steamed rice, potato chips", price: "M: GH₵ 150 / L: GH₵ 200" },
  { name: "Fish Fingers", description: "Shredded grouper fillet, ginger, garlic, white pepper, egg, breadcrumbs", price: "GH₵ 200" },
  { name: "Grilled/Fried Snapper Fish", description: "Cayenne pepper, ginger, garlic, lemon juice, complete seasoning. Side orders: potato chips, jollof rice, steamed rice, fried rice, fried yam, fried plantain", price: "GH₵ 150" },
  { name: "Fish Khebab", description: "Grouper fillet, ginger, garlic, white pepper, grilled onions, green bell pepper & tomato", price: "GH₵ 200" },
  { name: "Breaded Fish Fillet", description: "White pepper, ginger, garlic, breadcrumbs", price: "GH₵ 200" },
  { name: "Grilled/Fried Barracuba Fish", description: "Complete seasoning, lemon juice, mustard, ginger, garlic, white pepper. Side orders: potato chips, jollof rice, steamed rice, fried rice, fried yam, mashed potatoes", price: "GH₵ 180" },
  { name: "Tilapia Stew", description: "Tomato sauce, carrot, zucchini, bell pepper, white wine", price: "GH₵ 200" },
  { name: "Grouper Provençal", description: "", price: "GH₵ 200" },
  { name: "Snapper Provençal", description: "", price: "GH₵ 150" },
  { name: "Breaded Fish Fillet", description: "", price: "GH₵ 200" },
];

export const beefMeals: MenuItem[] = [
  { name: "Beef Pepper Steak", description: "Beef fillet, mustard, black pepper, salt, grilled tomato, onion ring", price: "GH₵ 190" },
  { name: "MJ Mixed Grill", description: "Goat meat, beef, chicken, sausage, vegetable, fried egg", price: "GH₵ 220" },
  { name: "Beef Provençal", description: "Juicy fried beef, fresh tomato sauce, vegetables, red wine", price: "GH₵ 200" },
  { name: "Grilled T-Bone Steak", description: "Bone-in tenderloin, garlic/ginger powder, mustard, salt, black pepper", price: "GH₵ 200" },
  { name: "Shredded Beef Sauce", description: "Shredded beef fillet, carrot, onions, bell pepper, oyster sauce, butter, soy sauce", price: "GH₵ 190" },
  { name: "Grilled Goat", description: "", price: "GH₵ 200" },
  { name: "Assorted Meat Pot", description: "Goat, meat, beef", price: "GH₵ 180" },
  { name: "Hawaiian Beef Khebab", description: "", price: "GH₵ 150" },
  { name: "Beef Stroganoff", description: "", price: "GH₵ 180" },
  { name: "Saucy Beef Pasta", description: "", price: "GH₵ 190" },
];

export const extras: MenuItem[] = [
  { name: "Extra Stew", description: "", price: "GH₵ 30" },
  { name: "Extra Vegetables", description: "", price: "GH₵ 40" },
  { name: "Extra Pepper", description: "", price: "GH₵ 20" },
];

export const seafoodMeals: MenuItem[] = [
  { name: "Mediterranean Seafood", description: "", price: "GH₵ 250" },
  { name: "Stir Fried Seafood", description: "", price: "GH₵ 250" },
  { name: "Grilled Prawns", description: "", price: "GH₵ 200" },
  { name: "Saucy Shrimps & Pasta", description: "", price: "GH₵ 200" },
  { name: "Fisherman's Basket", description: "", price: "GH₵ 250" },
  { name: "Lobster Thermidor", description: "", price: "GH₵ 250" },
  { name: "Grilled Lobster", description: "", price: "GH₵ 250" },
  { name: "Shrimps Sauce", description: "", price: "GH₵ 180" },
  { name: "Shrimps Fried Rice", description: "", price: "GH₵ 170" },
  { name: "Fisherman's Soup", description: "", price: "GH₵ 250" },
  { name: "Shrimps Spaghetti Royal", description: "", price: "GH₵ 200" },
];

export const mjSpecials: MenuItem[] = [
  { name: "MJ Fried Rice", description: "Shredded beef, chicken, sausage, egg", price: "GH₵ 150" },
  { name: "MJ Jollof Rice", description: "Shredded beef, chicken, sausage, egg", price: "GH₵ 150" },
  { name: "Boatemaa's Special", description: "Beef, chicken, sausage, shrimps, eggs", price: "GH₵ 200" },
  { name: "Pork Chops", description: "", price: "GH₵ 250" },
  { name: "Lamb Chops", description: "", price: "GH₵ 250" },
  { name: "Egg Fried Rice", description: "", price: "GH₵ 100" },
  { name: "MJ Beef Fried Rice", description: "", price: "GH₵ 190" },
  { name: "MJ Assorted Pasta", description: "", price: "GH₵ 200" },
  { name: "MJ Beef Jollof Rice", description: "", price: "GH₵ 190" },
];

export const localDishes: MenuItem[] = [
  { name: "Goat Light Soup", description: "", price: "GH₵ 180" },
  { name: "Goat Okro Soup", description: "With banku, semolina, or eba", price: "GH₵ 200" },
  { name: "Snapper Garden Eggs Stew", description: "", price: "GH₵ 150" },
  { name: "Grilled Tilapia", description: "With banku", price: "M: GH₵ 170 / L: GH₵ 200" },
  { name: "Special Gari Foto", description: "Goat, chicken, grouper, snapper, beef. Protein will determine the price", price: "" },
  { name: "Chicken Light Soup", description: "", price: "GH₵ 170" },
  { name: "Ebunuebunu (Green Soup)", description: "With goat: GH₵ 200 | With tilapia: GH₵ 200 | With chicken: GH₵ 130 | With dry fish: GH₵ 200 | With snapper: GH₵ 170", price: "" },
  { name: "Assorted Soup / Ebunuebunu", description: "Sails, dry fish, salmon", price: "GH₵ 300" },
  { name: "Assorted Okro", description: "", price: "GH₵ 250" },
  { name: "Fish Palava", description: "With yam, plantain, or cocoyam", price: "GH₵ 180" },
  { name: "Tilapia Soup", description: "", price: "GH₵ 200" },
  { name: "Assorted Peanut Soup", description: "", price: "GH₵ 250" },
  { name: "Fried Tilapia", description: "", price: "GH₵ 170" },
];

export const burgersAndSandwiches: MenuItem[] = [
  { name: "Chicken Burger", description: "", price: "GH₵ 150" },
  { name: "Beef Burger", description: "", price: "GH₵ 150" },
  { name: "Cheese Burger", description: "", price: "GH₵ 200" },
  { name: "Beef Wrap", description: "", price: "GH₵ 140" },
  { name: "Chicken Wrap", description: "", price: "GH₵ 140" },
  { name: "Vegetable Wrap", description: "", price: "GH₵ 140" },
  { name: "Club Sandwich", description: "", price: "GH₵ 150" },
  { name: "Tuna Sandwich", description: "", price: "GH₵ 120" },
  { name: "Cheese Sandwich", description: "", price: "GH₵ 140" },
];

export const pizzaMeals: MenuItem[] = [
  { name: "MJ Lover's Rock Pizza", description: "", price: "L: GH₵ 200 / M: GH₵ 150" },
  { name: "Chicken & Ham Pizza", description: "", price: "L: GH₵ 150 / M: GH₵ 120" },
  { name: "Vegetarian Pizza", description: "", price: "L: GH₵ 150 / M: GH₵ 130" },
  { name: "Beef & Mushroom Pizza", description: "", price: "L: GH₵ 150 / M: GH₵ 130" },
  { name: "Chicken & Ham Pizza", description: "", price: "L: GH₵ 150 / M: GH₵ 120" },
  { name: "MJ Pepperoni Pizza", description: "", price: "L: GH₵ 180 / M: GH₵ 150" },
  { name: "Seafood Pizza", description: "", price: "L: GH₵ 250 / M: GH₵ 170" },
  { name: "Margherita Pizza", description: "", price: "L: GH₵ 120 / M: GH₵ 100" },
  { name: "Hawaiian Pizza", description: "", price: "L: GH₵ 170 / M: GH₵ 150" },
];

export const desserts: MenuItem[] = [
  { name: "Fruit Platter", description: "", price: "GH₵ 80" },
  { name: "Fruit Salad", description: "", price: "GH₵ 80" },
  { name: "Ice Cream", description: "", price: "GH₵ 80" },
  { name: "Crumble Apple", description: "", price: "GH₵ 80" },
  { name: "Mohalabia Milk Pudding", description: "", price: "GH₵ 80" },
  { name: "Pan Cake", description: "", price: "GH₵ 80" },
  { name: "Chris Cake", description: "", price: "GH₵ 80" },
  { name: "American Cake", description: "", price: "GH₵ 80" },
];

export const takeOutPacks: MenuItem[] = [
  { name: "Take Away Pack", description: "", price: "GH₵ 30" },
  { name: "Aluminium Pack", description: "", price: "GH₵ 50" },
  { name: "Paper Bag", description: "", price: "GH₵ 15" },
];

export const vegetarianDishes: MenuItem[] = [
  { name: "Stir Fried Vegetables", description: "", price: "GH₵ 90" },
  { name: "Sauteed Vegetables and Chickpeas", description: "", price: "GH₵ 100" },
  { name: "Vegetable Soup", description: "", price: "GH₵ 90" },
  { name: "Vegetarian Egusi Stew", description: "", price: "GH₵ 90" },
  { name: "Pita Bread & Hummus", description: "", price: "GH₵ 90" },
  { name: "Mix Vegetable Stew", description: "", price: "GH₵ 90" },
  { name: "Beans Stew", description: "", price: "GH₵ 120" },
  { name: "Spaghetti Pomodoro", description: "", price: "GH₵ 150" },
];

export const sideOrders: MenuItem[] = [
  { name: "Fried Rice", description: "", price: "GH₵ 50" },
  { name: "Sauteed Potato", description: "", price: "GH₵ 50" },
  { name: "Kelewele", description: "", price: "GH₵ 40" },
  { name: "Jollof Rice", description: "", price: "GH₵ 40" },
  { name: "Plain Rice", description: "", price: "GH₵ 40" },
  { name: "Potato Chips", description: "", price: "GH₵ 50" },
  { name: "Vegetable Rice", description: "", price: "GH₵ 50" },
  { name: "Fried Plantain", description: "", price: "GH₵ 40" },
  { name: "Banku", description: "", price: "GH₵ 30" },
  { name: "Fried Yam", description: "", price: "GH₵ 30" },
  { name: "Fufu", description: "", price: "GH₵ 30" },
];