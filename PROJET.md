# PROJET.md — LockIn Sovereign Life OS
> Source unique de vérité. Mis à jour à chaque itération majeure.
> Dernière mise à jour : 2026-04-01 — V4 "Sovereign Life OS"

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Base de données | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth + Row Level Security |
| UI | Tailwind CSS + Framer Motion + Lucide Icons |
| Graphiques | Recharts |
| Toasts | Sonner |
| Debounce | use-debounce |
| Carte | Leaflet (sport spots) |
| API externes | TMDB (films), Open Library (livres), Strava (sport) |

---

## Variables d'environnement requises

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
TMDB_API_KEY=           # optionnel — Media Vault
```

---

## PWA Configuration

- `public/manifest.json` — Installable sous le nom "LockIn"
- `public/sw.js` — Service Worker (cache offline)
- `app/layout.tsx` — Meta tags iOS PWA + manifest link

---

## Schéma de base de données complet

### Tables V1 (Migration initiale)
| Table | Description |
|-------|-------------|
| `user_settings` | Objectifs, préférences, tokens Strava, custom_points_config, custom_bad_habits |
| `sport_sessions` | Sessions sport (type, durée, feeling 1-10, strava_activity_id, GPS) |
| `sport_spots` | Spots géolocalisés (Leaflet) |
| `nutrition_logs` | Repas journaliers (calories, macros, time_of_day) |
| `meal_ingredients` | Détail aliments par repas (food_name, weight_g, macros) |
| `water_logs` | Logs hydratation (amount_ml) |
| `finances_transactions` | Transactions (date, label, category, amount, recurring) |
| `finances_subscriptions` | Abonnements (nom, montant, période, actif) |
| `notes` | Notes Markdown (titre, contenu, pin, tags) |
| `events` | Calendrier (title, start_at, end_at, type: lockin/sport/work/health/personal/other, color, all_day) |
| `media_vault` | Médias (titre, type: movie/series/book, status, rating, poster_url, progress) |
| `inventory_items` | Inventaire (nom, catégorie, usage_unit, current/max_usage, icon, color) |
| `points_history` | Journal gamification (date, action, label, points) |
| `workout_days` | Programme sportif (day_of_week 0-6, label, exercises JSONB) |
| `pr_records` | PRs (exercise, weight_kg, reps, date) |
| `supplements` | Suppléments (nom, macros optionnels, sort_order) |
| `supplement_logs` | Logs prise suppléments (supplement_id, date) |

### Tables V2 (Master Control Update)
- `user_settings` : +`sleep_target_time TEXT`, +`custom_points_config JSONB`, +`custom_bad_habits JSONB`

### Tables V3 (Builder & Explorer Update)
| Table | Description |
|-------|-------------|
| `memos` | Post-it (content, icon, color, scheduled_at, event_id, completed, pinned) |
| `projects` | Projets (title, description, emoji, color, status, total_time_min) |
| `milestones` | Étapes projet (project_id, title, difficulty: easy/medium/hard, completed, points) |
| `focus_sessions` | Sessions focus (project_id, duration_min, started_at) |
| `challenges` | Défis (type: weekly/easter_egg, target, current, points_reward, week_start) |

### Tables V4 (Sovereign Life OS)
| Table | Description |
|-------|-------------|
| `sleep_logs` | Sommeil (date, bedtime, wake_time, duration_min, quality 1-10, score 0-100, notes) |
| `investments` | Investissements (name, ticker, category, amount_eur, quantity, buy_price, current_price) |
| `snapshots` | Mémoire du jour (date UNIQUE, phrase, photo_url, mood 1-5) |
- `user_settings` : +`sleep_wake_time TEXT`

### Tables V6 (Sport Analysis + Weight + Finance Income)
| Table | Description |
|-------|-------------|
| `weight_logs` | Poids corporel (date, weight_kg, notes) |
| `exercise_library` | Bibliothèque exercices (name, muscle_group, default_sets, default_reps, default_rest_sec) |
- `sport_sessions` : +`readiness_score INT` (forme avant séance 1-10), +`session_sub_type TEXT` (ex: "Push", "Dos")
- `finances_transactions` : +`is_income BOOLEAN` (revenu vs dépense)

---

## Architecture fichiers

```
app/
  page.tsx               → Dashboard Bento (10+ modules)
  layout.tsx             → Root layout (Toaster, SettingsProvider, PWA meta)
  login/page.tsx
  settings/page.tsx
  score/page.tsx         → Gamification + Weekly Wrapped
  calendar/page.tsx      → Jour/Semaine/Mois views
  sport/page.tsx
  nutrition/page.tsx
  budget/page.tsx
  media/page.tsx
  inventory/page.tsx
  memo/page.tsx          → Post-it + Smart Schedule
  projects/page.tsx      → Skill Tree + Focus Timer + No-Phone Zone
  challenges/page.tsx    → Weekly quests + Easter Eggs
  sleep/page.tsx         → Sleep Score + Roue circadienne [V4]
  auth/callback/route.ts
  api/strava/*/route.ts

components/
  DynamicIsland.tsx          → Floating pill (score, LockIn timer, notifs) [V4]
  CommandBar.tsx
  MapComponent.tsx
  layout/
    MainLayout.tsx           → Layout avec DynamicIsland + Sidebar + CommandBar
    Sidebar.tsx              → Navigation (12 items dont Sleep)
  dashboard/Dashboard.tsx    → Bento grid 5 colonnes (11 modules)
  score/
    ScorePage.tsx            → Journal + actions manuelles + Realtime + WeeklyWrapped
    WeeklyWrapped.tsx        → Modal Spotify-style résumé hebdomadaire [V4]
  sleep/SleepPage.tsx        → Roue SVG, inputs heure, quality slider, historique [V4]
  projects/ProjectsPage.tsx  → List view + Skill Tree SVG + No-Phone Zone timer [V4]
  challenges/ChallengesPage.tsx
  memo/MemoPage.tsx
  sport/SportPage.tsx
  nutrition/NutritionPage.tsx
  budget/BudgetPage.tsx
  calendar/CalendarPage.tsx  → Jour/Semaine/Mois + DayView
  media/MediaPage.tsx
  inventory/InventoryPage.tsx
  settings/SettingsPage.tsx
  ui/ (Modal, EmptyState, Skeleton)

lib/
  types.ts              → Tous les interfaces TypeScript (SleepLog, Investment, Snapshot en V4)
  utils.ts              → formatCurrency, cn
  supabase.ts           → Client browser
  supabase-server.ts    → Client server + requireUser()
  food-data.ts          → Bibliothèque 100+ aliments
  actions/
    points.ts           → CRUD gamification (addPoints, deletePoints, getTodayPoints, getStreakData)
    sport.ts            → CRUD sessions sport
    program.ts          → CRUD programme entraînement
    pr.ts               → CRUD PRs
    nutrition.ts        → CRUD repas + ingrédients
    supplements.ts      → CRUD suppléments + logs
    calendar.ts         → CRUD événements + import ICS
    challenges.ts       → CRUD défis + auto-seeding
    finances.ts         → CRUD transactions + abonnements
    inventory.ts        → CRUD inventaire
    media.ts            → CRUD media vault
    memos.ts            → CRUD mémos + Smart Schedule
    notes.ts            → CRUD notes
    projects.ts         → CRUD projets + milestones + focus sessions
    settings.ts         → CRUD user_settings
    sleep.ts            → CRUD sleep_logs + calcul score [V4]

contexts/
  SettingsContext.tsx   → Global settings + Realtime sync

public/
  manifest.json         → PWA manifest (nom: "LockIn")
  sw.js                 → Service Worker (cache offline)
  icons/                → icon-192.png, icon-512.png, apple-touch-icon.png
```

---

## Fonctionnalités implémentées

### V1 — Core
- [x] Auth Supabase (login/logout)
- [x] Dashboard Bento Grid 5 colonnes (11 modules)
- [x] Sport : sessions, spots géo, programme hebdo, PRs, Strava sync
- [x] Nutrition : repas, macros, eau, suppléments, bibliothèque 100+ aliments
- [x] Budget : transactions, abonnements, graphiques Recharts
- [x] Media Vault : films, séries, livres (TMDB + OpenLibrary)
- [x] Inventaire : objets avec suivi d'usure
- [x] Calendrier : vue Mois/Semaine/Jour (DayView SVG timeline), import ICS
- [x] Notes : Markdown, pin, tags
- [x] Réglages : tous les objectifs personnalisables

### V2 — Master Control
- [x] Score LockIn : journal gamification, actions manuelles, Realtime
- [x] Points configurables par action dans les réglages
- [x] Mauvaises habitudes custom (emoji + label + points)
- [x] Suppression d'entrées du journal avec recalcul instantané
- [x] Objectif heure de coucher dans les réglages

### V3 — Builder & Explorer
- [x] Mémo : post-it grid, Smart Schedule (injection calendrier si date), icône auto
- [x] Projets : liste + milestones + Focus Timer
- [x] Défis : 5 quêtes hebdo auto-seeded, 5 Easter Eggs cachés
- [x] Calendrier : vue Jour avec timeline verticale et ligne "heure actuelle"

### V4 — Sovereign Life OS
- [x] **Dynamic Island** : pill flottante top-center (score live, LockIn timer, notifs points Realtime)
- [x] **Sommeil** : page dédiée, roue SVG circadienne, quality slider 1-10, sleep score 0-100, historique
- [x] **Weekly Wrapped** : modal Spotify-style (dimanche soir auto + bouton manuel sur Score)
- [x] **Skill Tree** : vue Arbre dans Projets (SVG nodes + bezier connectors, unlock séquentiel)
- [x] **No-Phone Zone** : Page Visibility API dans Focus Timer, ×1.5 pts si 0 distraction
- [x] Types TypeScript : SleepLog, Investment, Snapshot
- [x] SQL V4 : sleep_logs, investments, snapshots tables

### V6 — Sport Analysis + Poids + Finance Pro
- [x] **Évolution PR** : clic sur exercice → modale courbe Recharts (charge × date) + stats recap
- [x] **RPE + Forme** : 2 sliders lors de la validation séance (effort post / forme pré)
- [x] **Sous-type Muscu** : champ "Push · Pectoraux", "Legs"… visible dans les cartes session
- [x] **Bibliothèque Exercices** : onglet dédié, filtrable par groupe musculaire (9 groupes), CRUD
- [x] **Poids corporel** : log quotidien + courbe d'évolution Recharts sur page Nutrition
- [x] **Finance Revenus** : toggle Dépense/Revenu dans la modale, solde positif recalculé
- [x] **Nouvelles catégories** : "Bar 🍺" et "Sorties 🎉" dans les presets dépenses
- [x] **Graphique Finance** : barres doubles (Dépenses rose / Revenus vert) sur 6 mois
- [x] SQL V6 : weight_logs, exercise_library, colonnes sport_sessions, is_income

---

## Fonctionnalités roadmap

### Haute priorité
- [ ] Snapshot / Mémoire du jour (upload photo + phrase + mood)
- [ ] Investissements : saisie + graphiques donut
- [ ] Ghost Mode : courbe historique meilleur mois sur graphiques sport/budget
- [ ] Budget Thermal Wheel : roue hebdomadaire rouge sang à l'approche limite
- [ ] Règle des 33h : reset automatique streak si aucune donnée en 33h
- [ ] Sync bidirectionnelle Google/Apple Calendar

### Moyenne priorité
- [ ] Strava sync auto (webhook)
- [ ] Notifications push (PWA)
- [ ] Export CSV/PDF des données
- [ ] Hall of Fame : PRs et records personnels
- [ ] Routines matinales/nocturnes

---

## Bugs résolus

| Bug | Fix |
|-----|-----|
| `FoodItem` non exporté de `food-data.ts` | Ajout `export type { FoodItem }` |
| `[...new Set()]` incompatible ES2014 | Remplacé par `Array.from(new Set(...))` |
| `media_items` table inexistante | Corrigé en `media_vault` dans Dashboard |
| FK `events(id)` dans migration V3 | FK supprimée (table créée séparément) |
| Commit git `-m` sur plusieurs lignes | Utiliser HEREDOC pour messages multi-lignes |
| `SettingsContext` rejet types JSONB | Bypass via `upsertSettings` direct |
| `AnimatePresence` tag incorrect dans ProjectsPage | Utiliser `motion.div` non `motion.key` |

---

## Gamification — Points par action

| Action | Points par défaut |
|--------|------------------|
| Séance validée | +50 |
| Objectif eau atteint | +10 |
| Repas enregistré | +15 |
| Supplément pris | +5 |
| Milestone easy | +15 |
| Milestone medium | +30 |
| Milestone hard | +50 |
| Focus 5 min | +1 |
| Focus no-phone 5 min | +1.5 |
| Sommeil score ≥80 | +20 |
| Sommeil score ≥60 | +10 |
| Uber Eats / Junk | -30 |
| Séance manquée | -20 |
| Alcool | -25 |

*Tous configurables dans Réglages > Gamification*
