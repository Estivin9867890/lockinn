// ─── Life OS — Types TypeScript ───────────────────────────────────────────

export interface UserSettings {
  id: string;
  user_id: string;
  display_name: string;
  water_goal_ml: number;
  calorie_goal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
  steps_goal: number;
  workout_sessions_per_week: number;
  monthly_budget_eur: number;
  sleep_goal_hours: number;
  // Diète
  weight_kg?: number;
  height_cm?: number;
  age?: number;
  activity_level?: string;
  nutrition_goal?: string;
  // Strava
  strava_connected: boolean;
  strava_athlete_id?: number;
  strava_access_token?: string;
  strava_refresh_token?: string;
  strava_token_expires_at?: string;
  updated_at: string;
}

export const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "user_id" | "updated_at"> = {
  display_name: "Moi",
  water_goal_ml: 2000,
  calorie_goal: 2200,
  protein_goal_g: 165,
  carbs_goal_g: 250,
  fat_goal_g: 75,
  steps_goal: 10000,
  workout_sessions_per_week: 4,
  monthly_budget_eur: 1500,
  sleep_goal_hours: 8,
  activity_level: "moderate",
  nutrition_goal: "maintenance",
  strava_connected: false,
};

// ─── Calendrier ─────────────────────────────────────────────

export type EventType = "lockin" | "sport" | "personal" | "work" | "health" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  type: EventType;
  color: string;
  notes?: string;
  all_day: boolean;
  created_at: string;
}

export const EVENT_COLORS: Record<EventType, string> = {
  lockin:   "#5B9CF6",
  sport:    "#34D399",
  personal: "#FB923C",
  work:     "#A78BFA",
  health:   "#F472B6",
  other:    "#9CA3AF",
};

export const EVENT_LABELS: Record<EventType, string> = {
  lockin:   "🔒 LockIn",
  sport:    "🏃 Sport",
  personal: "🧡 Personnel",
  work:     "💼 Travail",
  health:   "🩺 Santé",
  other:    "📅 Autre",
};

// ─── Notes ───────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SportSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "run" | "bike" | "skate" | "climb" | "gym";
  distance_km?: number;
  notes?: string;
  created_at: string;
}

export interface SportSession {
  id: string;
  date: string;
  type: string;
  duration_min: number;
  calories?: number;
  spot_id?: string;
  notes?: string;
  strava_activity_id?: number;
  distance_km?: number;
  start_lat?: number;
  start_lng?: number;
  created_at: string;
}

export interface NutritionLog {
  id: string;
  date: string;
  meal_name: string;
  items: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  completed: boolean;
  time_of_day?: string;
  created_at: string;
}

export interface WaterLog {
  id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  label: string;
  category: string;
  amount: number;
  recurring: boolean;
  created_at: string;
}

export interface FinanceSubscription {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon: string;
  billing_period: string;
  active: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "series" | "book";
  status: "to-watch" | "watching" | "completed";
  rating?: number;
  poster_url?: string;
  genre?: string;
  year?: number;
  progress: number;
  notes?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  purchase_date?: string;
  usage_unit: string;
  current_usage: number;
  max_usage: number;
  icon: string;
  color: string;
  notes?: string;
  created_at: string;
}

// ─── Strava ─────────────────────────────────────────────────────────────────

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  distance: number;        // mètres
  moving_time: number;     // secondes
  total_elevation_gain: number;
  start_latlng?: [number, number];
  calories?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const SPORT_TYPES = ["run", "bike", "skate", "climb", "gym"] as const;
export const SPORT_LABELS: Record<string, string> = {
  run: "Course", bike: "Vélo", skate: "Skate", climb: "Escalade", gym: "Salle",
};
export const SPORT_EMOJIS: Record<string, string> = {
  run: "🏃", bike: "🚴", skate: "🛹", climb: "🧗", gym: "🏋️",
};
export const SPORT_COLORS: Record<string, string> = {
  run: "#34D399", bike: "#5B9CF6", skate: "#A78BFA", climb: "#F472B6", gym: "#FB923C",
};

// Map Strava sport_type → our type
export const STRAVA_TYPE_MAP: Record<string, string> = {
  Run: "run", Ride: "bike", Walk: "run", Hike: "run",
  RockClimbing: "climb", Skateboard: "skate", WeightTraining: "gym",
  Workout: "gym", Yoga: "gym", Swim: "gym",
};

export const EXPENSE_CATEGORIES = [
  "Alimentation", "Transport", "Sport", "Entertainment",
  "Shopping", "Restaurant", "Tech", "Santé", "Logement", "Autre",
];
export const CATEGORY_EMOJIS: Record<string, string> = {
  Alimentation: "🛒", Transport: "🚇", Sport: "🏋️", Entertainment: "🎬",
  Shopping: "🛍️", Restaurant: "🍽️", Tech: "💻", Santé: "💊",
  Logement: "🏠", Autre: "💰",
};

export const MEDIA_TYPES = ["movie", "series", "book"] as const;
export const MEDIA_TYPE_LABELS: Record<string, string> = {
  movie: "Film", series: "Série", book: "Livre",
};
export const MEDIA_STATUSES = ["to-watch", "watching", "completed"] as const;
export const MEDIA_STATUS_LABELS: Record<string, string> = {
  "to-watch": "À voir", watching: "En cours", completed: "Terminé",
};
export const MEDIA_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  "to-watch": { color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  watching:   { color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  completed:  { color: "#34D399", bg: "rgba(52,211,153,0.12)" },
};
