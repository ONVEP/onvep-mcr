import { useState } from 'react'
import { usePage } from '@inertiajs/react'
import { Download, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import { Button } from '@workspace/ui/components/button'

import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { TransferInventory } from '#transfer/types/bundle'
import { SelectionTree } from '#transfer/ui/components/selection_tree'
import { compactSelection, defaultSelection, isEmptySelection } from '#transfer/ui/utils/selection'

export function ExportPanel({
  inventory,
  engineAvailable,
}: {
  inventory: TransferInventory
  engineAvailable: boolean
}) {
  const { t } = useTranslation()
  const { csrf } = usePage().props as { csrf?: string }
  const [selection, setSelection] = useState(() => defaultSelection(inventory))

  const empty = isEmptySelection(selection)
  const withSecrets = (selection.collections['media.networkDrives']?.length ?? 0) > 0

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {!engineAvailable && (
        <Alert>
          <TriangleAlert />
          <AlertDescription>{t('transfer.tree.unavailable')}</AlertDescription>
        </Alert>
      )}

      <SelectionTree
        idPrefix="export"
        inventory={inventory}
        value={selection}
        onChange={setSelection}
      />

      {withSecrets && (
        <Alert>
          <TriangleAlert />
          <AlertDescription>{t('transfer.export.secrets')}</AlertDescription>
        </Alert>
      )}

      {/* A plain form post, not a fetch: the browser streams the multi-GB archive to disk. */}
      <form
        method="post"
        action={urlFor('transfer.export')}
        className="flex items-center gap-3"
      >
        <input type="hidden" name="_csrf" value={csrf ?? ''} />
        <input
          type="hidden"
          name="selection"
          value={JSON.stringify(compactSelection(selection))}
        />
        <Button type="submit" disabled={empty}>
          <Download />
          {t('transfer.export.submit')}
        </Button>
        {empty && (
          <span className="text-sm text-muted-foreground">{t('transfer.export.nothing')}</span>
        )}
      </form>
    </div>
  )
}
