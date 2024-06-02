// Utility function to format JSON as Markdown code block

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

// recursively format nested objects until obj.type is not 'object' , 'array' , null or undefined
// WRITE YOUR CODE HERE

export function jsonToMarkdown(obj: SingleReponseObj): string {
  const isArray = obj.schema.type === 'array'
  const properties =
    obj.schema.type === 'array'
      ? obj.schema.items?.properties
      : obj.schema.properties

  if (!properties) return ''

  let md = '```markdown\n'

  if (isArray) md += '[\n'
  const requiredArray = obj.schema.required
  for (const property of Object.entries(properties)) {
    const [propertyName, propertyMetadata] = property
    const nullableMark = propertyMetadata.nullable ? 'NULLABLE 🚨' : ''
    const nullableQuestionMark = propertyMetadata.nullable ? '?' : ''

    const requiredMark =
      requiredArray && requiredArray.includes(propertyName) ? 'REQUIRED 🔥' : ''
    md += `${propertyName}${nullableQuestionMark} : ${propertyMetadata.type}; ${nullableMark}${requiredMark} \n📎${propertyMetadata.description ?? 'Description Not Provided'} \n📚EX) ${propertyMetadata.example ?? 'Example Not Provided'} \n\n`

    if (propertyMetadata.type === 'array') {
      const items = propertyMetadata.items?.properties
      if (!items) continue
      if (propertyMetadata.type === 'array') md += '  [\n'
      for (const item of Object.entries(items)) {
        const [itemName, itemMetadata] = item
        const nullableMarkSub = itemMetadata.nullable ? 'NULLABLE 🚨' : ''
        const nullableQuestionMarkSub = itemMetadata.nullable ? '?' : ''
        const indent = isArray ? '    ' : ''
        md += `${indent}${itemName}${nullableQuestionMarkSub} : ${itemMetadata.type}; ${nullableMarkSub} \n${indent}📎${itemMetadata.description ?? 'Description Not Provided'} \n${indent}📚EX) ${itemMetadata.example ?? 'Example Not Provided'} \n\n`
      }
      if (propertyMetadata.type === 'array') md += '  ]\n'
    }
  }
  if (isArray) md += ']\n'

  md += '```'

  return md
}
