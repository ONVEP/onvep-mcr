import NetworkDrive from '#media/models/network_drive'

export interface CreateNetworkDriveInput {
  name: string
  url: string
  username: string
  password: string
}

export default class CreateNetworkDrive {
  async handle(input: CreateNetworkDriveInput): Promise<NetworkDrive> {
    return NetworkDrive.create(input)
  }
}
