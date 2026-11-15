import { useState } from 'react'
import { router } from '@inertiajs/react'
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  EditIcon,
  EllipsisIcon,
  Link2,
  ListClock,
  TrashIcon,
} from 'lucide-react'
import { ModalLink } from 'adonis-inertia-modal/react'

import { Button, buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import {
  ColumnDef,
  DataTable,
  type DataTableRowActionsProps,
} from '@workspace/ui/components/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'

import type { InertiaProps } from '#core/ui/types'

import AuthenticatedLayout from '#common/ui/components/authenticated_layout'
import Heading from '#common/ui/components/heading'
import { Main } from '#common/ui/components/main'
import { InlineInput } from '#common/ui/components/inline_fields'
import useCan from '#common/ui/hooks/use_can'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { DeleteDialog } from '#rundowns/ui/components/delete_dialog'
import { addSeconds, formatDuration, parseDuration } from '#rundowns/ui/components/duration'
import {
  InlineCheckbox,
  InlineStepTypeSelect,
  NewStepRow,
  saveStep,
  type StepTypeOption,
} from '#rundowns/ui/components/step_inline_fields'

import type { Data } from '@generated/data'

type StepRow = Data.Rundowns.Step.Variants['forTimeline']

type PageProps = InertiaProps<{
  rundown: Data.Rundowns.Rundown.Variants['forShow']
  steps: StepRow[]
  stepTypes: StepTypeOption[]
}>

function StepRowActions({
  row,
  rundownId,
}: DataTableRowActionsProps<StepRow> & { rundownId: number }) {
  const { t } = useTranslation()
  const [openDelete, setOpenDelete] = useState(false)
  const step = row.original

  const move = (direction: 'up' | 'down') =>
    router.post(
      urlFor('steps.move', { rundown_id: rundownId, id: step.id }),
      { direction },
      { preserveScroll: true }
    )

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <EllipsisIcon className="h-4 w-4" />
            <span className="sr-only">{t('rundowns.actions.open_menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={() => move('up')}>
            {t('rundowns.steps.actions.move_up')}
            <DropdownMenuShortcut>
              <ArrowUp size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => move('down')}>
            {t('rundowns.steps.actions.move_down')}
            <DropdownMenuShortcut>
              <ArrowDown size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-destructive">
            {t('rundowns.actions.delete')}
            <DropdownMenuShortcut>
              <TrashIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        url={urlFor('steps.destroy', { rundown_id: rundownId, id: step.id })}
        name={step.title}
        titleKey="rundowns.steps.delete.title"
        descriptionKey="rundowns.steps.delete.description"
      />
    </>
  )
}

export default function ShowRundownPage({ rundown, steps, stepTypes }: PageProps) {
  const { t } = useTranslation()
  const { manageRundowns: canManage } = useCan()

  const lastStep = steps.at(-1)
  const nextPlannedTime = lastStep
    ? addSeconds(lastStep.plannedPlayTime, lastStep.plannedDuration)
    : rundown.startTime

  const columns: ColumnDef<StepRow>[] = [
    {
      id: 'order',
      header: '#',
      meta: { columnClasses: 'relative w-[48px] text-muted-foreground' },
      cell: ({ row }) => (
        <>
          <span className="inline-block w-5 text-center">{row.index + 1}</span>
          {row.original.autoNext && row.index < steps.length - 1 && (
            // Straddles the border with the next row to show the two steps are chained.
            <span
              className="absolute bottom-0 left-2 z-10 flex w-5 translate-y-1/2 justify-center"
              title={t('rundowns.steps.table.auto_next')}
            >
              <span className="flex size-6 items-center justify-center rounded-full border bg-background text-foreground shadow-xs">
                <Link2
                  size={16}
                  aria-label={t('rundowns.steps.table.auto_next')}
                  className="rotate-90"
                />
              </span>
            </span>
          )}
        </>
      ),
    },
    {
      id: 'waitUntil',
      header: () => (
        <ListClock
          size={16}
          aria-label={t('rundowns.steps.table.wait_until')}
          className="mx-auto"
        />
      ),
      meta: { columnClasses: 'w-[44px] text-center' },
      cell: ({ row }) =>
        canManage ? (
          <InlineCheckbox
            ariaLabel={t('rundowns.steps.table.wait_until')}
            checked={row.original.waitUntil !== null}
            // Checking freezes the currently computed time as the hard start time.
            onCommit={(checked) =>
              saveStep(rundown.id, row.original, {
                waitUntil: checked ? row.original.plannedPlayTime : null,
              })
            }
          />
        ) : (
          row.original.waitUntil !== null && (
            <ListClock
              size={14}
              className="mx-auto text-muted-foreground"
              aria-label={t('rundowns.steps.table.wait_until')}
            />
          )
        ),
    },
    {
      id: 'plannedPlayTime',
      header: t('rundowns.steps.table.planned_play_time'),
      meta: { columnClasses: 'w-[130px]' },
      cell: ({ row }) =>
        canManage && row.original.waitUntil !== null ? (
          <InlineInput
            aria-label={t('rundowns.steps.table.wait_until')}
            type="time"
            step={1}
            value={row.original.waitUntil}
            onCommit={(value, revert) => {
              if (value === '') return revert()
              saveStep(rundown.id, row.original, { waitUntil: value }, revert)
            }}
            className="border-input font-mono"
          />
        ) : (
          <span className="font-mono">{row.original.plannedPlayTime}</span>
        ),
    },
    {
      id: 'plannedDuration',
      header: t('rundowns.steps.table.planned_duration'),
      meta: { columnClasses: 'w-[110px]' },
      cell: ({ row }) =>
        canManage ? (
          <InlineInput
            aria-label={t('rundowns.steps.table.planned_duration')}
            placeholder="MM:SS"
            inputMode="numeric"
            value={formatDuration(row.original.plannedDuration)}
            onCommit={(value, revert) =>
              saveStep(rundown.id, row.original, { plannedDuration: parseDuration(value) }, revert)
            }
            className="font-mono"
          />
        ) : (
          <span className="font-mono">{formatDuration(row.original.plannedDuration)}</span>
        ),
    },
    {
      id: 'title',
      header: t('rundowns.steps.table.title'),
      cell: ({ row }) =>
        canManage ? (
          <InlineInput
            aria-label={t('rundowns.steps.table.title')}
            value={row.original.title}
            onCommit={(title, revert) => saveStep(rundown.id, row.original, { title }, revert)}
            className="font-medium"
          />
        ) : (
          <span className="block truncate font-medium">{row.original.title}</span>
        ),
    },
    {
      id: 'type',
      header: t('rundowns.steps.table.type'),
      meta: { columnClasses: 'hidden md:table-cell w-[180px]' },
      cell: ({ row }) =>
        canManage ? (
          <InlineStepTypeSelect
            ariaLabel={t('rundowns.steps.table.type')}
            value={row.original.stepTypeId}
            stepTypes={stepTypes}
            onCommit={(stepTypeId) => saveStep(rundown.id, row.original, { stepTypeId })}
          />
        ) : (
          row.original.stepType.name
        ),
    },
    {
      id: 'playedTime',
      header: t('rundowns.steps.table.played_time'),
      meta: { columnClasses: 'hidden sm:table-cell w-[130px]' },
      cell: ({ row }) =>
        canManage ? (
          <InlineInput
            aria-label={t('rundowns.steps.table.played_time')}
            type="time"
            step={1}
            value={row.original.playedTime ?? ''}
            onCommit={(value, revert) =>
              saveStep(
                rundown.id,
                row.original,
                { playedTime: value === '' ? null : value },
                revert
              )
            }
            className="font-mono"
          />
        ) : row.original.playedTime ? (
          <span className="font-mono">{row.original.playedTime}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'autoNext',
      header: () => (
        <span title={t('rundowns.steps.table.auto_next')}>
          <Link2 />
        </span>
      ),
      meta: { columnClasses: 'w-[60px] text-center' },
      cell: ({ row }) =>
        canManage ? (
          <InlineCheckbox
            className=""
            ariaLabel={t('rundowns.steps.table.auto_next')}
            checked={row.original.autoNext}
            onCommit={(autoNext) => saveStep(rundown.id, row.original, { autoNext })}
          />
        ) : (
          row.original.autoNext && (
            <ArrowDownToLine
              size={14}
              className="mx-auto text-muted-foreground"
              aria-label={t('rundowns.steps.table.auto_next')}
            />
          )
        ),
    },
    ...(canManage
      ? [
          {
            id: 'actions',
            meta: { columnClasses: 'w-[52px]' },
            cell: (props) => <StepRowActions {...props} rundownId={rundown.id} />,
          } satisfies ColumnDef<StepRow>,
        ]
      : []),
  ]

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: t('rundowns.index.title'), href: urlFor('rundowns.index') },
        { label: rundown.name },
      ]}
    >
      <Main>
        <Heading
          title={rundown.name}
          description={t('rundowns.show.starts_at', { time: rundown.startTime })}
        >
          {canManage && (
            <ModalLink
              href={urlFor('rundowns.edit', { id: rundown.id })}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <span>{t('rundowns.actions.edit')}</span>
              <EditIcon size={16} />
            </ModalLink>
          )}
        </Heading>

        <div className="flex-1 overflow-auto px-1 py-1">
          <DataTable
            columns={columns}
            data={steps}
            t={t}
            pagination={false}
            showEmptyRow={false}
            getRowProps={(row) => ({
              // A hard start time breaks the chain with the previous step: mark the boundary.
              className: cn(row.original.waitUntil !== null && 'border-t-2 border-t-primary'),
              // Faint tint of the step type color so the timeline reads at a glance.
              style: {
                backgroundColor: `color-mix(in srgb, ${row.original.stepType.color} 12%, transparent)`,
              },
            })}
            footer={
              canManage && (
                <NewStepRow
                  rundownId={rundown.id}
                  stepTypes={stepTypes}
                  columnCount={columns.length}
                  nextPlannedTime={nextPlannedTime}
                />
              )
            }
          />
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
