import { useRef, type KeyboardEvent } from 'react'
import { router, useForm } from '@inertiajs/react'
import { Plus } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { TableCell, TableRow } from '@workspace/ui/components/table'
import { toast } from '@workspace/ui/hooks/use-toast'
import { cn } from '@workspace/ui/lib/utils'

import { urlFor } from '~/app/client'

import { inlineInputClasses } from '#common/ui/components/inline_fields'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { parseDuration } from '#rundowns/ui/components/duration'

import type { Data } from '@generated/data'

type Step = Data.Rundowns.Step.Variants['forTimeline']

export type StepTypeOption = Data.Rundowns.StepType.Variants['forOption']

type StepPayload = {
  title: string
  stepTypeId: number
  plannedDuration: number
  playedTime: string | null
  waitUntil: string | null
  autoNext: boolean
}

// The update validator needs the full step, so every inline edit resends it with one field patched.
export function saveStep(
  rundownId: number,
  step: Step,
  patch: Partial<StepPayload>,
  onError?: () => void
) {
  router.put(
    urlFor('steps.update', { rundown_id: rundownId, id: step.id }),
    {
      title: step.title,
      stepTypeId: step.stepTypeId,
      plannedDuration: step.plannedDuration,
      playedTime: step.playedTime,
      waitUntil: step.waitUntil,
      autoNext: step.autoNext,
      ...patch,
    },
    {
      preserveScroll: true,
      preserveState: true,
      onError: (errors) => {
        const first = Object.values(errors)[0]
        if (first) toast.error(first)
        onError?.()
      },
    }
  )
}

export function InlineStepTypeSelect({
  value,
  stepTypes,
  onCommit,
  ariaLabel,
  className,
}: {
  value: number
  stepTypes: StepTypeOption[]
  onCommit: (next: number) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <Select value={String(value)} onValueChange={(next) => onCommit(Number(next))}>
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={className ?? cn(inlineInputClasses, 'w-full')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {stepTypes.map((type) => (
            <SelectItem key={type.id} value={String(type.id)}>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: type.color }} />
                {type.name}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function InlineCheckbox({
  checked,
  onCommit,
  ariaLabel,
  className,
}: {
  checked: boolean
  onCommit: (next: boolean) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <Checkbox
      className={className}
      checked={checked}
      aria-label={ariaLabel}
      onCheckedChange={(next) => onCommit(next === true)}
    />
  )
}

type NewStepFormData = {
  title: string
  stepTypeId: number
  plannedDuration: string
  waitUntilEnabled: boolean
  waitUntil: string
  autoNext: boolean
}

// Last row of the steps table, cells aligned on the timeline columns: Enter adds the step and
// refocuses the title for the next one. No <form>: it can't wrap a <tr>.
export function NewStepRow({
  rundownId,
  stepTypes,
  columnCount,
  nextPlannedTime,
}: {
  rundownId: number
  stepTypes: StepTypeOption[]
  columnCount: number
  // When the new step would start if chained after the last one (HH:MM:SS).
  nextPlannedTime: string
}) {
  const { t } = useTranslation()
  const titleRef = useRef<HTMLInputElement>(null)

  const form = useForm<NewStepFormData>({
    title: '',
    stepTypeId: stepTypes[0]?.id ?? 0,
    plannedDuration: '01:00',
    waitUntilEnabled: false,
    waitUntil: '',
    autoNext: false,
  })
  form.transform(
    ({ waitUntilEnabled, waitUntil, ...data }) =>
      ({
        ...data,
        plannedDuration: parseDuration(data.plannedDuration),
        playedTime: null,
        waitUntil: waitUntilEnabled ? waitUntil : null,
      }) as unknown as NewStepFormData
  )

  const submit = () =>
    form.post(urlFor('steps.store', { rundown_id: rundownId }), {
      preserveScroll: true,
      onSuccess: () => {
        // A hard start time rarely applies to the next step too.
        form.reset('title', 'waitUntilEnabled', 'waitUntil')
        titleRef.current?.focus()
      },
    })

  const submitOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const error = Object.values(form.errors)[0]

  return (
    <>
      <TableRow
        className={cn(
          'bg-muted hover:bg-muted',
          form.data.waitUntilEnabled && 'border-t-2 border-t-primary'
        )}
      >
        <TableCell className="text-muted-foreground">
          <Plus size={14} />
        </TableCell>
        <TableCell className="text-center">
          <Checkbox
            aria-label={t('rundowns.steps.table.wait_until')}
            checked={form.data.waitUntilEnabled}
            onCheckedChange={(checked) => {
              const enabled = checked === true
              form.setData((data) => ({
                ...data,
                waitUntilEnabled: enabled,
                // Start from the time the step would get anyway, like on existing rows.
                waitUntil: enabled && data.waitUntil === '' ? nextPlannedTime : data.waitUntil,
              }))
            }}
          />
        </TableCell>
        <TableCell>
          {form.data.waitUntilEnabled ? (
            <Input
              aria-label={t('rundowns.steps.table.wait_until')}
              type="time"
              step={1}
              value={form.data.waitUntil}
              onChange={(e) => form.setData('waitUntil', e.target.value)}
              onKeyDown={submitOnEnter}
              aria-invalid={!!form.errors.waitUntil}
              className="h-7 font-mono"
            />
          ) : (
            <span className="font-mono text-muted-foreground">{nextPlannedTime}</span>
          )}
        </TableCell>
        <TableCell>
          <Input
            aria-label={t('rundowns.steps.table.planned_duration')}
            placeholder="MM:SS"
            inputMode="numeric"
            value={form.data.plannedDuration}
            onChange={(e) => form.setData('plannedDuration', e.target.value)}
            onKeyDown={submitOnEnter}
            aria-invalid={!!form.errors.plannedDuration}
            className="h-7 font-mono"
          />
        </TableCell>
        <TableCell>
          <Input
            ref={titleRef}
            aria-label={t('rundowns.steps.table.title')}
            placeholder={t('rundowns.steps.new.title_placeholder')}
            value={form.data.title}
            onChange={(e) => form.setData('title', e.target.value)}
            onKeyDown={submitOnEnter}
            aria-invalid={!!form.errors.title}
            className="h-7"
          />
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <InlineStepTypeSelect
            ariaLabel={t('rundowns.steps.table.type')}
            value={form.data.stepTypeId}
            stepTypes={stepTypes}
            onCommit={(stepTypeId) => form.setData('stepTypeId', stepTypeId)}
            className="w-full"
          />
        </TableCell>
        <TableCell className="hidden sm:table-cell" />
        <TableCell className="text-center">
          <Checkbox
            aria-label={t('rundowns.steps.table.auto_next')}
            checked={form.data.autoNext}
            onCheckedChange={(checked) => form.setData('autoNext', checked === true)}
          />
        </TableCell>
        <TableCell>
          <Button
            size="icon"
            className="size-8"
            onClick={submit}
            disabled={form.processing}
            aria-label={t('rundowns.steps.actions.add')}
            title={t('rundowns.steps.actions.add')}
          >
            <Plus size={16} />
          </Button>
        </TableCell>
      </TableRow>
      {error && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columnCount} className="text-sm text-destructive">
            {error}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
