import { MarkdownGenerator } from '@/new-logic/markdown/markdownGenerator'
import { OpenAPIV3 } from 'openapi-types'

type GetRequestBodyResponseContentInMarkdown = (arg: {
  content:
    | OpenAPIV3.ResponseObject['content']
    | OpenAPIV3.RequestBodyObject['content']
  tableHeaders: string[]
}) => string

export const getRequestBodyResponseContentInMarkdown: GetRequestBodyResponseContentInMarkdown =
  ({ content, tableHeaders }) => {
    const md = new MarkdownGenerator()

    for (const contentItemKey in content) {
      const contentItem = content[contentItemKey]
      md.addH3(contentItemKey)

      const { schema } = contentItem

      if (schema && !('$ref' in schema)) {
        if (schema.type === 'array') {
          // ArraySchemaObject
        } else {
          // NonArraySchemaObject
          const { properties } = schema

          md.addTableHeader(tableHeaders)
          md.setCurrentTableHeader(tableHeaders)
          for (const propertyKey in properties) {
            const property = properties[propertyKey]

            if ('$ref' in property) {
              // Reference Object
            } else {
              // NonReferenceObject
              md.addTableRow({
                title: propertyKey,
                description: property.description ?? '',
                type: property.type ?? '',
                example: property.example ?? '',
                default: property.default ?? '',
                enum:
                  property.enum &&
                  MarkdownGenerator.arrayToMarkdown(property.enum)
              })
            }
          }
        }
      }
    }

    return md.getMarkdown()
  }
