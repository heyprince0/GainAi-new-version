# GainAi — AI-Powered Nutrition & Fitness Platform

> **Live at [gain-ai.vercel.app](https://gain-ai.vercel.app)**

GainAi is a full-stack AI fitness web app that helps gym members track nutrition, monitor body composition, and follow AI-generated workout plans. Built for gym owners as a B2B SaaS product — one subscription gives unlimited members access.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + Auth) |
| AI Model | Google Gemini 2.5 Flash |
| Deployment | Vercel |

---

## Core Features

### 🍽️ Food Scanner
- Upload or capture a meal photo
- Gemini AI analyzes the image and returns full macro breakdown (calories, protein, carbs, fats, fiber)
- Each meal gets a **health score (1–10)** and fitness-specific AI note
- Results saved to Supabase with IST timezone handling

### ⚡ Diet Accuracy Score (Fuel Score)
A persistent, cumulative nutrition score that reflects your overall diet quality over time.

**Algorithm:**
```
todayRawScore = (MacroScore × 50%) + (FoodQualityScore × 50%)

MacroScore     = average of 4 macro scores (calories, protein, carbs, fats)
                 — penalizes going over goal, not just under
FoodQualityScore = average health_score of all today's meals (normalized 0–100)

todayEffect    = ((todayRawScore - 50) / 50) × 25   → range: -25 to +25
fuelScore      = yesterdayScore + todayEffect         → clamped 0–100
```

- Score **carries forward** daily — never resets
- Eating clean pushes it up, junk food pulls it down
- New users start at 50%
- Comparison line shows delta vs yesterday (↑ up / ↓ down)

### 🏋️ AI Workout Planner
- AI generates a personalized weekly workout plan based on user profile
- Powered by Gemini API with structured JSON output
- Workout completion tracked per day

### 📊 Body Scanner
- Log body fat %, weight, and measurements over time
- Progress tracked and visualized on the Body tab

### 🔐 Access Control (Gym Owner Feature)
- Gym owners whitelist member phone numbers
- Only whitelisted members can create accounts
- Gym admin dashboard to manage members

---

## Project Structure

```
/app
  /dashboard        → Main member dashboard
  /food-scanner     → Food photo upload + AI analysis
  /body             → Body composition tracker
  /api/gemini       → Server-side Gemini API route

/components
  /fuel-score-card  → Diet Accuracy Score display card
  /dashboard        → Dashboard layout + stat cards
  /food-scanner     → Scanner UI component

/lib
  /fuel-score.ts    → Fuel score calculation + Supabase upsert
  /auth-context.tsx → Supabase auth provider
  /supabase.ts      → Supabase client
```

---

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile, macro goals, gym assignment |
| `food_scans` | Every scanned meal with macros + health_score |
| `fuel_scores` | Daily diet accuracy scores (one row per user per day) |
| `body_scans` | Body fat %, weight, measurements over time |
| `workout_plans` | AI-generated weekly workout plans |
| `gym_members` | Whitelisted phone numbers per gym |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

---

## Running Locally

```bash
git clone https://github.com/heyPrakash/GainAi-new-version
cd GainAi-new-version
npm install
cp .env.example .env.local
# Add your environment variables
npm run dev
```

---

## Business Model

- **B2B SaaS** — sold to gym owners at ₹999/month
- Unlimited members per gym subscription
- Gym owner gets admin dashboard to manage member access
- Members use the full app for free under their gym's plan

---

## Author

Built by **Prakash Jadhav** — 17-year-old solo founder building [Anthora](https://github.com/heyPrakash).

> *"i made it..."* — the original README, preserved for posterity.
