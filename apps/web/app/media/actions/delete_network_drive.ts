import type NetworkDrive from '#media/models/network_drive'

export interface DeleteNetworkDriveInput {
  target: NetworkDrive
}

export default class DeleteNetworkDrive {
  async handle(input: DeleteNetworkDriveInput): Promise<void> {
    await input.target.delete()
  }
}
