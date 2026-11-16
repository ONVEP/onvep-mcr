import { useMemo, useState } from 'react'

import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'

import { useTranslation } from '#common/ui/hooks/use_translation'

import type { TransferItem } from '#transfer/types/bundle'

interface ItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  items: TransferItem[]
  selected: string[]
  onChange: (keys: string[]) => void
}

/** Picks individual items of a collection. Changes apply live; the tree reflects them. */
export function ItemsDialog({
  open,
  onOpenChange,
  title,
  items,
  selected,
  onChange,
}: ItemsDialogProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    return needle ? items.filter((item) => item.label.toLowerCase().includes(needle)) : items
  }, [items, filter])

  const toggle = (key: string, checked: boolean) => {
    const next = new Set(selectedSet)
    if (checked) next.add(key)
    else next.delete(key)
    // Keep inventory order so the payload is stable.
    onChange(items.filter((item) => next.has(item.key)).map((item) => item.key))
  }

  // "All" / "none" act on the filtered rows only, so a filter can be used to bulk-pick.
  const setVisible = (checked: boolean) => {
    const next = new Set(selectedSet)
    for (const item of visible) {
      if (checked) next.add(item.key)
      else next.delete(item.key)
    }
    onChange(items.filter((item) => next.has(item.key)).map((item) => item.key))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setFilter('')
        onOpenChange(value)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={t('transfer.items.filter')}
            className="h-8 min-w-0 flex-1"
          />
          <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
            {t('transfer.items.select_all')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setVisible(false)}>
            {t('transfer.items.select_none')}
          </Button>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto rounded-md border divide-y">
          {visible.map((item) => {
            const id = `transfer-item-${item.key}`
            return (
              <li key={item.key} className="flex items-center gap-3 px-3 py-2">
                <Checkbox
                  id={id}
                  checked={selectedSet.has(item.key)}
                  onCheckedChange={(checked) => toggle(item.key, checked === true)}
                />
                <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer truncate text-sm">
                  {item.label}
                </label>
              </li>
            )
          })}
          {visible.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t('transfer.items.no_match')}
            </li>
          )}
        </ul>

        <DialogFooter>
          <span className="mr-auto self-center text-sm text-muted-foreground">
            {t('transfer.tree.count', { selected: selected.length, total: items.length })}
          </span>
          <Button onClick={() => onOpenChange(false)}>{t('transfer.items.done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
