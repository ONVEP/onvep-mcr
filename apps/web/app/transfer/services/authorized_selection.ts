import type { HttpContext } from '@adonisjs/core/http'

import TransferPolicy from '#transfer/policies/transfer_policy'
import {
  TRANSFER_COLLECTION_IDS,
  TRANSFER_NODE_IDS,
  type TransferCollectionId,
  type TransferNodeId,
  type TransferSelection,
} from '#transfer/types/bundle'

/** Catalog nodes the user may export or import. */
export async function allowedNodes(bouncer: HttpContext['bouncer']): Promise<TransferNodeId[]> {
  const allowed: TransferNodeId[] = []
  for (const node of TRANSFER_NODE_IDS) {
    if (await bouncer.with(TransferPolicy).allows('useNode', node)) allowed.push(node)
  }
  return allowed
}

/**
 * Narrows a validated selection to catalog nodes and authorizes each of them:
 * asking for a node the user can't manage is refused, not silently dropped.
 */
export async function authorizedSelection(
  bouncer: HttpContext['bouncer'],
  input: { collections: Record<string, string[]>; singletons: TransferSelection['singletons'] }
): Promise<TransferSelection> {
  const collections: TransferSelection['collections'] = {}
  for (const [id, keys] of Object.entries(input.collections)) {
    if ((TRANSFER_COLLECTION_IDS as string[]).includes(id)) {
      collections[id as TransferCollectionId] = keys
    }
  }
  const selection = { collections, singletons: input.singletons }

  const nodes = [...(Object.keys(collections) as TransferNodeId[]), ...selection.singletons]
  for (const node of nodes) {
    await bouncer.with(TransferPolicy).authorize('useNode', node)
  }
  return selection
}
