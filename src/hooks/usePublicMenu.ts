import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  hotAppetizers, coldLarder, chickenMeals, kidsMeals, fishMeals,
  beefMeals, extras, seafoodMeals, mjSpecials, localDishes,
  burgersAndSandwiches, pizzaMeals, desserts, takeOutPacks,
  vegetarianDishes, sideOrders,
} from "@/data/menuData";
import type { MenuItem } from "@/data/menuData";

// Maps DB categories to hardcoded fallback arrays
const FALLBACK_MAP: Record<string, MenuItem[]> = {
  "Hot Appetizers": hotAppetizers,
  "Salads": coldLarder,
  "Chicken Meals": chickenMeals,
  "Kids Meals": kidsMeals,
  "Fish Meals": fishMeals,
  "Beef Meals": beefMeals,
  "Extras": extras,
  "Seafood": seafoodMeals,
  "MJ Specials": mjSpecials,
  "Local Dishes": localDishes,
  "Burgers & Sandwiches": burgersAndSandwiches,
  "Pizza": pizzaMeals,
  "Desserts": desserts,
  "Take Out Packs": takeOutPacks,
  "Vegetarian": vegetarianDishes,
  "Side Orders": sideOrders,
};

// Ordered list of sections as they appear on the menu page
export const MENU_SECTIONS = [
  "Hot Appetizers", "Salads", "Chicken Meals", "Kids Meals",
  "Fish Meals", "Beef Meals", "Extras", "Seafood", "MJ Specials",
  "Local Dishes", "Burgers & Sandwiches", "Pizza", "Desserts",
  "Take Out Packs", "Vegetarian", "Side Orders",
];

export function usePublicMenu() {
  return useQuery({
    queryKey: ["public-menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("category, name, description, price, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Group DB items by category
      const dbGrouped: Record<string, MenuItem[]> = {};
      for (const item of data || []) {
        if (!dbGrouped[item.category]) dbGrouped[item.category] = [];
        dbGrouped[item.category].push({
          name: item.name,
          description: item.description || "",
          price: item.price,
        });
      }

      // For each section, use DB data if available, otherwise fallback to hardcoded
      const result: Record<string, MenuItem[]> = {};
      for (const section of MENU_SECTIONS) {
        result[section] = dbGrouped[section]?.length ? dbGrouped[section] : (FALLBACK_MAP[section] || []);
      }

      // Include any extra DB categories not in the standard list
      for (const cat of Object.keys(dbGrouped)) {
        if (!result[cat]) result[cat] = dbGrouped[cat];
      }

      return result;
    },
    staleTime: 60_000,
  });
}
