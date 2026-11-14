import type NetworkDrive from '#media/models/network_drive'

export interface UpdateNetworkDriveInput {
  target: NetworkDrive
  name: string
  url: string
  username: string
  password?: string
}

export default class UpdateNetworkDrive {
  async handle(input: UpdateNetworkDriveInput): Promise<NetworkDrive> {
    input.target.merge({
      name: input.name,
      url: input.url,
      username: input.username,
      password: input.password ?? input.target.password,
    })
    await input.target.save()

    return input.target
  }
}
