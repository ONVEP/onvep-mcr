import { test } from '@japa/runner'

import { plannedPlayTimes } from '#rundowns/services/planned_play_times'

const step = (
  plannedDuration: number,
  playedTime: string | null = null,
  waitUntil: string | null = null
) => ({
  plannedDuration,
  playedTime,
  waitUntil,
})

test.group('plannedPlayTimes', () => {
  test('retourne une liste vide sans steps', ({ assert }) => {
    assert.deepEqual(plannedPlayTimes('10:00:00', []), [])
  })

  test('enchaîne les durées depuis le start_time du rundown', ({ assert }) => {
    assert.deepEqual(plannedPlayTimes('10:00:00', [step(90), step(30), step(600)]), [
      '10:00:00',
      '10:01:30',
      '10:02:00',
    ])
  })

  test('repart du played_time de la dernière step jouée', ({ assert }) => {
    // Step 2 started 15s late; everything after shifts with it.
    const times = plannedPlayTimes('10:00:00', [
      step(60, '10:00:00'),
      step(60, '10:01:15'),
      step(30),
      step(30),
    ])
    assert.deepEqual(times, ['10:00:00', '10:01:15', '10:02:15', '10:02:45'])
  })

  test('une step jouée a pour heure prévue son played_time', ({ assert }) => {
    assert.deepEqual(plannedPlayTimes('10:00:00', [step(60), step(60, '09:59:00')]), [
      '10:00:00',
      '09:59:00',
    ])
  })

  test('une step avec wait_until démarre à cette heure et décale la suite', ({ assert }) => {
    const times = plannedPlayTimes('10:00:00', [step(60), step(30, null, '10:05:00'), step(30)])
    assert.deepEqual(times, ['10:00:00', '10:05:00', '10:05:30'])
  })

  test('wait_until peut avancer le planning si la step précédente déborde', ({ assert }) => {
    const times = plannedPlayTimes('10:00:00', [step(600), step(30, null, '10:05:00')])
    assert.deepEqual(times, ['10:00:00', '10:05:00'])
  })

  test('le played_time prime sur wait_until', ({ assert }) => {
    const times = plannedPlayTimes('10:00:00', [
      step(60),
      step(30, '10:06:10', '10:05:00'),
      step(30),
    ])
    assert.deepEqual(times, ['10:00:00', '10:06:10', '10:06:40'])
  })

  test('passe minuit', ({ assert }) => {
    assert.deepEqual(plannedPlayTimes('23:59:00', [step(90), step(10)]), ['23:59:00', '00:00:30'])
  })
})
