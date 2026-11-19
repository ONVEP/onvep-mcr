import { router } from '@inertiajs/react'
import { AlertTriangleIcon } from 'lucide-react'

import { Badge } from '@workspace/ui/components/badge'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { toast } from '@workspace/ui/hooks/use-toast'

import type { InertiaProps } from '#core/ui/types'

import AdminLayout from '#common/ui/components/admin_layout'
import Heading from '#common/ui/components/heading'
import { Main } from '#common/ui/components/main'
import { useTranslation } from '#common/ui/hooks/use_translation'
import { urlFor } from '~/app/client'

import { useCompanionLive } from '#rundowns/ui/hooks/use_companion_live'
import type { CompanionButton, CompanionSnapshot } from '#rundowns/types/companion'

import type { Data } from '@generated/data'

type CompanionServer = Data.Rundowns.CompanionServer.Variants['forShow']

type PageProps = InertiaProps<{
  companionServer: CompanionServer
  channel: string
  live: CompanionSnapshot
}>

function saveTechnicalPages(server: CompanionServer, technicalPages: string[]) {
  router.put(
    urlFor('companion_servers.update', { id: server.id }),
    { name: server.name, url: server.url, technicalPages },
    {
      preserveScroll: true,
      preserveState: true,
      onError: (errors) => {
        const first = Object.values(errors)[0]
        if (first) toast.error(first)
      },
    }
  )
}

function ButtonTile({ button }: { button: CompanionButton }) {
  return (
    <figure className="flex w-22 flex-col items-center gap-1">
      {button.image ? (
        <img
          src={button.image}
          alt={button.text ?? `${button.page}/${button.row}/${button.column}`}
          className="size-18 rounded"
        />
      ) : (
        <Skeleton className="size-18 rounded" />
      )}
      <figcaption className="w-full space-y-0.5 text-center">
        <span className="block font-mono text-xs text-muted-foreground">
          {button.row}/{button.column}
        </span>
      </figcaption>
    </figure>
  )
}

export default function ShowCompanionServerPage({ companionServer, channel, live }: PageProps) {
  const { t } = useTranslation()
  const { status, pages, buttons } = useCompanionLive(channel, live)

  const selected = new Set(companionServer.technicalPages)
  const togglePage = (id: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    saveTechnicalPages(companionServer, [...next])
  }

  const knownPages = new Set(pages?.list.map((page) => page.id))
  const missingPages = pages
    ? companionServer.technicalPages.filter((id) => !knownPages.has(id))
    : []
  const technicalPages = (pages?.list ?? []).filter((page) => selected.has(page.id))
  const buttonsOf = (pageId: string) =>
    buttons
      .filter((button) => button.pageId === pageId)
      .sort((a, b) => a.row - b.row || a.column - b.column)

  return (
    <AdminLayout
      breadcrumbs={[
        {
          label: t('rundowns.companion_servers.page.title'),
          href: urlFor('companion_servers.index'),
        },
        { label: companionServer.name },
      ]}
    >
      <Main>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Heading title={companionServer.name} description={companionServer.url} />
          <Badge variant={status.connected ? 'default' : 'secondary'}>
            {status.connected
              ? t('rundowns.companion_servers.show.live')
              : status.error
                ? t('rundowns.companion_servers.show.offline')
                : t('rundowns.companion_servers.show.connecting')}
          </Badge>
        </div>

        {status.error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 p-4 text-sm break-all text-destructive">
            <AlertTriangleIcon size={16} className="shrink-0" />
            {t('rundowns.companion_servers.errors.unavailable', { reason: status.error })}
          </div>
        )}

        {pages && (
          <div className="grid gap-6 lg:grid-cols-[minmax(240px,1fr)_3fr]">
            <section className="space-y-3">
              <div>
                <h2 className="font-semibold">
                  {t('rundowns.companion_servers.show.pages_title')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('rundowns.companion_servers.show.pages_description')}
                </p>
              </div>
              {pages.list.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('rundowns.companion_servers.show.no_pages')}
                </p>
              )}
              <ul className="divide-y rounded-md border">
                {pages.list.map((page) => (
                  <li key={page.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50">
                      <Checkbox
                        checked={selected.has(page.id)}
                        onCheckedChange={(checked) => togglePage(page.id, checked === true)}
                      />
                      <span className="flex-1 truncate text-sm">
                        <span className="font-medium">
                          {t('rundowns.companion_servers.show.page_label', {
                            number: page.number,
                          })}
                        </span>
                        {page.name && <span className="text-muted-foreground"> — {page.name}</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('rundowns.companion_servers.show.buttons_count', {
                          count: page.buttonCount,
                        })}
                      </span>
                    </label>
                  </li>
                ))}
                {missingPages.map((id) => (
                  <li key={id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-destructive">
                      <Checkbox checked onCheckedChange={() => togglePage(id, false)} />
                      {t('rundowns.companion_servers.show.missing_page', { id })}
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="font-semibold">
                  {t('rundowns.companion_servers.show.buttons_title')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('rundowns.companion_servers.show.buttons_description')}
                </p>
              </div>
              {technicalPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('rundowns.companion_servers.show.no_selection')}
                </p>
              ) : (
                technicalPages.map((page) => {
                  const pageButtons = buttonsOf(page.id)
                  return (
                    <div key={page.id} className="space-y-2 rounded-md border p-3">
                      <h3 className="text-sm font-medium">
                        {t('rundowns.companion_servers.show.page_label', { number: page.number })}
                        {page.name && <span className="text-muted-foreground"> — {page.name}</span>}
                      </h3>
                      {pageButtons.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t('rundowns.companion_servers.show.no_buttons')}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {pageButtons.map((button) => (
                            <ButtonTile
                              key={`${button.pageId}/${button.row}/${button.column}`}
                              button={button}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </section>
          </div>
        )}
      </Main>
    </AdminLayout>
  )
}
