import { Fragment, useState } from 'react'
import { ChevronRight, ClipboardPaste, Plus, X } from 'lucide-react'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { CopyButton } from '@workspace/ui/components/copy-button'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { toast } from '@workspace/ui/hooks/use-toast'
import { cn } from '@workspace/ui/lib/utils'

import { useTranslation } from '#common/ui/hooks/use_translation'

import type { JsonSchema, JsonValue } from '#context/types/engine'

const TYPES = ['any', 'string', 'number', 'integer', 'boolean', 'object', 'array', 'null'] as const
type SchemaType = (typeof TYPES)[number]

const FORMATS = ['none', 'email', 'uri', 'date-time', 'date', 'time', 'uuid', 'hostname', 'ipv4']

/** Keywords that only make sense for one type, dropped when the type changes. */
const TYPE_KEYWORDS = [
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'enum',
  'minimum',
  'maximum',
  'minItems',
  'maxItems',
  'items',
  'properties',
  'required',
  'additionalProperties',
]

function readType(schema: JsonSchema): { type: SchemaType; nullable: boolean } {
  const raw = schema.type
  if (Array.isArray(raw)) {
    const types = raw.filter((type) => type !== 'null') as SchemaType[]
    return { type: types[0] ?? 'null', nullable: types.length > 0 && raw.includes('null') }
  }
  return { type: typeof raw === 'string' ? (raw as SchemaType) : 'any', nullable: false }
}

function writeType(schema: JsonSchema, type: SchemaType, nullable: boolean): JsonSchema {
  const current = readType(schema).type
  const next: JsonSchema = { ...schema }
  if (type !== current) {
    for (const keyword of TYPE_KEYWORDS) delete next[keyword]
    if (type === 'object') next.properties = {}
    if (type === 'array') next.items = {}
  }
  if (type === 'any') delete next.type
  else next.type = nullable && type !== 'null' ? [type, 'null'] : type
  return next
}

/** Sets a keyword, removing it when empty so the schema stays minimal. */
function withKeyword(schema: JsonSchema, keyword: string, value: JsonValue | undefined) {
  const next = { ...schema }
  if (value === undefined || value === '') delete next[keyword]
  else next[keyword] = value
  return next
}

