/**
 * Import/export catalog and file format. Shared by the server and the Inertia
 * page: the tree drives both the selection UI and what the server accepts.
 */

export const TRANSFER_TREE = [
  {
    key: 'rundowns',
    children: [
      { key: 'stepTypes', kind: 'collection' },
      { key: 'rundowns', kind: 'collection' },
    ],
  },
  {
    key: 'media',
    children: [{ key: 'networkDrives', kind: 'collection' }],
  },
  {
    key: 'graphics',
    children: [
      { key: 'layers', kind: 'collection' },
      { key: 'cssVariables', kind: 'collection' },
      { key: 'customCss', kind: 'singleton' },
    ],
  },
  {
    key: 'context',
    children: [
      // The live state: overwriting it mid-show is rarely what an export is for.
      { key: 'data', kind: 'singleton', unselectedByDefault: true },
      { key: 'mutators', kind: 'collection' },
      { key: 'validators', kind: 'collection' },
    ],
  },
  {
    key: 'users',
    children: [{ key: 'roles', kind: 'collection' }],
  },
] as const

type Tree = typeof TRANSFER_TREE
type Section = Tree[number]
type LeafOf<S extends Section> = S['children'][number]

export type TransferSectionKey = Section['key']

/** `<section>.<leaf>`, e.g. `graphics.layers` */
export type TransferNodeId = {
  [S in Section as S['key']]: `${S['key']}.${LeafOf<S>['key']}`
}[TransferSectionKey]

export type TransferCollectionId = {
  [S in Section as S['key']]: `${S['key']}.${Extract<LeafOf<S>, { kind: 'collection' }>['key']}`
}[TransferSectionKey]

export type TransferSingletonId = Exclude<TransferNodeId, TransferCollectionId>

export const TRANSFER_NODE_IDS = TRANSFER_TREE.flatMap((section) =>
  section.children.map((leaf) => `${section.key}.${leaf.key}`)
) as TransferNodeId[]

export const TRANSFER_COLLECTION_IDS = TRANSFER_TREE.flatMap((section) =>
  section.children
    .filter((leaf) => leaf.kind === 'collection')
    .map((leaf) => `${section.key}.${leaf.key}`)
) as TransferCollectionId[]

export const TRANSFER_SINGLETON_IDS = TRANSFER_NODE_IDS.filter(
  (id) => !(TRANSFER_COLLECTION_IDS as string[]).includes(id)
) as TransferSingletonId[]

/**
 * What to export or import. Collection items are identified by `key`: the
 * record id on export, the position in the file on import.
 */
export type TransferSelection = {
  collections: Partial<Record<TransferCollectionId, string[]>>
  singletons: TransferSingletonId[]
}

export type TransferItem = { key: string; label: string }

/** What can be picked: collection items, and whether each singleton has content. */
export type TransferInventory = {
  collections: Partial<Record<TransferCollectionId, TransferItem[]>>
  singletons: Partial<Record<TransferSingletonId, boolean>>
}

export const TRANSFER_MODES = ['overwrite', 'skip'] as const
export type TransferMode = (typeof TRANSFER_MODES)[number]

export type TransferReport = { created: number; updated: number; skipped: number }

// --- File format -----------------------------------------------------------

export const BUNDLE_FORMAT = 'onvep-mcr'
export const BUNDLE_VERSION = 1

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export type BundleStepType = { name: string; color: string }
export type BundleStep = {
  title: string
  stepType: BundleStepType
  plannedDuration: number
  playedTime: string | null
  waitUntil: string | null
  autoNext: boolean
}
export type BundleRundown = { name: string; startTime: string; steps: BundleStep[] }
export type BundleNetworkDrive = { name: string; url: string; username: string; password: string }
export type BundleLayer = { name: string; slug: string; enabled: boolean; content: string }
export type BundleCssVariable = { name: string; kind: 'color' | 'value'; value: string }
export type BundleMutator = { name: string; source: string }
export type BundleValidator = { path: string; schema: { [key: string]: JsonValue } }
export type BundleRole = { name: string; permissions: string[] }

export type TransferBundle = {
  format: typeof BUNDLE_FORMAT
  version: typeof BUNDLE_VERSION
  exportedAt: string
  rundowns?: { stepTypes?: BundleStepType[]; rundowns?: BundleRundown[] }
  media?: { networkDrives?: BundleNetworkDrive[] }
  graphics?: { layers?: BundleLayer[]; cssVariables?: BundleCssVariable[]; customCss?: string }
  context?: {
    data?: { [key: string]: JsonValue }
    mutators?: BundleMutator[]
    validators?: BundleValidator[]
  }
  users?: { roles?: BundleRole[] }
}

/** Natural key shown to the user for each collection item of a file. */
export function bundleItemLabel(id: TransferCollectionId, item: unknown): string {
  const record = item as Record<string, unknown>
  switch (id) {
    case 'graphics.layers':
      return `${record.name} (${record.slug})`
    case 'context.validators':
      return (record.path as string) || '/'
    default:
      return String(record.name)
  }
}

/** Reads a collection or singleton of a bundle by node id. */
export function bundleNode(bundle: TransferBundle, id: TransferNodeId): unknown {
  const [section, leaf] = id.split('.') as [TransferSectionKey, string]
  return (bundle[section] as Record<string, unknown> | undefined)?.[leaf]
}
