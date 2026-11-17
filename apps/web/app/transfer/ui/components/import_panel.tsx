import { useState, type ChangeEvent } from 'react'
import { useForm } from '@inertiajs/react'
import { Upload } from 'lucide-react'

import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group'

import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import {
  BUNDLE_FORMAT,
  BUNDLE_VERSION,
  TRANSFER_COLLECTION_IDS,
  TRANSFER_MODES,
  bundleItemLabel,
  bundleNode,
  type TransferBundle,
  type TransferInventory,
  type TransferMode,
  type TransferNodeId,
  type TransferSelection,
  type TransferSingletonId,
} from '#transfer/types/bundle'
import { SelectionTree } from '#transfer/ui/components/selection_tree'
import { readArchiveManifest } from '#transfer/ui/utils/archive'
import { compactSelection, defaultSelection, isEmptySelection } from '#transfer/ui/utils/selection'

/**
 * What a file offers, limited to the nodes the user may import. Items are keyed
 * by their position in the file: the server reads the same file.
 */
function fileInventory(bundle: TransferBundle, nodes: TransferNodeId[]): TransferInventory {
  const inventory: TransferInventory = { collections: {}, singletons: {} }
  for (const id of nodes) {
    const content = bundleNode(bundle, id)
    if (content === undefined) continue
    if ((TRANSFER_COLLECTION_IDS as string[]).includes(id)) {
      if (!Array.isArray(content)) continue
      inventory.collections[id as keyof TransferInventory['collections']] = content.map(
        (item, index) => ({
          key: String(index),
          label: bundleItemLabel(id as (typeof TRANSFER_COLLECTION_IDS)[number], item),
        })
      )
    } else {
      inventory.singletons[id as TransferSingletonId] = true
    }
  }
  return inventory
}

async function readBundle(file: File): Promise<TransferBundle | null> {
  try {
    const data = (await readArchiveManifest(file)) as TransferBundle | null
    return data?.format === BUNDLE_FORMAT && data?.version === BUNDLE_VERSION ? data : null
  } catch {
    return null
  }
}

export function ImportPanel({ nodes }: { nodes: TransferNodeId[] }) {
  const { t } = useTranslation()
  const [inventory, setInventory] = useState<TransferInventory | null>(null)
  const [selection, setSelection] = useState<TransferSelection | null>(null)
  const [invalidFile, setInvalidFile] = useState(false)

  const form = useForm<{ file: File | null; mode: TransferMode; selection: string }>({
    file: null,
    mode: 'overwrite',
    selection: '',
  })

  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    form.setData('file', file)
    form.clearErrors()
    const bundle = file ? await readBundle(file) : null
    setInvalidFile(Boolean(file) && !bundle)
    const next = bundle ? fileInventory(bundle, nodes) : null
    setInventory(next)
    setSelection(next ? defaultSelection(next) : null)
  }

  const submit = () => {
    if (!selection) return
    form.transform((data) => ({
      ...data,
      selection: JSON.stringify(compactSelection(selection)),
    }))
    form.post(urlFor('transfer.import'), { forceFormData: true, preserveScroll: true })
  }

  const empty = !selection || isEmptySelection(selection)
  const errors = Object.values(form.errors)

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="transfer-file">{t('transfer.import.file')}</Label>
        <Input id="transfer-file" type="file" accept=".tar,application/x-tar" onChange={pickFile} />
        <p className="text-sm text-muted-foreground">{t('transfer.import.file_hint')}</p>
        {invalidFile && (
          <p className="text-sm text-destructive">{t('transfer.import.invalid_file')}</p>
        )}
      </div>

      {inventory && selection && (
        <>
          <SelectionTree
            idPrefix="import"
            inventory={inventory}
            value={selection}
            onChange={setSelection}
          />

          <div className="flex flex-col gap-3">
            <Label>{t('transfer.import.mode.label')}</Label>
            <RadioGroup
              value={form.data.mode}
              onValueChange={(mode) => form.setData('mode', mode as TransferMode)}
            >
              {TRANSFER_MODES.map((mode) => (
                <div key={mode} className="flex items-start gap-3">
                  <RadioGroupItem value={mode} id={`transfer-mode-${mode}`} className="mt-0.5" />
                  <Label
                    htmlFor={`transfer-mode-${mode}`}
                    className="flex flex-col items-start gap-1"
                  >
                    <span>{t(`transfer.import.mode.${mode}`)}</span>
                    <span className="font-normal text-muted-foreground">
                      {t(`transfer.import.mode.${mode}_hint`)}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-sm text-muted-foreground">{t('transfer.import.matching')}</p>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={empty || form.processing}>
              <Upload />
              {t('transfer.import.submit')}
            </Button>
            {empty && (
              <span className="text-sm text-muted-foreground">{t('transfer.import.nothing')}</span>
            )}
            {form.progress?.percentage !== undefined && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {form.progress.percentage}%
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