async function readSchemaFromClipboard(): Promise<JsonSchema | null> {
  const text = await navigator.clipboard.readText()
  try {
    const value = JSON.parse(text) as JsonValue
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

/** Copy/paste of one schema node as JSON, to reuse it in another validator or property. */
function SchemaClipboard({
  schema,
  onPaste,
}: {
  schema: JsonSchema
  onPaste: (schema: JsonSchema) => void
}) {
  const { t } = useTranslation()

  const paste = async () => {
    let pasted: JsonSchema | null
    try {
      pasted = await readSchemaFromClipboard()
    } catch {
      toast.error(t('context.schema.paste_denied'))
      return
    }
    if (!pasted) {
      toast.error(t('context.schema.paste_invalid'))
      return
    }
    onPaste(pasted)
    toast.success(t('context.schema.pasted'))
  }

  return (
    <div className="ml-auto flex h-8 items-center gap-1">
      <CopyButton
        content={JSON.stringify(schema, null, 2)}
        variant="ghost"
        onCopy={() => toast.success(t('context.schema.copied'))}
        aria-label={t('context.schema.copy')}
        title={t('context.schema.copy')}
      />
      <Button
        size="icon"
        variant="ghost"
        className="size-8"
        onClick={() => void paste()}
        aria-label={t('context.schema.paste')}
        title={t('context.schema.paste')}
      >
        <ClipboardPaste size={16} />
      </Button>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  )
}

function NumberKeyword({
  schema,
  keyword,
  label,
  onChange,
}: {
  schema: JsonSchema
  keyword: string
  label: string
  onChange: (schema: JsonSchema) => void
}) {
  const value = schema[keyword]
  return (
    <Labeled label={label}>
      <Input
        type="number"
        value={typeof value === 'number' ? value : ''}
        onChange={(e) =>
          onChange(
            withKeyword(schema, keyword, e.target.value === '' ? undefined : Number(e.target.value))
          )
        }
        className="h-8 w-28"
      />
    </Labeled>
  )
}

function EnumKeyword({
  schema,
  onChange,
}: {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
}) {
  const { t } = useTranslation()
  // Raw text kept locally: re-deriving it from the array would eat a trailing comma.
  const [text, setText] = useState(() => (Array.isArray(schema.enum) ? schema.enum.join(', ') : ''))
  return (
    <Labeled label={t('context.schema.enum')}>
      <Input
        value={text}
        placeholder={t('context.schema.enum_hint')}
        onChange={(e) => {
          setText(e.target.value)
          const values = e.target.value
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
          onChange(withKeyword(schema, 'enum', values.length ? values : undefined))
        }}
        className="h-8 w-72"
      />
    </Labeled>
  )
}

function PropertyRow({
  name,
  schema,
  required,
  defaultOpen,
  onRename,
  onChange,
  onRequiredChange,
  onRemove,
}: {
  name: string
  schema: JsonSchema
  required: boolean
  defaultOpen: boolean
  onRename: (name: string) => void
  onChange: (schema: JsonSchema) => void
  onRequiredChange: (required: boolean) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  // Renamed on blur: renaming re-keys the row, which would steal focus mid-typing.
  const [draftName, setDraftName] = useState(name)
  const [open, setOpen] = useState(defaultOpen)
  const { type, nullable } = readType(schema)

  return (
    <li className="grid gap-2 rounded-md border p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={t(open ? 'context.schema.collapse' : 'context.schema.expand')}
          title={t(open ? 'context.schema.collapse' : 'context.schema.expand')}
        >
          <ChevronRight size={16} className={cn('transition-transform', open && 'rotate-90')} />
        </Button>
        <Input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={() => {
            const trimmed = draftName.trim()
            if (trimmed && trimmed !== name) onRename(trimmed)
            else setDraftName(name)
          }}
          aria-label={t('context.schema.property_name')}
          className="h-8 w-48 font-mono"
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={required}
            onCheckedChange={(checked) => onRequiredChange(checked === true)}
          />
          {t('context.schema.required')}
        </label>
        {!open && (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={() => setOpen(true)}
          >
            <Badge variant="secondary">
              {t(`context.schema.types.${type}`)}
              {nullable && ' | null'}
            </Badge>
            {typeof schema.description === 'string' && (
              <span className="truncate text-xs text-muted-foreground">{schema.description}</span>
            )}
          </button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto size-8 text-destructive"
          onClick={onRemove}
          aria-label={t('context.schema.remove_property')}
          title={t('context.schema.remove_property')}
        >
          <X size={16} />
        </Button>
      </div>
      {open && <SchemaBuilder schema={schema} onChange={onChange} />}
    </li>
  )
}

function ObjectKeywords({
  schema,
  onChange,
}: {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
}) {
  const { t } = useTranslation()
  const [newName, setNewName] = useState('')
  // Properties already configured start collapsed; the ones added now open for editing.
  const [initialNames] = useState(() => new Set(Object.keys(schema.properties ?? {})))
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>
  const required = (Array.isArray(schema.required) ? schema.required : []) as string[]

  const setProperties = (next: Record<string, JsonSchema>, nextRequired = required) => {
    const updated: JsonSchema = { ...schema, properties: next }
    onChange(withKeyword(updated, 'required', nextRequired.length ? nextRequired : undefined))
  }

  const rename = (from: string, to: string) => {
    if (Object.hasOwn(properties, to)) return
    // Rebuilt to keep the property order.
    const next = Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key === from ? to : key, value])
    )
    setProperties(
      next,
      required.map((key) => (key === from ? to : key))
    )
  }

  const add = () => {
    const name = newName.trim()
    if (!name || Object.hasOwn(properties, name)) return
    setProperties({ ...properties, [name]: {} })
    setNewName('')
  }

  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        {t('context.schema.properties')}
      </span>
      <ul className="grid gap-2">
        {Object.entries(properties).map(([name, property]) => (
          <PropertyRow
            key={name}
            name={name}
            schema={property}
            required={required.includes(name)}
            defaultOpen={!initialNames.has(name)}
            onRename={(to) => rename(name, to)}
            onChange={(value) => setProperties({ ...properties, [name]: value })}
            onRequiredChange={(isRequired) =>
              setProperties(
                properties,
                isRequired ? [...required, name] : required.filter((key) => key !== name)
              )
            }
            onRemove={() => {
              const { [name]: _, ...rest } = properties
              setProperties(
                rest,
                required.filter((key) => key !== name)
              )
            }}
          />
        ))}
      </ul>
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('context.schema.property_name')}
          aria-label={t('context.schema.property_name')}
          className="h-8 w-48 font-mono"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!newName.trim()}>
          <Plus size={16} />
          {t('context.schema.add_property')}
        </Button>
      </form>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={schema.additionalProperties !== false}
          onCheckedChange={(checked) =>
            onChange(
              withKeyword(schema, 'additionalProperties', checked === true ? undefined : false)
            )
          }
        />
        {t('context.schema.additional_properties')}
      </label>
    </div>
  )
}

