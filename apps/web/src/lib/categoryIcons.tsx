import { Car, Laptop, Shirt, Tag, Utensils, Wrench, type LucideIcon } from "lucide-react";

// Maps the `icon` string stored on each category row (supabase/seed.sql) to a
// lucide-react component. Look up with `CATEGORY_ICONS[icon] ?? DEFAULT_CATEGORY_ICON`
// (a plain property lookup, not a function call) so the icon element can be
// used directly as a JSX tag without tripping the "static components" lint rule.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Utensils,
  Laptop,
  Car,
  Shirt,
  Wrench,
};

export const DEFAULT_CATEGORY_ICON: LucideIcon = Tag;
