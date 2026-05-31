import { supabase } from '@/lib/supabase'

interface Profile {
  calorie_goal: number
  protein_goal: number
  carbs_goal?: number
  fat_goal?: number
}

interface FoodScan {
  calories: number
  protein: number
  carbs: number
  fats: number
  health_score?: number
  scanned_at: string
}

export const saveFuelScore = async (
  userId: string,
  profile: Profile,
  updatedTodayScans: FoodScan[]
) => {
  const istDateKey = (iso: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(iso))

  const scoreDate = istDateKey(new Date().toISOString())

  // ── Step 1: Fetch yesterday's score ───────────────────────
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayDate = istDateKey(yesterday.toISOString())

  const { data: yesterdayRow } = await supabase
    .from('fuel_scores')
    .select('fuel_score')
    .eq('user_id', userId)
    .eq('score_date', yesterdayDate)
    .single()

  const baseScore = yesterdayRow?.fuel_score ?? 50

  // ── Step 2: Sum today's macros ────────────────────────────
  const totalCalories = updatedTodayScans.reduce((s, x) => s + (x.calories ?? 0), 0)
  const totalProtein  = updatedTodayScans.reduce((s, x) => s + (x.protein ?? 0), 0)
  const totalCarbs    = updatedTodayScans.reduce((s, x) => s + (x.carbs ?? 0), 0)
  const totalFats     = updatedTodayScans.reduce((s, x) => s + (x.fats ?? 0), 0)

  // ── Step 3: Macro score (0-100) ───────────────────────────
  const scoreWithPenalty = (actual: number, goal: number): number => {
    if (!goal) return 0
    if (actual <= goal) return (actual / goal) * 100
    return Math.max(0, 100 - ((actual - goal) / goal) * 100)
  }

  const calorieScore = scoreWithPenalty(totalCalories, profile.calorie_goal)
  const proteinScore = scoreWithPenalty(totalProtein,  profile.protein_goal)
  const carbsScore   = scoreWithPenalty(totalCarbs,    profile.carbs_goal ?? 1)
  const fatsScore    = scoreWithPenalty(totalFats,     profile.fat_goal ?? 1)
  const macroScore   = (calorieScore + proteinScore + carbsScore + fatsScore) / 4

  // ── Step 4: Food quality score (0-100) ────────────────────
  const scansWithScore = updatedTodayScans.filter(
    s => s.health_score != null && s.health_score > 0
  )
  const avgHealthRaw = scansWithScore.length > 0
    ? scansWithScore.reduce((s, x) => {
        const n = (x.health_score ?? 0) > 10
          ? (x.health_score ?? 0) / 10
          : (x.health_score ?? 0)
        return s + n
      }, 0) / scansWithScore.length
    : 5
  const qualityScore = (avgHealthRaw / 10) * 100

  // ── Step 5: Combined today raw score (0-100) ──────────────
  const todayRawScore = (macroScore * 0.50) + (qualityScore * 0.50)

  // ── Step 6: Effect on base score (-25 to +25) ─────────────
  // todayRawScore 100 → +25 (great day, score goes up)
  // todayRawScore 50  →   0 (average day, no change)
  // todayRawScore 0   → -25 (terrible day, score drops)
  const todayEffect = Math.round(((todayRawScore - 50) / 50) * 25)
const finalEffect = qualityScore < 50 && todayEffect > 0 ? 0 : todayEffect

  // ── Step 7: Final score clamped 0-100 ─────────────────────
  const fuelScore = Math.min(100, Math.max(0, baseScore + finalEffect))

  // ── Step 8: Save ──────────────────────────────────────────
  await supabase.from('fuel_scores').upsert({
    user_id: userId,
    score_date: scoreDate,
    fuel_score: fuelScore,
    calorie_score: calorieScore,
    protein_score: proteinScore,
    carbs_score: carbsScore,
    fats_score: fatsScore,
    quality_score: qualityScore,
    total_calories: totalCalories,
    total_protein: totalProtein,
    total_carbs: totalCarbs,
    total_fats: totalFats,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,score_date' })
}
