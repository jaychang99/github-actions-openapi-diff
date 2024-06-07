// Utility function to format JSON as Markdown code block

import { table } from '@/formatters/table'
import { Markdown } from '@/utils/markdown/markdown'
import { OpenAPIV3 } from 'openapi-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export type SchemaObject = CustomArraySchemaObject | CustomNonArraySchemaObject
interface CustomArraySchemaObject extends CustomBaseSchemaObject {
  type: OpenAPIV3.ArraySchemaObjectType
  items: SchemaObject // All refs are resolved in main.ts before calling this function
}
interface CustomNonArraySchemaObject extends CustomBaseSchemaObject {
  type?: OpenAPIV3.NonArraySchemaObjectType
}
interface CustomBaseSchemaObject {
  title?: string
  description?: string
  format?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  additionalProperties?: boolean | SchemaObject
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enum?: any[]
  properties?: {
    [name: string]: SchemaObject
  }
  allOf?: SchemaObject[]
  oneOf?: SchemaObject[]
  anyOf?: SchemaObject[]
  not?: SchemaObject
  nullable?: boolean
  discriminator?: OpenAPIV3.DiscriminatorObject
  readOnly?: boolean
  writeOnly?: boolean
  xml?: OpenAPIV3.XMLObject
  externalDocs?: OpenAPIV3.ExternalDocumentationObject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  example?: any
  deprecated?: boolean
}

export type SingleReponseObj = {
  schema: SchemaObject
}

export function jsonToMarkdownTable(obj: SingleReponseObj): string {
  const mdc = new Markdown()

  const headers = ['Property', 'Type', 'Required', 'Description', 'Example']

  const rows = Object.entries(obj.schema.properties ?? {}).map(
    ([propertyName, propertyMetadata]) => [
      propertyName,
      propertyMetadata.type,
      obj.schema.required?.includes(propertyName) ? 'Yes' : 'No',
      propertyMetadata.description ?? '',
      propertyMetadata.example ?? ''
    ]
  )

  const tableMarkdown = table({ headers, rows })

  mdc.appendToNewLine(tableMarkdown)

  return mdc.toString()
}
