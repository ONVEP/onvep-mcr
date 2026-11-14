import Factory from '@adonisjs/lucid/factories'

import NetworkDrive from '#media/models/network_drive'

export const NetworkDriveFactory = Factory.define(NetworkDrive, ({ faker }) => {
  return {
    name: faker.string.alphanumeric(12),
    url: `smb://${faker.internet.domainWord()}.network/${faker.word.noun()}`,
    username: faker.internet.username(),
    password: faker.internet.password(),
  }
}).build()
