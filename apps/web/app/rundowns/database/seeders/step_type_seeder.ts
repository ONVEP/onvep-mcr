import { BaseSeeder } from '@adonisjs/lucid/seeders'

import StepType from '#rundowns/models/step_type'

const DEFAULT_STEP_TYPES = [
  { name: '-', color: '#ffffff' },
  { name: 'Live', color: '#ef4444' },
  { name: 'Video', color: '#3b82f6' },
  { name: 'Jingle', color: '#f59e0b' },
  { name: 'Interview', color: '#10b981' },
  { name: 'Ad', color: '#8b5cf6' },
]

export default class StepTypeSeeder extends BaseSeeder {
  async run() {
    await StepType.updateOrCreateMany('name', DEFAULT_STEP_TYPES)
  }
}
