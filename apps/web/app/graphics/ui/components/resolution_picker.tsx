import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Input } from '@workspace/ui/components/input'

import { useTranslation } from '#common/ui/hooks/use_translation'

export interface Resolution {
  width: number
  height: number
}

export const DEFAULT_RESOLUTION: Resolution = { width: 1920, height: 1080 }

const PRESETS: Resolution[] = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 3840, height: 2160 },
  { width: 1080, height: 1920 },
]

const key = (r: Resolution) => `${r.width}x${r.height}`

export function ResolutionPicker({
  value,
  onChange,
}: {
  value: Resolution
  onChange: (value: Resolution) => void
}) {
  const { t } = useTranslation()
  const preset = PRESETS.find((p) => key(p) === key(value))

  const setDimension = (dimension: keyof Resolution, raw: string) => {
    const n = Number(raw)
    if (Number.isInteger(n) && n > 0 && n <= 8192) onChange({ ...value, [dimension]: n })
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={preset ? key(preset) : 'custom'}
        onValueChange={(next) => {
          const found = PRESETS.find((p) => key(p) === next)
          if (found) onChange(found)
        }}
      >
        <SelectTrigger size="sm" aria-label={t('graphics.preview.resolution')} className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={key(p)} value={key(p)}>
              {p.width} × {p.height}
            </SelectItem>
          ))}
          <SelectItem value="custom" disabled>
            {t('graphics.preview.custom')}
          </SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        aria-label={t('graphics.preview.width')}
        value={value.width}
        onChange={(e) => setDimension('width', e.target.value)}
        className="h-7 w-20 font-mono"
      />
      <span className="text-muted-foreground">×</span>
      <Input
        type="number"
        aria-label={t('graphics.preview.height')}
        value={value.height}
        onChange={(e) => setDimension('height', e.target.value)}
        className="h-7 w-20 font-mono"
      />
    </div>
  )
}
