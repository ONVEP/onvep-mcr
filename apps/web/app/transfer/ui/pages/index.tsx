import { Download, Upload } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import Heading from '#common/ui/components/heading'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'

import type { TransferInventory, TransferNodeId } from '#transfer/types/bundle'
import { ExportPanel } from '#transfer/ui/components/export_panel'
import { ImportPanel } from '#transfer/ui/components/import_panel'

type PageProps = InertiaProps<{
  nodes: TransferNodeId[]
  inventory: TransferInventory & { engineAvailable: boolean }
}>

export default function TransferIndexPage({ nodes, inventory }: PageProps) {
  const { t } = useTranslation()
  const { engineAvailable, ...exportable } = inventory

  return (
    <AdminLayout breadcrumbs={[{ label: t('transfer.page.title') }]}>
      <Main>
        <Heading title={t('transfer.page.title')} description={t('transfer.page.description')} />

        <Tabs defaultValue="export">
          <TabsList>
            <TabsTrigger value="export">
              <Download />
              {t('transfer.tabs.export')}
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload />
              {t('transfer.tabs.import')}
            </TabsTrigger>
          </TabsList>
          {/* Inventory changes after an import: remount so the default selection follows. */}
          <TabsContent value="export">
            <ExportPanel
              key={JSON.stringify(exportable)}
              inventory={exportable}
              engineAvailable={engineAvailable}
            />
          </TabsContent>
          <TabsContent value="import">
            <ImportPanel nodes={nodes} />
          </TabsContent>
        </Tabs>
      </Main>
    </AdminLayout>
  )
}
