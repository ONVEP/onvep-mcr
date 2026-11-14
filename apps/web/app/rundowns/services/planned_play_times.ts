import { secondsToTime, timeToSeconds } from '#rundowns/services/time_of_day'

export interface TimelineStep {
  plannedDuration: number
  playedTime: string | null
  waitUntil: string | null
}

/**
 * Planned start time of each step, in order. The clock starts at the rundown's
 * start time and is re-anchored on every step that has actually been played,
 * so steps after the last played one are projected from when it really started.
 * A step with `waitUntil` re-anchors on that hard time unless it has been played:
 * what really happened always wins over the plan.
 */
export function plannedPlayTimes(startTime: string, steps: TimelineStep[]): string[] {
  let cursor = timeToSeconds(startTime)

  return steps.map((step) => {
    if (step.playedTime !== null) cursor = timeToSeconds(step.playedTime)
    else if (step.waitUntil !== null) cursor = timeToSeconds(step.waitUntil)
    const planned = secondsToTime(cursor)
    cursor += step.plannedDuration
    return planned
  })
}
