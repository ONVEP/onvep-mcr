import Asset from '#graphics/models/asset'
import CssVariable from '#graphics/models/css_variable'
import CustomCss from '#graphics/models/custom_css'
import Layer from '#graphics/models/layer'
import NetworkDrive from '#media/models/network_drive'
import Rundown from '#rundowns/models/rundown'
import StepType from '#rundowns/models/step_type'
import Role from '#users/models/role'
import ContextEngineUnavailableException from '#context/exceptions/context_engine_unavailable_exception'
import type { ContextEngineClient } from '#context/services/context_engine_client'
import type {
  TransferCollectionId,
  TransferInventory,
  TransferItem,
  TransferNodeId,
  TransferSingletonId,
} from '#transfer/types/bundle'

type Loader<T> = () => Promise<T>

/**
 * What the current instance can export, limited to the nodes the user may use.
 * Context nodes are left out when the engine is unreachable.
 */
export default class TransferInventoryQuery {
  constructor(private engine: ContextEngineClient) {}

  async handle(nodes: TransferNodeId[]): Promise<TransferInventory & { engineAvailable: boolean }> {
    const collections: Record<TransferCollectionId, Loader<TransferItem[]>> = {
      'rundowns.stepTypes': () =>
        items(StepType.query().orderBy('name').exec(), (row) => item(row.id, row.name)),
      'rundowns.rundowns': () =>
        items(Rundown.query().orderBy('name').exec(), (row) =>
          item(row.id, `${row.name} (${row.startTime.slice(0, 5)})`)
        ),
      'media.networkDrives': () =>
        items(NetworkDrive.query().orderBy('name').exec(), (row) => item(row.id, row.name)),
      'graphics.layers': () =>
        items(Layer.query().orderBy('name').exec(), (row) =>
          item(row.id, `${row.name} (${row.slug})`)
        ),
      'graphics.cssVariables': () =>
        items(CssVariable.query().orderBy('name').exec(), (row) => item(row.id, row.name)),
      'graphics.assets': () =>
        items(Asset.query().orderBy('name').exec(), (row) => item(row.id, row.name)),
      'context.mutators': () =>
        items(this.engine.listMutators(), (row) => item(row.name, row.name)),
      'context.validators': () =>
        items(this.engine.listValidators(), (row) => item(row.id, row.path || '/')),
      'users.roles': () =>
        items(Role.query().orderBy('name').exec(), (row) => item(row.id, row.name)),
    }
    const singletons: Record<TransferSingletonId, Loader<boolean>> = {
      'graphics.customCss': async () => {
        const row = await CustomCss.query().orderBy('id').first()
        return Boolean(row?.content)
      },
      'context.data': async () => {
        const data = await this.engine.getValue('')
        return Boolean(data) && Object.keys(data as object).length > 0
      },
    }

    const inventory: TransferInventory = { collections: {}, singletons: {} }
    let engineAvailable = true

    for (const node of nodes) {
      try {
        if (node in collections) {
          const id = node as TransferCollectionId
          inventory.collections[id] = await collections[id]()
        } else {
          const id = node as TransferSingletonId
          inventory.singletons[id] = await singletons[id]()
        }
      } catch (error) {
        if (!(error instanceof ContextEngineUnavailableException)) throw error
        engineAvailable = false
      }
    }

    return { ...inventory, engineAvailable }
  }
}

async function items<T>(rows: Promise<T[]>, toItem: (row: T) => TransferItem) {
  const list = await rows
  return list.map(toItem)
}

function item(key: number | string, label: string): TransferItem {
  return { key: String(key), label }
}
