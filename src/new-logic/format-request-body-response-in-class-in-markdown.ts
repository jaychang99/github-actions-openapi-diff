import { ApiEndpoint } from '@/new-logic/api-endpoint/api-endpoint'
import { MarkdownGenerator } from '@/new-logic/markdown/markdown-generator'

type FormatRequestBodyResponseInClassInMarkdown = (arg: {
  content: ApiEndpoint['requestBody']
  tableHeaders: string[]
}) => string

export const formatRequestBodyResponseInClassInMarkdown: FormatRequestBodyResponseInClassInMarkdown =
  ({ content, tableHeaders }) => {
    const md = new MarkdownGenerator()
    md.addTableHeader(tableHeaders)

    for (const item of content) {
      const {
        title,
        type,
        description,
        default: defaultValue,
        enum: enumValues,
        required,
        example,
        deprecated,
        added,
        removed,
        modified,
        changedFields
      } = item

      md.setCurrentTableHeader(tableHeaders)
      md.addTableRow({
        title: title ?? '',
        type: type ?? '',
        description: description ?? '',
        default: defaultValue ?? '',
        enum: enumValues ? MarkdownGenerator.arrayToMarkdown(enumValues) : '',
        required:
          typeof required === 'boolean'
            ? required.toString()
            : required?.join(', '),
        example: example ?? '',
        deprecated: deprecated ?? false,
        added: added ?? false,
        removed: removed ?? false,
        modified: modified ?? false,
        changedFields: changedFields
          ? MarkdownGenerator.arrayToMarkdown(changedFields)
          : ''
      })
    }

    return md.getMarkdown()
  }
