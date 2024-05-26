import { OpenAPIV3 } from 'openapi-types'
import { CustomPathDiffItem } from './generate-markdown-diff'
import { SchemaObject, jsonToMarkdown } from './json-to-markdown'
import { bold } from '../formatters/bold'

type FormatSingleApiEndpointAsMarkdown = (
  endpoint: CustomPathDiffItem,
  shouldCheckForChanges?: boolean
) => string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isReferenceObject = (obj: any): obj is { $ref: string } => {
  return obj.$ref !== undefined
}

const symbolByMethod: Record<CustomPathDiffItem['method'], string> = {
  get: '🟦',
  post: '🟩',
  put: '🟧',
  delete: '🟥',
  patch: '♻️',
  options: '⚙️',
  head: '🔍',
  trace: '🔍'
}

export const formatSingleApiEndpointAsMarkdown: FormatSingleApiEndpointAsMarkdown =
  (endpoint, shouldCheckForChanges = false) => {
    const { url, method, endpointDetailData, baseApiEndpoint } = endpoint
    const { responses } = endpointDetailData
    const successResponse = (responses['200'] ??
      responses['201']) as OpenAPIV3.ResponseObject // all refs have been resolved in main.ts
    const successResponseContent =
      successResponse?.content?.['application/json'] ??
      successResponse?.content?.['text/plain']
    const successResponseContentSchema =
      successResponseContent?.schema as SchemaObject

    const responseMarkdown = successResponseContent?.schema
      ? jsonToMarkdown({ schema: successResponseContentSchema })
      : ''

    const parameterMarkdownArray = Object.entries(
      endpointDetailData.parameters ?? {}
    ).map(([key, value]) => {
      if (isReferenceObject(value)) {
        return `| ${key} | - | - | - | - |`
      }

      if (shouldCheckForChanges && baseApiEndpoint) {
        const isAdded = Object.keys(baseApiEndpoint.parameters ?? {}).includes(
          key
        )
        const isRemoved = !Object.keys(
          endpointDetailData.parameters ?? {}
        ).includes(key)
        const shouldEmphasize = isAdded || isRemoved

        if (shouldEmphasize) {
          return `| ${bold(value.name)} ${isAdded ? '➕✅' : ''}${isRemoved ? '➖❌' : ''} | ${bold(value.required)} | ${bold(value.in)} | ${bold(value.description)} | ${bold(value.example)} |`
        }

        return `| ${value.name} | ${value.required} | ${value.in} | ${value.description} | ${value.example} |`
      }

      return `| ${value.name} | ${value.required} | ${value.in} | ${value.description} | ${value.example} |`
    })

    const doesHaveParameters = parameterMarkdownArray.length > 0

    const generatedMarkdown = `
---
## ${symbolByMethod[method]} ${method.toUpperCase()}: ${url}

- ${endpointDetailData.summary}
- ${endpointDetailData.description}

${
  doesHaveParameters
    ? `
### Request Parameters
| Name | Required | In | Description | Example |
| ---- | -------- | -- | ----------- | ------- |
${parameterMarkdownArray.join('\n')}
`
    : ''
}

### Response Parameters

${responseMarkdown}

`

    // console.log(generatedMarkdown)

    return generatedMarkdown
  }
