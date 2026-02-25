export type MenuItem = {
  name: string;
  description: string;
  price: string;
};

export const hotAppetizers: MenuItem[] = [
  { name: "Spicy Chicken Wings", description: "Juicy fried chicken wings in hot green chilli sauce", price: "Ghc 90" },
  { name: "Beef Cocktail Khebab", description: "Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato", price: "Ghc 100" },
  { name: "Beef Samosa", description: "Tender beef, khebab powder, grilled onions, bell pepper, fresh tomato", price: "Ghc 80" },
  { name: "Hot Chilli Gizzard", description: "Chilli sauce, tender fried gizzard", price: "Ghc 85" },
  { name: "Honey Glazed Chicken Wings", description: "Juicy fried chicken wings in spicy honey", price: "Ghc 90" },
  { name: "Golden Fried Prawns", description: "Marinated prawns, bread crumbs, cocktail sauce", price: "Ghc 120" },
  { name: "Goat Meat Pepper Soup", description: "Goat meat pieces, hot pepper soup stock (serve with bread rolls)", price: "Ghc 150" },
  { name: "Chicken Cocktail Kebab", description: "Tender chicken, white pepper grilled bell pepper, onion & tomato", price: "Ghc 120" },
  { name: "Shrimps Avocado Cocktail", description: "Spicy steamed shrimps, cocktail sauce, lettuce, cucumber, fresh tomato, celery", price: "Ghc 120" },
  { name: "Chicken Pepper Soup", description: "Diced chicken, hot pepper soup stock (serve with bread rolls)", price: "Ghc 120" },
  { name: "Mix Vegetable Soup", description: "Mushroom, carrot, french beans, zucchini, cabbage, pumpkin, vegetables stock, bouquet-garni (serve with bread rolls)", price: "Ghc 120" },
  { name: "Pumpkin Soup", description: "Vegetables stock, pumpkin, bouquet (serve with bread rolls)", price: "Ghc 100" },
];

export const coldLarder: MenuItem[] = [
  { name: "Chef's Salad", description: "Lettuce, tomato, carrot, cucumber, onions, chicken flakes, black olives, boiled egg, sliced apple", price: "Ghc 150" },
  { name: "MJ Special Salad", description: "Lettuce, fresh tomato, carrot, cucumber, onions, chicken flakes, beef flakes, shrimps, boiled egg, black olives", price: "Ghc 200" },
  { name: "Seafood Salad", description: "Prawns, squid, grouper fish, lettuce, fresh tomato, carrot, cucumber, onions, tartar sauce", price: "Ghc 250" },
  { name: "Greek Salad", description: "Lettuce, fresh tomato, cucumber, onions, black olives, feta cheese, vinaigrette dressing", price: "Ghc 110" },
  { name: "Ghanaian Salad", description: "Lettuce, carrot, cucumber, onions, boiled egg, baked beans, sardine, fresh tomato, black olives", price: "Ghc 200" },
  { name: "Tuna Salad", description: "Chunk tuna, lettuce, fresh tomato, onions, cucumber, carrot, olive oil, white pepper, black olive", price: "Ghc 120" },
  { name: "Potato Salad", description: "Potatoes, cucumber, carrot, green bell pepper, onions, egg", price: "Ghc 100" },
  { name: "Chicken Caesar Salad", description: "Lettuce, sun-dried tomatoes, onions, grilled chicken flakes, black olives, parmesan cheese, croutons", price: "Ghc 120" },
];

export const chickenMeals: MenuItem[] = [
  { name: "Spicy Grilled Chicken", description: "", price: "Ghc 150" },
  { name: "Hawaiian Chicken Khebeb", description: "", price: "Ghc 150" },
  { name: "Chicken Alfredo", description: "", price: "Ghc 180" },
  { name: "Chicken Khebab", description: "", price: "Ghc 130" },
  { name: "Chicken Fried Rice", description: "", price: "Ghc 160" },
  { name: "Chicken Soup", description: "", price: "Ghc 180" },
  { name: "Spicy Turkey Wings", description: "", price: "Ghc 150" },
  { name: "Grilled/Fried Chicken Breast", description: "", price: "Ghc 150" },
  { name: "Chicken Breast Veg Stir Fry", description: "", price: "Ghc 150" },
  { name: "Shredded Chicken Sauce", description: "", price: "Ghc 150" },
  { name: "Chicken Provençal", description: "", price: "Ghc 180" },
  { name: "Saucy Chicken Pasta", description: "", price: "Ghc 180" },
];

export const kidsMeals: MenuItem[] = [
  { name: "Crispy Chicken Fingers", description: "", price: "Ghc 100" },
  { name: "Diced Chicken & Pasta in Tomato Sauce", description: "", price: "Ghc 150" },
  { name: "Mini-Chicken & Rice", description: "", price: "Ghc 120" },
];

