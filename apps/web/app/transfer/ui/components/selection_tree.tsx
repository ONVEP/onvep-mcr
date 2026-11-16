import { useState } from 'react'
import { ListChecks } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'

import { useTranslation } from '#common/ui/hooks/use_translation'

import type {
  TransferCollectionId,
  TransferInventory,
  TransferSelection,
} from '#transfer/types/bundle'
import { ItemsDialog } from '#transfer/ui/components/items_dialog'
import {
  leafAvailable,
  leafState,
  sectionState,
  setItems,
  setLeaf,
  setSection,
  visibleTree,
} from '#transfer/ui/utils/selection'

interface SelectionTreeProps {
  /** Prefixes checkbox ids: the export and import trees live on the same page. */
  idPrefix: string
  inventory: TransferInventory
  value: TransferSelection
  onChange: (selection: TransferSelection) => void
}

export function SelectionTree({ idPrefix, inventory, value, onChange }: SelectionTreeProps) {
  const { t } = useTranslation()
  const [picking, setPicking] = useState<TransferCollectionId | null>(null)

  const tree = visibleTree(inventory)
  if (tree.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('transfer.tree.empty')}</p>
  }

  return (
    <>
      <ul className="flex flex-col gap-4">
        {tree.map((section) => {
          const sectionId = `${idPrefix}-${section.key}`
          const sectionDisabled = !section.leaves.some((leaf) => leafAvailable(inventory, leaf))
          return (
            <li key={section.key}>
              <div className="flex items-center gap-3 py-1">
                <Checkbox
                  id={sectionId}
                  disabled={sectionDisabled}
                  checked={sectionState(value, inventory, section)}
                  onCheckedChange={(checked) =>
                    onChange(setSection(value, inventory, section, checked === true))
                  }
                />
                <label htmlFor={sectionId} className="cursor-pointer font-semibold">
                  {t(`transfer.tree.sections.${section.key}`)}
                </label>
              </div>

              <ul className="ml-2 border-l pl-5">
                {section.leaves.map((leaf) => {
                  const leafId = `${idPrefix}-${leaf.id}`
                  const available = leafAvailable(inventory, leaf)
                  const items =
                    leaf.kind === 'collection'
                      ? (inventory.collections[leaf.id as TransferCollectionId] ?? [])
                      : null
                  return (
                    <li key={leaf.id} className="flex min-h-9 items-center gap-3">
                      <Checkbox
                        id={leafId}
                        disabled={!available}
                        checked={leafState(value, inventory, leaf)}
                        onCheckedChange={(checked) =>
                          onChange(setLeaf(value, inventory, leaf, checked === true))
                        }
                      />
                      <label
                        htmlFor={leafId}
                        className="cursor-pointer text-sm aria-disabled:cursor-default aria-disabled:text-muted-foreground"
                        aria-disabled={!available}
                      >
                        {t(`transfer.tree.nodes.${leaf.id}`)}
                      </label>
                      {items && (
                        <>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {t('transfer.tree.count', {
                              selected:
                                value.collections[leaf.id as TransferCollectionId]?.length ?? 0,
                              total: items.length,
                            })}
                          </span>
                          {available && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 px-2 text-xs"
                              onClick={() => setPicking(leaf.id as TransferCollectionId)}
                            >
                              <ListChecks className="size-3.5" />
                              {t('transfer.tree.choose')}
                            </Button>
                          )}
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>

      {picking && (
        <ItemsDialog
          open
          onOpenChange={(open) => !open && setPicking(null)}
          title={t('transfer.items.title', { node: t(`transfer.tree.nodes.${picking}`) })}
          items={inventory.collections[picking] ?? []}
          selected={value.collections[picking] ?? []}
          onChange={(keys) => onChange(setItems(value, picking, keys))}
        />
      )}
    </>
  )
}
