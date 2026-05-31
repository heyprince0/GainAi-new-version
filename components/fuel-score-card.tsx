import { Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface FuelScoreCardProps {
  todayScore: number | null
  yesterdayScore: number | null
  hasMealsLogged: boolean
}

export function FuelScoreCard({
  todayScore,
  yesterdayScore,
  hasMealsLogged,
}: FuelScoreCardProps) {
  const diff =
    todayScore !== null && yesterdayScore !== null ? todayScore - yesterdayScore : null

  // Score label logic
  let scoreLabel = ''
  let scoreColor = ''
  if (todayScore !== null) {
    if (todayScore >= 90) {
      scoreLabel = '🔥 Excellent, Keep it up!'
      scoreColor = '#22c55e'
    } else if (todayScore >= 70) {
      scoreLabel = '✅ Good'
      scoreColor = '#86efac'
    } else if (todayScore >= 50) {
      scoreLabel = `Need focus`
      scoreColor = '#facc15'
    } else {
      scoreLabel = `Cut Out Junk Food`
      scoreColor = '#ef4444'
    }
  }

  // Diff line logic
  let diffText = ''
  let diffColor = ''
  if (diff !== null) {
    if (diff > 0) {
      diffText = `↑ +${diff}% Better today`
      diffColor = '#22c55e'
    } else if (diff < 0) {
      diffText = `↓ ${diff}% Dropped today`
      diffColor = '#ef4444'
    } else {
      diffText = '→ Same as yesterday'
      diffColor = 'var(--color-muted-foreground)'
    }
  } else if (hasMealsLogged) {
    diffText = 'First time tracking!'
    diffColor = 'var(--color-muted-foreground)'
  } else {
    diffText = 'Log a meal to get your score'
    diffColor = 'var(--color-muted-foreground)'
  }

  return (
    <Card className='border-border/50'>
      <CardContent className='p-4'>
        <div className='mb-2 flex items-center gap-2'>
          <Zap className='h-4 w-4 text-primary' />
          <span className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
            Diet Accuracy
          </span>
        </div>
        <p className='text-xl font-bold text-foreground'>
  {todayScore !== null ? `${todayScore}%` : yesterdayScore !== null ? `${yesterdayScore}%` : '—'}
</p>
        {scoreLabel && (
          <p className='mt-0.5 text-[10px] text-foreground' style={{ color: scoreColor }}>
            {scoreLabel}
          </p>
        )}
        <p className='text-[10px]' style={{ color: diffColor }}>
          {diffText}
        </p>
      </CardContent>
    </Card>
  )
}
