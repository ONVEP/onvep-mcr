import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Save, TrashIcon } from 'lucide-react'
import { Trans } from 'react-i18next'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { CopyButton } from '@workspace/ui/components/copy-button'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Textarea } from '@workspace/ui/components/textarea'
import { toast } from '@workspace/ui/hooks/use-toast'

import { ConfirmDialog } from '#common/ui/components/confirm_dialog'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { JsonValue } from '#context/types/engine'
import { CodeEditor } from '#context/ui/components/code_editor'
import { joinPath, kindOf, parentPath, sameJson, type JsonKind } from '#context/ui/utils/json_tree'

const KINDS: JsonKind[] = ['string', 'number', 'boolean', 'null', 'object', 'array']

type Draft = { kind: JsonKind; text: string; bool: boolean }

function draftFrom(value: JsonValue): Draft {
  const kind = kindOf(value)
  return {
    kind,
    text:
      kind === 'string'
        ? (value as string)
        : kind === 'number'
          ? String(value)
          : kind === 'object' || kind === 'array'
            ? JSON.stringify(value, null, 2)
            : '',
    bool: value === true,
  }
}

function retype(draft: Draft, kind: JsonKind): Draft {
  if (kind === 'object') return { kind, text: '{}', bool: false }
  if (kind === 'array') return { kind, text: '[]', bool: false }
  if (kind === 'number') {
    return {
      kind,
      text: draft.kind === 'string' && draft.text.trim() !== '' ? draft.text : '0',
      bool: false,
    }
  }
  if (kind === 'string') {
    return { kind, text: draft.kind === 'number' ? draft.text : '', bool: false }
  }
  return { kind, text: '', bool: draft.bool }
}

type Parsed = { ok: true; value: JsonValue } | { ok: false; error: string }

function parse(draft: Draft, t: ReturnType<typeof useTranslation>['t']): Parsed {
  switch (draft.kind) {
    case 'string':
      return { ok: true, value: draft.text }
    case 'number': {
      const value = Number(draft.text)
      return draft.text.trim() !== '' && Number.isFinite(value)
        ? { ok: true, value }
        : { ok: false, error: t('context.explorer.invalid_number') }
    }
    case 'boolean':
      return { ok: true, value: draft.bool }
    case 'null':
      return { ok: true, value: null }
    default:
      try {
        const value = JSON.parse(draft.text) as JsonValue
        if (kindOf(value) !== draft.kind) throw new Error(t(`context.explorer.types.${draft.kind}`))
        return { ok: true, value }
      } catch (error) {
        return {
          ok: false,
          error: t('context.explorer.invalid_json', { message: (error as Error).message }),
        }
      }
  }
}

/** Inertia follows the redirect even when the engine refused: it's reported as a flash error. */
function succeeded(page: { flash?: { error?: string } }) {
  return !page.flash?.error
}

interface Props {
  path: string
  value: JsonValue
  canEdit: boolean
  onSelect: (path: string) => void
}