export const fishMeals: MenuItem[] = [
  { name: "Grilled/Fried Casava Fish", description: "Juicy fried chicken wings in hot green chilli sauce", price: "Ghc 170" },
  { name: "Grilled/Fried Grouper Fillet", description: "Ginger, garlic, complete seasoning, lemon juice, mustard, fresh parsley. Side orders: potato chips, jollof rice, steamed rice, fried rice, sautéed potatoes, fried yam, fried plantain, mashed potatoes", price: "Ghc 200" },
  { name: "Grilled/Fried Tilapia", description: "Black pepper, cayenne pepper, ginger, garlic, lemon juice, complete seasoning. M / L sizes. Side orders: banku, fried rice, fried yam, jollof rice, steamed rice, potato chips", price: "M: Ghc 150 / L: Ghc 200" },
  { name: "Fish Fingers", description: "Shredded grouper fillet, ginger, garlic, white pepper, egg, breadcrumbs", price: "Ghc 200" },
  { name: "Grilled/Fried Snapper Fish", description: "Cayenne pepper, ginger, garlic, lemon juice, complete seasoning. Side orders: potato chips, jollof rice, steamed rice, fried rice, fried yam, fried plantain", price: "Ghc 150" },
  { name: "Fish Khebab", description: "Grouper fillet, ginger, garlic, white pepper, grilled onions, green bell pepper & tomato", price: "Ghc 200" },
  { name: "Breaded Fish Fillet", description: "White pepper, ginger, garlic, breadcrumbs", price: "Ghc 200" },
  { name: "Grilled/Fried Barracuba Fish", description: "Complete seasoning, lemon juice, mustard, ginger, garlic, white pepper. Side orders: potato chips, jollof rice, steamed rice, fried rice, fried yam, mashed potatoes", price: "Ghc 180" },
  { name: "Tilapia Stew", description: "Tomato sauce, carrot, zucchini, bell pepper, white wine", price: "Ghc 200" },
  { name: "Grouper Provençal", description: "", price: "Ghc 200" },
  { name: "Snapper Provençal", description: "", price: "Ghc 150" },
  { name: "Breaded Fish Fillet", description: "", price: "Ghc 200" },
];

export const beefMeals: MenuItem[] = [
  { name: "Beef Pepper Steak", description: "Beef fillet, mustard, black pepper, salt, grilled tomato, onion ring", price: "Ghc 190" },
  { name: "MJ Mixed Grill", description: "Goat meat, beef, chicken, sausage, vegetable, fried egg", price: "Ghc 220" },
  { name: "Beef Provençal", description: "Juicy fried beef, fresh tomato sauce, vegetables, red wine", price: "Ghc 200" },
  { name: "Grilled T-Bone Steak", description: "Bone-in tenderloin, garlic/ginger powder, mustard, salt, black pepper", price: "Ghc 200" },
  { name: "Shredded Beef Sauce", description: "Shredded beef fillet, carrot, onions, bell pepper, oyster sauce, butter, soy sauce", price: "Ghc 190" },
  { name: "Grilled Goat", description: "", price: "Ghc 200" },
  { name: "Assorted Meat Pot", description: "Goat, meat, beef", price: "Ghc 180" },
  { name: "Hawaiian Beef Khebab", description: "", price: "Ghc 150" },
  { name: "Beef Stroganoff", description: "", price: "Ghc 180" },
  { name: "Saucy Beef Pasta", description: "", price: "Ghc 190" },
];

export const extras: MenuItem[] = [
  { name: "Extra Stew", description: "", price: "Ghc 30" },
  { name: "Extra Vegetables", description: "", price: "Ghc 40" },
  { name: "Extra Pepper", description: "", price: "Ghc 20" },
];

export const seafoodMeals: MenuItem[] = [
  { name: "Mediterranean Seafood", description: "", price: "Ghc 250" },
  { name: "Stir Fried Seafood", description: "", price: "Ghc 250" },
  { name: "Grilled Prawns", description: "", price: "Ghc 200" },
  { name: "Saucy Shrimps & Pasta", description: "", price: "Ghc 200" },
  { name: "Fisherman's Basket", description: "", price: "Ghc 250" },
  { name: "Lobster Thermidor", description: "", price: "Ghc 250" },
  { name: "Grilled Lobster", description: "", price: "Ghc 250" },
  { name: "Shrimps Sauce", description: "", price: "Ghc 180" },
  { name: "Shrimps Fried Rice", description: "", price: "Ghc 170" },
  { name: "Fisherman's Soup", description: "", price: "Ghc 250" },
  { name: "Shrimps Spaghetti Royal", description: "", price: "Ghc 200" },
];

