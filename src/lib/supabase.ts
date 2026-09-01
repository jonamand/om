import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  category_id: string;
  creator_id: string;
  image_url: string;
  file_url: string;
  file_type: string;
  tags: string[];
  status: "draft" | "published";
  download_count: number;
  created_at: string;
  category?: Category;
  creator?: Profile;
  reviews?: Review[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: "user" | "creator" | "organizer" | "admin_content" | "admin_moderation" | "super_admin";
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profile?: Profile;
};

export type EventItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  city: string;
  country: string;
  event_date: string;
  end_date: string | null;
  venue: string;
  cover_image: string;
  event_type: "convention" | "cosplay_contest" | "esport_tournament" | "screening" | "workshop";
  is_free: boolean;
  price: number;
  currency: string;
  capacity: number;
  registered_count: number;
  organizer_id: string;
  status: "draft" | "published";
  created_at: string;
  organizer?: Profile;
};

export type Ticket = {
  id: string;
  event_id: string;
  user_id: string;
  ticket_code: string;
  qr_data: string;
  status: "valid" | "used" | "cancelled";
  created_at: string;
  event?: EventItem;
};

export type Order = {
  id: string;
  user_id: string;
  total: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  payment_method: string;
  items: OrderItem[];
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  price: number;
};

export type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author_id: string;
  status: "draft" | "published";
  created_at: string;
};

export type AuditLog = {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  admin?: Profile;
};

export type AdminOrder = {
  id: string;
  user_id: string;
  total: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  payment_method: string;
  created_at: string;
  items?: AdminOrderItem[];
  profile?: Profile;
};

export type AdminOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  price: number;
  product?: Product;
};

export type AdminTicket = {
  id: string;
  event_id: string;
  user_id: string;
  ticket_code: string;
  qr_data: string;
  status: "valid" | "used" | "cancelled";
  created_at: string;
  event?: EventItem;
  profile?: Profile;
};
