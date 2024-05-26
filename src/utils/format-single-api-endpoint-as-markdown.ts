import { OpenAPIV3 } from 'openapi-types'
import { CustomPathDiffItem } from './generate-markdown-diff'
import { SchemaObject, jsonToMarkdown } from './json-to-markdown'

type FormatSingleApiEndpointAsMarkdown = (
  endpoint: CustomPathDiffItem
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
  endpoint => {
    const { url, method, endpointDetailData } = endpoint
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