export const mjSpecials: MenuItem[] = [
  { name: "MJ Fried Rice", description: "Shredded beef, chicken, sausage, egg", price: "Ghc 150" },
  { name: "MJ Jollof Rice", description: "Shredded beef, chicken, sausage, egg", price: "Ghc 150" },
  { name: "Boatemaa's Special", description: "Beef, chicken, sausage, shrimps, eggs", price: "Ghc 200" },
  { name: "Pork Chops", description: "", price: "Ghc 250" },
  { name: "Lamb Chops", description: "", price: "Ghc 250" },
  { name: "Egg Fried Rice", description: "", price: "Ghc 100" },
  { name: "MJ Beef Fried Rice", description: "", price: "Ghc 190" },
  { name: "MJ Assorted Pasta", description: "", price: "Ghc 200" },
  { name: "MJ Beef Jollof Rice", description: "", price: "Ghc 190" },
];

export const localDishes: MenuItem[] = [
  { name: "Goat Light Soup", description: "", price: "Ghc 180" },
  { name: "Goat Okro Soup", description: "With banku, semolina, or eba", price: "Ghc 200" },
  { name: "Snapper Garden Eggs Stew", description: "", price: "Ghc 150" },
  { name: "Grilled Tilapia", description: "With banku", price: "M: Ghc 170 / L: Ghc 200" },
  { name: "Special Gari Foto", description: "Goat, chicken, grouper, snapper, beef. Protein will determine the price", price: "" },
  { name: "Chicken Light Soup", description: "", price: "Ghc 170" },
  { name: "Ebunuebunu (Green Soup)", description: "With goat: Ghc 200 | With tilapia: Ghc 200 | With chicken: Ghc 130 | With dry fish: Ghc 200 | With snapper: Ghc 170", price: "" },
  { name: "Assorted Soup / Ebunuebunu", description: "Sails, dry fish, salmon", price: "Ghc 300" },
  { name: "Assorted Okro", description: "", price: "Ghc 250" },
  { name: "Fish Palava", description: "With yam, plantain, or cocoyam", price: "Ghc 180" },
  { name: "Tilapia Soup", description: "", price: "Ghc 200" },
  { name: "Assorted Peanut Soup", description: "", price: "Ghc 250" },
  { name: "Fried Tilapia", description: "", price: "Ghc 170" },
];

export const burgersAndSandwiches: MenuItem[] = [
  { name: "Chicken Burger", description: "", price: "Ghc 150" },
  { name: "Beef Burger", description: "", price: "Ghc 150" },
  { name: "Cheese Burger", description: "", price: "Ghc 200" },
  { name: "Beef Wrap", description: "", price: "Ghc 140" },
  { name: "Chicken Wrap", description: "", price: "Ghc 140" },
  { name: "Vegetable Wrap", description: "", price: "Ghc 140" },
  { name: "Club Sandwich", description: "", price: "Ghc 150" },
  { name: "Tuna Sandwich", description: "", price: "Ghc 120" },
  { name: "Cheese Sandwich", description: "", price: "Ghc 140" },
];

export const pizzaMeals: MenuItem[] = [
  { name: "MJ Lover's Rock Pizza", description: "", price: "L: Ghc 200 / M: Ghc 150" },
  { name: "Chicken & Ham Pizza", description: "", price: "L: Ghc 150 / M: Ghc 120" },
  { name: "Vegetarian Pizza", description: "", price: "L: Ghc 150 / M: Ghc 130" },
  { name: "Beef & Mushroom Pizza", description: "", price: "L: Ghc 150 / M: Ghc 130" },
  { name: "Chicken & Ham Pizza", description: "", price: "L: Ghc 150 / M: Ghc 120" },
  { name: "MJ Pepperoni Pizza", description: "", price: "L: Ghc 180 / M: Ghc 150" },
  { name: "Seafood Pizza", description: "", price: "L: Ghc 250 / M: Ghc 170" },
  { name: "Margherita Pizza", description: "", price: "L: Ghc 120 / M: Ghc 100" },
  { name: "Hawaiian Pizza", description: "", price: "L: Ghc 170 / M: Ghc 150" },
];

export const desserts: MenuItem[] = [
  { name: "Fruit Platter", description: "", price: "Ghc 80" },
  { name: "Fruit Salad", description: "", price: "Ghc 80" },
  { name: "Ice Cream", description: "", price: "Ghc 80" },
  { name: "Crumble Apple", description: "", price: "Ghc 80" },
  { name: "Mohalabia Milk Pudding", description: "", price: "Ghc 80" },
  { name: "Pan Cake", description: "", price: "Ghc 80" },
  { name: "Chris Cake", description: "", price: "Ghc 80" },
  { name: "American Cake", description: "", price: "Ghc 80" },
];

export const takeOutPacks: MenuItem[] = [
  { name: "Take Away Pack", description: "", price: "Ghc 30" },
  { name: "Aluminium Pack", description: "", price: "Ghc 50" },
  { name: "Paper Bag", description: "", price: "Ghc 15" },
];
