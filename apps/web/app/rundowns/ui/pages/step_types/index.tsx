import { useRef, useState, type KeyboardEvent } from 'react'
import { router, useForm } from '@inertiajs/react'
import { Plus, TrashIcon } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { ColumnDef, DataTable } from '@workspace/ui/components/data-table'
import { Input } from '@workspace/ui/components/input'
import { TableCell, TableRow } from '@workspace/ui/components/table'
import { toast } from '@workspace/ui/hooks/use-toast'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import Heading from '#common/ui/components/heading'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { DeleteDialog } from '#rundowns/ui/components/delete_dialog'
import { InlineColorInput, InlineInput } from '#rundowns/ui/components/step_inline_fields'

import type { Data } from '@generated/data'

type StepTypeRow = Data.Rundowns.StepType.Variants['forList']

type PageProps = InertiaProps<{
  stepTypes: StepTypeRow[]
}>

function saveStepType(
  stepType: StepTypeRow,
  patch: Partial<Pick<StepTypeRow, 'name' | 'color'>>,
  onError?: () => void
) {
  router.put(
    urlFor('step_types.update', { id: stepType.id }),
    { name: stepType.name, color: stepType.color, ...patch },
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

function DeleteAction({ stepType }: { stepType: StepTypeRow }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0 text-destructive"
        onClick={() => setOpen(true)}
        aria-label={t('rundowns.actions.delete')}
        title={t('rundowns.actions.delete')}
      >
        <TrashIcon size={16} />
      </Button>
      <DeleteDialog
        open={open}
        onOpenChange={setOpen}
        url={urlFor('step_types.destroy', { id: stepType.id })}
        name={stepType.name}
        titleKey="rundowns.step_types.delete.title"
        descriptionKey="rundowns.step_types.delete.description"
      />
    </>
  )
}

function NewStepTypeRow({ columnCount }: { columnCount: number }) {
  const { t } = useTranslation()
  const nameRef = useRef<HTMLInputElement>(null)

  const form = useForm({ name: '', color: '#64748b' })

  const submit = () =>
    form.post(urlFor('step_types.store'), {
      preserveScroll: true,
      onSuccess: () => {
        form.reset()
        nameRef.current?.focus()
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
      <TableRow className="hover:bg-transparent">
        <TableCell>
          <input
            type="color"
            aria-label={t('rundowns.step_types.table.color')}
            value={form.data.color}
            onChange={(e) => form.setData('color', e.target.value)}
            className="h-7 w-10 cursor-pointer rounded border bg-transparent p-0.5"
          />
        </TableCell>
        <TableCell>
          <Input
            ref={nameRef}
            aria-label={t('rundowns.step_types.table.name')}
            placeholder={t('rundowns.step_types.new.name_placeholder')}
            value={form.data.name}
            onChange={(e) => form.setData('name', e.target.value)}
            onKeyDown={submitOnEnter}
            aria-invalid={!!form.errors.name}
            className="h-7"
          />
        </TableCell>
        <TableCell>
          <Button
            size="icon"
            className="size-8"
            onClick={submit}
            disabled={form.processing}
            aria-label={t('rundowns.step_types.actions.add')}
            title={t('rundowns.step_types.actions.add')}
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

export default function ListStepTypesPage({ stepTypes }: PageProps) {
  const { t } = useTranslation()

  const columns: ColumnDef<StepTypeRow>[] = [
    {
      id: 'color',
      header: t('rundowns.step_types.table.color'),
      meta: { columnClasses: 'w-[72px]' },
      cell: ({ row }) => (
        <InlineColorInput
          ariaLabel={t('rundowns.step_types.table.color')}
          value={row.original.color}
          onCommit={(color) => saveStepType(row.original, { color })}
        />
      ),
    },
    {
      id: 'name',
      header: t('rundowns.step_types.table.name'),
      cell: ({ row }) => (
        <InlineInput
          aria-label={t('rundowns.step_types.table.name')}
          value={row.original.name}
          onCommit={(name, revert) => saveStepType(row.original, { name }, revert)}
          className="font-medium"
        />
      ),
    },
    {
      id: 'actions',
      meta: { columnClasses: 'w-[52px]' },
      cell: ({ row }) => <DeleteAction stepType={row.original} />,
    },
  ]

  return (
    <AdminLayout breadcrumbs={[{ label: t('rundowns.step_types.page.title') }]}>
      <Main>
        <Heading
          title={t('rundowns.step_types.page.title')}
          description={t('rundowns.step_types.page.description')}
        />

        <div className="flex-1 overflow-auto px-1 py-1">
          <DataTable
            columns={columns}
            data={stepTypes}
            t={t}
            getRowProps={(row) => ({
              style: {
                backgroundColor: `color-mix(in srgb, ${row.original.color} 12%, transparent)`,
              },
            })}
            footer={<NewStepTypeRow columnCount={columns.length} />}
          />
        </div>
      </Main>
    </AdminLayout>
  )
}
