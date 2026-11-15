import { useRef, useState, type KeyboardEvent } from 'react'
import { router, useForm } from '@inertiajs/react'
import { Plus, TrashIcon } from 'lucide-react'
import { Trans } from 'react-i18next'

import { Button } from '@workspace/ui/components/button'
import { CopyButton } from '@workspace/ui/components/copy-button'
import { ColumnDef, DataTable } from '@workspace/ui/components/data-table'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { TableCell, TableRow } from '@workspace/ui/components/table'
import { toast } from '@workspace/ui/hooks/use-toast'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import Heading from '#common/ui/components/heading'
import { InlineColorInput, InlineInput } from '#common/ui/components/inline_fields'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { CSS_VARIABLE_KINDS, type CssVariableKind } from '#graphics/enums/css_variable_kind'

import type { Data } from '@generated/data'

type CssVariableRow = Data.Graphics.CssVariable.Variants['forList']

type PageProps = InertiaProps<{
  cssVariables: CssVariableRow[]
}>

type Payload = Pick<CssVariableRow, 'name' | 'kind' | 'value'>

const DEFAULT_COLOR = '#ffffff'
const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

function prefixOf(kind: CssVariableKind) {
  return kind === 'color' ? '--color-' : '--'
}

// The update validator needs the full variable, so every inline edit resends it with one field patched.
function saveCssVariable(row: CssVariableRow, patch: Partial<Payload>, onError?: () => void) {
  router.put(
    urlFor('css_variables.update', { id: row.id }),
    { name: row.name, kind: row.kind, value: row.value, ...patch },
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

function KindSelect({
  value,
  onChange,
}: {
  value: CssVariableKind
  onChange: (kind: CssVariableKind) => void
}) {
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={(kind) => onChange(kind as CssVariableKind)}>
      <SelectTrigger size="sm" aria-label={t('graphics.css_variables.table.kind')} className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CSS_VARIABLE_KINDS.map((kind) => (
          <SelectItem key={kind} value={kind}>
            {t(`graphics.css_variables.kinds.${kind}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DeleteAction({ row }: { row: CssVariableRow }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0 text-destructive"
        onClick={() => setOpen(true)}
        aria-label={t('graphics.css_variables.actions.delete')}
        title={t('graphics.css_variables.actions.delete')}
      >
        <TrashIcon size={16} />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t('graphics.css_variables.delete.title')}
        desc={
          <Trans
            i18nKey="graphics.css_variables.delete.description"
            values={{ name: row.property }}
            components={{ strong: <strong /> }}
          />
        }
        destructive
        confirmText={t('graphics.css_variables.actions.delete')}
        handleConfirm={() =>
          router.delete(urlFor('css_variables.destroy', { id: row.id }), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
          })
        }
      />
    </>
  )
}

function NewCssVariableRow({ columnCount }: { columnCount: number }) {
  const { t } = useTranslation()
  const nameRef = useRef<HTMLInputElement>(null)

  const form = useForm<Payload>({ name: '', kind: 'color', value: DEFAULT_COLOR })

  const submit = () =>
    form.post(urlFor('css_variables.store'), {
      preserveScroll: true,
      onSuccess: () => {
        form.reset('name')
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
          <KindSelect
            value={form.data.kind}
            onChange={(kind) =>
              form.setData((data) => ({
                ...data,
                kind,
                value: kind === 'color' ? DEFAULT_COLOR : '',
              }))
            }
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-muted-foreground">{prefixOf(form.data.kind)}</span>
            <Input
              ref={nameRef}
              aria-label={t('graphics.css_variables.table.name')}
              placeholder={t('graphics.css_variables.new.name_placeholder')}
              value={form.data.name}
              onChange={(e) => form.setData('name', e.target.value)}
              onKeyDown={submitOnEnter}
              aria-invalid={!!form.errors.name}
              className="h-7"
            />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {form.data.kind === 'color' && (
              <input
                type="color"
                aria-label={t('graphics.css_variables.table.color')}
                value={isHexColor(form.data.value) ? form.data.value : DEFAULT_COLOR}
                onChange={(e) => form.setData('value', e.target.value)}
                className="h-7 w-10 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
              />
            )}
            <Input
              aria-label={t('graphics.css_variables.table.value')}
              placeholder={t(`graphics.css_variables.new.value_placeholder.${form.data.kind}`)}
              value={form.data.value}
              onChange={(e) => form.setData('value', e.target.value)}
              onKeyDown={submitOnEnter}
              aria-invalid={!!form.errors.value}
              className="h-7 font-mono"
            />
          </div>
        </TableCell>
        <TableCell />
        <TableCell>
          <Button
            size="icon"
            className="size-8"
            onClick={submit}
            disabled={form.processing}
            aria-label={t('graphics.css_variables.actions.add')}
            title={t('graphics.css_variables.actions.add')}
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

export default function CssVariablesPage({ cssVariables }: PageProps) {
  const { t } = useTranslation()

  const columns: ColumnDef<CssVariableRow>[] = [
    {
      id: 'kind',
      header: t('graphics.css_variables.table.kind'),
      meta: { columnClasses: 'w-[136px]' },
      cell: ({ row }) => (
        <KindSelect
          value={row.original.kind}
          onChange={(kind) => saveCssVariable(row.original, { kind })}
        />
      ),
    },
    {
      id: 'name',
      header: t('graphics.css_variables.table.name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 font-mono">
          <span className="text-muted-foreground">{prefixOf(row.original.kind)}</span>
          <InlineInput
            aria-label={t('graphics.css_variables.table.name')}
            value={row.original.name}
            onCommit={(name, revert) => saveCssVariable(row.original, { name }, revert)}
          />
        </div>
      ),
    },
    {
      id: 'value',
      header: t('graphics.css_variables.table.value'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.kind === 'color' &&
            (isHexColor(row.original.value) ? (
              <InlineColorInput
                ariaLabel={t('graphics.css_variables.table.color')}
                value={row.original.value}
                onCommit={(value) => saveCssVariable(row.original, { value })}
              />
            ) : (
              // The native picker only speaks #rrggbb: other notations just get a swatch.
              <span
                className="h-7 w-10 shrink-0 rounded border"
                style={{ background: row.original.value }}
              />
            ))}
          <InlineInput
            aria-label={t('graphics.css_variables.table.value')}
            value={row.original.value}
            onCommit={(value, revert) => saveCssVariable(row.original, { value }, revert)}
            className="font-mono"
          />
        </div>
      ),
    },
    {
      id: 'usage',
      header: t('graphics.css_variables.table.usage'),
      cell: ({ row }) => {
        const usage = `var(${row.original.property})`
        return (
          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            {usage}
            <CopyButton
              content={usage}
              variant="ghost"
              size="sm"
              aria-label={t('graphics.css_variables.actions.copy')}
            />
          </span>
        )
      },
    },
    {
      id: 'actions',
      meta: { columnClasses: 'w-[52px]' },
      cell: ({ row }) => <DeleteAction row={row.original} />,
    },
  ]

  return (
    <AdminLayout
      breadcrumbs={[
        { label: t('common.layout.navMain.graphics') },
        { label: t('graphics.css_variables.page.title') },
      ]}
    >
      <Main>
        <Heading
          title={t('graphics.css_variables.page.title')}
          description={t('graphics.css_variables.page.description')}
        />

        <div className="flex-1 overflow-auto px-1 py-1">
          <DataTable
            columns={columns}
            data={cssVariables}
            t={t}
            footer={<NewCssVariableRow columnCount={columns.length} />}
          />
        </div>
      </Main>
    </AdminLayout>
  )
}
