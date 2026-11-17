import vine from '@vinejs/vine'

export const ASSET_MAX_SIZE = '10gb'

// Anything a browser source can render: images, fonts, video, audio.
export const ASSET_EXTNAMES = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'svg',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'mp4',
  'webm',
  'mov',
  'mp3',
  'wav',
  'ogg',
  'json',
]

const file = () => vine.file({ size: ASSET_MAX_SIZE, extnames: ASSET_EXTNAMES })

export const createAssetValidator = vine.create({ file: file() })

export const updateAssetValidator = vine.create({ file: file() })
