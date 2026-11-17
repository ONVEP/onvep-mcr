import vine from '@vinejs/vine'

import { CSS_VARIABLE_KINDS } from '#graphics/enums/css_variable_kind'
import { jsonString } from '#context/validators/rules'
import { timeOfDay } from '#rundowns/validators/rundowns'
import {
  BUNDLE_FORMAT,
  BUNDLE_VERSION,
  TRANSFER_MODES,
  TRANSFER_SINGLETON_IDS,
} from '#transfer/types/bundle'

const selection = {
  // Unknown ids are dropped by the controller, which only keeps catalog entries.
  collections: vine.record(vine.array(vine.string())),
  singletons: vine.array(vine.enum(TRANSFER_SINGLETON_IDS)).distinct(),
}

export const exportValidator = vine.create(selection)

export const importValidator = vine.create({
  file: vine.file({ size: '20mb', extnames: ['json'] }),
  mode: vine.enum(TRANSFER_MODES),
  // JSON-encoded: multipart forms can't carry the nested selection with dotted ids.
  selection: vine.string().use(jsonString()),
})

export const importSelectionValidator = vine.create(selection)

// The file never goes through the body parser: empty strings stay empty strings.
// Rules mirror each module's own validators so an import can't store what the UI couldn't.
const name = () => vine.string().trim().minLength(1).maxLength(255)
const color = () =>
  vine
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
const jsonObject = () => vine.record(vine.any())

const stepType = () => vine.object({ name: name(), color: color() })

export const bundleValidator = vine.create({
  format: vine.literal(BUNDLE_FORMAT),
  version: vine.literal(BUNDLE_VERSION),
  exportedAt: vine.string(),
  rundowns: vine
    .object({
      stepTypes: vine.array(stepType()).optional(),
      rundowns: vine
        .array(
          vine.object({
            name: name(),
            startTime: timeOfDay(),
            steps: vine.array(
              vine.object({
                title: name(),
                stepType: stepType(),
                plannedDuration: vine.number().withoutDecimals().min(0).max(86_399),
                playedTime: timeOfDay().nullable(),
                waitUntil: timeOfDay().nullable(),
                autoNext: vine.boolean(),
              })
            ),
          })
        )
        .optional(),
    })
    .optional(),
  media: vine
    .object({
      networkDrives: vine
        .array(
          vine.object({
            name: name(),
            url: vine
              .string()
              .trim()
              .maxLength(2048)
              .url({
                protocols: ['smb', 'nfs', 'afp'],
                require_protocol: true,
                require_tld: false,
              }),
            username: name(),
            password: vine.string().minLength(1).maxLength(255),
          })
        )
        .optional(),
    })
    .optional(),
  graphics: vine
    .object({
      layers: vine
        .array(
          vine.object({
            name: name(),
            slug: vine
              .string()
              .maxLength(255)
              .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
            enabled: vine.boolean(),
            content: vine.string().maxLength(1_000_000),
          })
        )
        .optional(),
      cssVariables: vine
        .array(
          vine.object({
            name: vine
              .string()
              .trim()
              .maxLength(64)
              .regex(/^[a-zA-Z][\w-]*$/),
            kind: vine.enum(CSS_VARIABLE_KINDS),
            // Injected raw into a <style>: same guards as the CSS variables form.
            value: vine
              .string()
              .trim()
              .minLength(1)
              .maxLength(255)
              .regex(/^[^;{}<>\\\r\n]+$/),
          })
        )
        .optional(),
      customCss: vine
        .string()
        .maxLength(200_000)
        .regex(/^(?![\s\S]*<\/style)/i)
        .optional(),
    })
    .optional(),
  context: vine
    .object({
      data: jsonObject().optional(),
      mutators: vine
        .array(
          vine.object({
            name: vine
              .string()
              .trim()
              .regex(/^[\w-]+(\/[\w-]+)*(\.m?js)?$/),
            source: vine.string().maxLength(1_000_000),
            enabled: vine.boolean().optional(),
          })
        )
        .optional(),
      validators: vine
        .array(
          vine.object({
            path: vine.string().trim().maxLength(255),
            schema: jsonObject(),
            enabled: vine.boolean().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  users: vine
    .object({
      roles: vine
        .array(
          vine.object({
            name: vine.string().trim().minLength(2).maxLength(50),
            // Unknown permissions (renamed, removed) are dropped on import, not refused.
            permissions: vine.array(vine.string()),
          })
        )
        .optional(),
    })
    .optional(),
})
