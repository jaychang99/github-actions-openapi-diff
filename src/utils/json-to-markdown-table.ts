import { tableFromObject } from '@/formatters/table-from-object'
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

type JsonRowItem = {
  property: string
  type: string
  required: string
  description: string
  example: string
}

const recursivelyFormatNestedObjects = (
  schema: SchemaObject,
  fromArray?: boolean
): JsonRowItem[] => {
  const rows: JsonRowItem[] = []

  if (schema.type === 'array') {
    // console.log('schema', schema)
    const row: JsonRowItem = {
      property: `[]`,
      type: schema.type ?? '',
      required: '-',
      description: schema.description ?? '',
      example: schema.example ?? ''
    }

    rows.push(row)

    if (schema.items.properties) {
      const nestedRows = recursivelyFormatNestedObjects(schema.items, true)
      rows.push(...nestedRows)
    }
  } else {
    if (schema.properties) {
      for (const [propertyName, propertyMetadata] of Object.entries(
        schema.properties
      )) {
        const row: JsonRowItem = {
          property: `${fromArray ? '[].' : ''}${propertyName}`,
          type: propertyMetadata.type ?? '',
          required: schema.required?.includes(propertyName) ? 'Yes' : 'No',
          description: propertyMetadata.description ?? '',
          example: propertyMetadata.example ?? ''
        }

        rows.push(row)

        if (propertyMetadata.properties) {
          const nestedRows = recursivelyFormatNestedObjects(propertyMetadata)
          rows.push(...nestedRows)
        }
      }
    }
  }

  return rows
}

export function jsonToMarkdownTable(obj: SingleReponseObj): string {
  const mdc = new Markdown()

  const headers = ['Property', 'Type', 'Required', 'Description', 'Example']

  // const rows = Object.entries(obj.schema.properties ?? {}).map(
  //   ([propertyName, propertyMetadata]) => [
  //     propertyName,
  //     propertyMetadata.type,
  //     obj.schema.required?.includes(propertyName) ? 'Yes' : 'No',
  //     propertyMetadata.description ?? '',
  //     propertyMetadata.example ?? ''
  //   ]
  // )

  const rows = recursivelyFormatNestedObjects(obj.schema)
  const dataIndex = headers.map(header => header.toLowerCase())

  const tableMarkdown = tableFromObject({ headers, rows, dataIndex })

  mdc.appendToNewLine(tableMarkdown)

  return mdc.toString()
}
