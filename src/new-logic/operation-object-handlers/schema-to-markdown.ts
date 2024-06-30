import { MarkdownGenerator } from '@/new-logic/markdown/markdown-generator'
import { OpenAPIV3 } from 'openapi-types'

type SchemaToMarkdown = (
  schema: OpenAPIV3.MediaTypeObject['schema'],
  md: MarkdownGenerator,
  depth: number,
  previousPropertyKey?: string
) => string
export const schemaToMarkdown: SchemaToMarkdown = (
  schema,
  md,
  depth,
  previousPropertyKey = ''
) => {
  if (schema && !('$ref' in schema)) {
    if (schema.type === 'array') {
      // ArraySchemaObject
      if (!('$ref' in schema.items)) {
        const { properties } = schema.items

        for (const propertyKey in properties) {
          const property = properties[propertyKey]

          if ('$ref' in property) {
            // Reference Object
          } else {
            // NonReferenceObject
            const title = `${previousPropertyKey}[].${propertyKey}`

            md.addTableRow({
              title,
              description: property.description ?? '',
              type: property.type ?? '',
              example: property.example ?? '',
              default: property.default ?? '',
              enum:
                property.enum &&
                MarkdownGenerator.arrayToMarkdown(property.enum)
            })

            schemaToMarkdown(property, md, depth + 1, title)
          }
        }
      }
    } else {
      // NonArraySchemaObject
      const { properties } = schema

      for (const propertyKey in properties) {
        const property = properties[propertyKey]

        if ('$ref' in property) {
          // Reference Object
        } else {
          // NonReferenceObject
          const title = `${previousPropertyKey}${propertyKey}`

          md.addTableRow({
            title,
            description: property.description ?? '',
            type: property.type ?? '',
            example: property.example ?? '',
            default: property.default ?? '',
            enum:
              property.enum && MarkdownGenerator.arrayToMarkdown(property.enum)
          })

          schemaToMarkdown(property, md, depth + 1, title)
        }
      }
    }
  }

  return md.getMarkdown()
}