export function ValueEditor({ path, value, canEdit, onSelect }: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(() => draftFrom(value))
  // The value the draft started from, to detect concurrent changes.
  const [base, setBase] = useState(value)
  const [newKey, setNewKey] = useState('')
  const [openDelete, setOpenDelete] = useState(false)

  const parsed = parse(draft, t)
  const dirty = !parsed.ok || !sameJson(parsed.value, base)
  const remoteChanged = !sameJson(base, value)
  const isRoot = path === ''
  const isContainer = draft.kind === 'object' || draft.kind === 'array'

  // Follow live updates while the user hasn't touched the draft.
  useEffect(() => {
    if (dirty) return
    setDraft(draftFrom(value))
    setBase(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)])

  const discard = () => {
    setDraft(draftFrom(value))
    setBase(value)
  }

  const save = () => {
    if (!parsed.ok || !dirty) return
    router.put(
      urlFor('context.values.update'),
      { path, value: JSON.stringify(parsed.value) },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: (page) => {
          if (!succeeded(page)) return
          setBase(parsed.value)
          toast.success(t('context.explorer.saved'))
        },
      }
    )
  }

  const addKey = () => {
    const key = newKey.trim()
    if (!key) return
    router.put(
      urlFor('context.values.update'),
      { path: joinPath(path, key), value: 'null' },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: (page) => {
          if (!succeeded(page)) return
          setNewKey('')
          onSelect(joinPath(path, key))
        },
      }
    )
  }

  const appendItem = () => {
    const length = Array.isArray(value) ? value.length : 0
    router.post(
      urlFor('context.values.store'),
      { path, value: 'null' },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: (page) => {
          if (succeeded(page)) onSelect(joinPath(path, length))
        },
      }
    )
  }

  const remove = () =>
    router.delete(urlFor('context.values.destroy'), {
      data: { path },
      preserveScroll: true,
      preserveState: true,
      onSuccess: (page) => {
        if (succeeded(page)) onSelect(parentPath(path))
      },
    })

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate font-mono text-sm">
            {isRoot ? t('context.explorer.root') : path}
          </span>
          {!isRoot && (
            <CopyButton
              content={path}
              variant="ghost"
              size="sm"
              aria-label={t('context.explorer.copy_path')}
            />
          )}
        </div>
        <Badge variant="secondary">{t(`context.explorer.types.${kindOf(value)}`)}</Badge>

        {canEdit && (
          <div className="ml-auto flex items-center gap-2">
            {remoteChanged && dirty && (
              <>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {t('context.explorer.remote_change')}
                </span>
                <Button size="sm" variant="outline" onClick={discard}>
                  {t('context.explorer.discard')}
                </Button>
              </>
            )}
            {dirty && !remoteChanged && (
              <span className="text-xs text-muted-foreground">{t('context.explorer.unsaved')}</span>
            )}
            <Button size="sm" onClick={save} disabled={!dirty || !parsed.ok} title="Ctrl+S">
              <Save size={16} />
              {t('context.explorer.save')}
            </Button>
            {!isRoot && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setOpenDelete(true)}
                aria-label={t('context.explorer.delete')}
                title={t('context.explorer.delete')}
              >
                <TrashIcon size={16} />
              </Button>
            )}
          </div>
        )}
      </header>

      {!canEdit && (
        <p className="border-b px-3 py-2 text-xs text-muted-foreground">
          {t('context.explorer.read_only')}
        </p>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-end gap-3 border-b px-3 py-2">
          {!isRoot && (
            <label className="grid gap-1 text-xs text-muted-foreground">
              {t('context.explorer.type')}
              <Select
                value={draft.kind}
                onValueChange={(kind) => setDraft(retype(draft, kind as JsonKind))}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {t(`context.explorer.types.${kind}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          )}

          {kindOf(value) === 'object' && (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault()
                addKey()
              }}
            >
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={t('context.explorer.new_key')}
                aria-label={t('context.explorer.new_key')}
                className="h-8 w-40"
              />
              <Button type="submit" size="sm" variant="outline" disabled={!newKey.trim()}>
                <Plus size={16} />
                {t('context.explorer.add_key')}
              </Button>
            </form>
          )}

          {kindOf(value) === 'array' && (
            <Button size="sm" variant="outline" onClick={appendItem}>
              <Plus size={16} />
              {t('context.explorer.append_item')}
            </Button>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {(!canEdit || isContainer) && (
          <>
            {canEdit && (
              <p className="text-xs text-muted-foreground">{t('context.explorer.json_hint')}</p>
            )}
            <div className="min-h-64 flex-1 overflow-hidden rounded-md border">
              <CodeEditor
                value={canEdit ? draft.text : JSON.stringify(value, null, 2)}
                onChange={(text) => setDraft({ ...draft, text })}
                onSave={save}
                readOnly={!canEdit}
              />
            </div>
          </>
        )}

        {canEdit && draft.kind === 'string' && (
          <Textarea
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                save()
              }
            }}
            aria-label={t('context.explorer.value')}
            className="min-h-32 font-mono"
          />
        )}

        {canEdit && draft.kind === 'number' && (
          <Input
            type="number"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            aria-label={t('context.explorer.value')}
            className="w-56 font-mono"
          />
        )}

        {canEdit && draft.kind === 'boolean' && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={draft.bool}
              onCheckedChange={(checked) => setDraft({ ...draft, bool: checked === true })}
            />
            {t('context.explorer.true')}
          </label>
        )}

        {canEdit && draft.kind === 'null' && (
          <span className="font-mono text-sm italic text-muted-foreground">null</span>
        )}

        {!parsed.ok && <p className="text-sm text-destructive">{parsed.error}</p>}
      </div>

      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title={t('context.explorer.delete_title')}
        desc={
          <Trans
            i18nKey="context.explorer.delete_description"
            values={{ path }}
            components={{ strong: <strong /> }}
          />
        }
        destructive
        confirmText={t('context.explorer.delete')}
        handleConfirm={remove}
      />
    </div>
  )
}