/**
 * Visual editor for the JSON Schema subset the engine validates with: types,
 * nullability, string/number/array constraints and object properties,
 * recursively. Keywords it doesn't know are kept untouched.
 */
export function SchemaBuilder({
  schema,
  onChange,
}: {
  schema: JsonSchema
  onChange: (schema: JsonSchema) => void
}) {
  const { t } = useTranslation()
  const { type, nullable } = readType(schema)
  // Bumped on paste to remount the fields that keep local drafts (enum text, property names).
  const [revision, setRevision] = useState(0)

  return (
    <div className="grid gap-3 border-l-2 pl-3">
      <div className="flex flex-wrap items-end gap-3">
        <Labeled label={t('context.schema.type')}>
          <Select
            value={type}
            onValueChange={(value) => onChange(writeType(schema, value as SchemaType, nullable))}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`context.schema.types.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Labeled>

        {type !== 'any' && type !== 'null' && (
          <label className="flex h-8 items-center gap-2 text-sm">
            <Checkbox
              checked={nullable}
              onCheckedChange={(checked) => onChange(writeType(schema, type, checked === true))}
            />
            {t('context.schema.nullable')}
          </label>
        )}

        <Labeled label={t('context.schema.description')}>
          <Input
            value={typeof schema.description === 'string' ? schema.description : ''}
            onChange={(e) => onChange(withKeyword(schema, 'description', e.target.value))}
            className="h-8 w-64"
          />
        </Labeled>

        <SchemaClipboard
          schema={schema}
          onPaste={(pasted) => {
            onChange(pasted)
            setRevision((current) => current + 1)
          }}
        />
      </div>

      <Fragment key={revision}>
        {type === 'string' && (
          <div className="flex flex-wrap items-end gap-3">
            <NumberKeyword
              schema={schema}
              keyword="minLength"
              label={t('context.schema.min_length')}
              onChange={onChange}
            />
            <NumberKeyword
              schema={schema}
              keyword="maxLength"
              label={t('context.schema.max_length')}
              onChange={onChange}
            />
            <Labeled label={t('context.schema.pattern')}>
              <Input
                value={typeof schema.pattern === 'string' ? schema.pattern : ''}
                onChange={(e) => onChange(withKeyword(schema, 'pattern', e.target.value))}
                className="h-8 w-48 font-mono"
              />
            </Labeled>
            <Labeled label={t('context.schema.format')}>
              <Select
                value={typeof schema.format === 'string' ? schema.format : 'none'}
                onValueChange={(value) =>
                  onChange(withKeyword(schema, 'format', value === 'none' ? undefined : value))
                }
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {t(`context.schema.formats.${format}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Labeled>
            <EnumKeyword schema={schema} onChange={onChange} />
          </div>
        )}

        {(type === 'number' || type === 'integer') && (
          <div className="flex flex-wrap items-end gap-3">
            <NumberKeyword
              schema={schema}
              keyword="minimum"
              label={t('context.schema.minimum')}
              onChange={onChange}
            />
            <NumberKeyword
              schema={schema}
              keyword="maximum"
              label={t('context.schema.maximum')}
              onChange={onChange}
            />
          </div>
        )}

        {type === 'array' && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <NumberKeyword
                schema={schema}
                keyword="minItems"
                label={t('context.schema.min_items')}
                onChange={onChange}
              />
              <NumberKeyword
                schema={schema}
                keyword="maxItems"
                label={t('context.schema.max_items')}
                onChange={onChange}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('context.schema.items')}
            </span>
            <SchemaBuilder
              schema={(schema.items ?? {}) as JsonSchema}
              onChange={(items) => onChange({ ...schema, items })}
            />
          </div>
        )}

        {type === 'object' && <ObjectKeywords schema={schema} onChange={onChange} />}
      </Fragment>
    </div>
  )
}
