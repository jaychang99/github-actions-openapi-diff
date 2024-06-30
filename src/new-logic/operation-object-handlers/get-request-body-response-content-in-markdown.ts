import { MarkdownGenerator } from '@/new-logic/markdown/markdown-generator'
import { schemaToMarkdown } from '@/new-logic/operation-object-handlers/schema-to-markdown'
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

      md.addTableHeader(tableHeaders)
      md.setCurrentTableHeader(tableHeaders)
      schemaToMarkdown(schema, md, 0)
    }

    return md.getMarkdown()
  }
