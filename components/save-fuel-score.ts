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

  const totalCalories = updatedTodayScans.reduce((s, x) => s + (x.calories ?? 0), 0)
  const totalProtein  = updatedTodayScans.reduce((s, x) => s + (x.protein ?? 0), 0)
  const totalCarbs    = updatedTodayScans.reduce((s, x) => s + (x.carbs ?? 0), 0)
  const totalFats     = updatedTodayScans.reduce((s, x) => s + (x.fats ?? 0), 0)

  const scoreWithPenalty = (actual: number, goal: number) => {
    if (!goal) return 0
    if (actual <= goal) return (actual / goal) * 100
    return Math.max(0, 100 - ((actual - goal) / goal) * 100)
  }

  const calorieScore = scoreWithPenalty(totalCalories, profile.calorie_goal) * 0.20
  const proteinScore = scoreWithPenalty(totalProtein,  profile.protein_goal) * 0.25
  const carbsScore   = scoreWithPenalty(totalCarbs,    profile.carbs_goal ?? 1) * 0.15
  const fatsScore    = scoreWithPenalty(totalFats,     profile.fat_goal ?? 1) * 0.10
  const macroScore   = calorieScore + proteinScore + carbsScore + fatsScore

  const scansWithScore = updatedTodayScans.filter(s => s.health_score != null && s.health_score > 0)
  const avgHealthRaw = scansWithScore.length > 0
    ? scansWithScore.reduce((s, x) => {
        const n = (x.health_score ?? 0) > 10
          ? (x.health_score ?? 0) / 10
          : (x.health_score ?? 0)
        return s + n
      }, 0) / scansWithScore.length
    : 5
  const qualityScore = (avgHealthRaw / 10) * 100 * 0.30

  const fuelScore = Math.round(macroScore + qualityScore)

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
