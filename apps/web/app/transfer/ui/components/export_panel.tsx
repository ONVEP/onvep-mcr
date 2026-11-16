import { useState } from 'react'
import { Download, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import { Button } from '@workspace/ui/components/button'
import { toast } from '@workspace/ui/hooks/use-toast'

import { getCookie } from '#common/ui/utils/cookie_helper'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import type { TransferInventory } from '#transfer/types/bundle'
import { SelectionTree } from '#transfer/ui/components/selection_tree'
import { compactSelection, defaultSelection, isEmptySelection } from '#transfer/ui/utils/selection'

/** Saves a response body as a file, named after its content-disposition. */
async function download(response: Response) {
  const name =
    response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'export.json'
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportPanel({
  inventory,
  engineAvailable,
}: {
  inventory: TransferInventory
  engineAvailable: boolean
}) {
  const { t } = useTranslation()
  const [selection, setSelection] = useState(() => defaultSelection(inventory))
  const [processing, setProcessing] = useState(false)

  const empty = isEmptySelection(selection)
  const withSecrets = (selection.collections['media.networkDrives']?.length ?? 0) > 0

  // A file download, not an Inertia visit: fetch it, sending the CSRF token Inertia would.
  const submit = async () => {
    setProcessing(true)
    try {
      const response = await fetch(urlFor('transfer.export'), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-xsrf-token': decodeURIComponent(getCookie('XSRF-TOKEN') ?? ''),
        },
        body: JSON.stringify(compactSelection(selection)),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      await download(response)
    } catch {
      toast.error(t('transfer.export.failed'))
    } finally {
      setProcessing(false)
    }
  }

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

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={empty || processing}>
          <Download />
          {t('transfer.export.submit')}
        </Button>
        {empty && (
          <span className="text-sm text-muted-foreground">{t('transfer.export.nothing')}</span>
        )}
      </div>
    </div>
  )
}
