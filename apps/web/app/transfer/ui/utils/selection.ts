import {
  TRANSFER_TREE,
  type TransferCollectionId,
  type TransferInventory,
  type TransferNodeId,
  type TransferSectionKey,
  type TransferSelection,
  type TransferSingletonId,
} from '#transfer/types/bundle'

export type CheckState = boolean | 'indeterminate'

export type TreeLeaf = {
  id: TransferNodeId
  kind: 'collection' | 'singleton'
  unselectedByDefault: boolean
}
export type TreeSection = { key: TransferSectionKey; leaves: TreeLeaf[] }

const isCollection = (leaf: TreeLeaf): leaf is TreeLeaf & { id: TransferCollectionId } =>
  leaf.kind === 'collection'

/** The catalog tree, reduced to the nodes the inventory offers. */
export function visibleTree(inventory: TransferInventory): TreeSection[] {
  return TRANSFER_TREE.map((section) => ({
    key: section.key,
    leaves: section.children
      .map((leaf) => ({
        id: `${section.key}.${leaf.key}` as TransferNodeId,
        kind: leaf.kind,
        unselectedByDefault: 'unselectedByDefault' in leaf && leaf.unselectedByDefault,
      }))
      .filter((leaf) =>
        isCollection(leaf)
          ? inventory.collections[leaf.id] !== undefined
          : inventory.singletons[leaf.id as TransferSingletonId] !== undefined
      ),
  })).filter((section) => section.leaves.length > 0)
}

/** Whether a leaf has anything to transfer at all. */
export function leafAvailable(inventory: TransferInventory, leaf: TreeLeaf): boolean {
  return isCollection(leaf)
    ? (inventory.collections[leaf.id]?.length ?? 0) > 0
    : inventory.singletons[leaf.id as TransferSingletonId] === true
}

export function defaultSelection(inventory: TransferInventory): TransferSelection {
  const selection: TransferSelection = { collections: {}, singletons: [] }
  for (const leaf of visibleTree(inventory).flatMap((section) => section.leaves)) {
    if (leaf.unselectedByDefault || !leafAvailable(inventory, leaf)) continue
    if (isCollection(leaf)) {
      selection.collections[leaf.id] = inventory.collections[leaf.id]!.map((item) => item.key)
    } else {
      selection.singletons.push(leaf.id as TransferSingletonId)
    }
  }
  return selection
}

export function leafState(
  selection: TransferSelection,
  inventory: TransferInventory,
  leaf: TreeLeaf
): CheckState {
  if (!isCollection(leaf)) return selection.singletons.includes(leaf.id as TransferSingletonId)
  const total = inventory.collections[leaf.id]?.length ?? 0
  const selected = selection.collections[leaf.id]?.length ?? 0
  if (selected === 0) return false
  return selected >= total ? true : 'indeterminate'
}

export function sectionState(
  selection: TransferSelection,
  inventory: TransferInventory,
  section: TreeSection
): CheckState {
  const states = section.leaves
    .filter((leaf) => leafAvailable(inventory, leaf))
    .map((leaf) => leafState(selection, inventory, leaf))
  if (states.length === 0 || states.every((state) => state === false)) return false
  return states.every((state) => state === true) ? true : 'indeterminate'
}

/** Checking a leaf selects all its items; unchecking clears them. */
export function setLeaf(
  selection: TransferSelection,
  inventory: TransferInventory,
  leaf: TreeLeaf,
  checked: boolean
): TransferSelection {
  if (isCollection(leaf)) {
    const keys = checked ? (inventory.collections[leaf.id] ?? []).map((item) => item.key) : []
    return setItems(selection, leaf.id, keys)
  }
  const id = leaf.id as TransferSingletonId
  const singletons = selection.singletons.filter((other) => other !== id)
  return { ...selection, singletons: checked ? [...singletons, id] : singletons }
}

/** Checking a section checks every available leaf below it, whatever their defaults. */
export function setSection(
  selection: TransferSelection,
  inventory: TransferInventory,
  section: TreeSection,
  checked: boolean
): TransferSelection {
  return section.leaves
    .filter((leaf) => leafAvailable(inventory, leaf))
    .reduce((next, leaf) => setLeaf(next, inventory, leaf, checked), selection)
}

export function setItems(
  selection: TransferSelection,
  id: TransferCollectionId,
  keys: string[]
): TransferSelection {
  return { ...selection, collections: { ...selection.collections, [id]: keys } }
}

/** Drops empty collections: what is left is exactly what the server should transfer. */
export function compactSelection(selection: TransferSelection): TransferSelection {
  const collections: TransferSelection['collections'] = {}
  for (const [id, keys] of Object.entries(selection.collections)) {
    if (keys && keys.length > 0) collections[id as TransferCollectionId] = keys
  }
  return { collections, singletons: selection.singletons }
}

export function isEmptySelection(selection: TransferSelection): boolean {
  const compact = compactSelection(selection)
  return Object.keys(compact.collections).length === 0 && compact.singletons.length === 0
}
