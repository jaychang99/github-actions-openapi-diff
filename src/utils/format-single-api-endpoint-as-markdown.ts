import { OpenAPIV3 } from 'openapi-types'
import { CustomPathDiffItem } from './generate-markdown-diff'
import { SchemaObject, jsonToMarkdown } from './json-to-markdown'
import { bold } from '../formatters/bold'
import { table } from '@/formatters/table'
import { responseFormatter } from '@/utils/single-api-endpoint-formatter.ts/response-formatter'

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

const PARAMETER_TABLE_HEADERS = [
  'Name',
  'Required',
  'In',
  'Description',
  'Example'
]

interface CustomMediaTypeObject {
  schema?: SchemaObject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  example?: any
  examples?: {
    [media: string]: OpenAPIV3.ExampleObject
  }
  encoding?: {
    [media: string]: OpenAPIV3.EncodingObject
  }
}

interface CustomRequestBodyObject {
  description?: string
  content: {
    [media: string]: CustomMediaTypeObject
  }
  required?: boolean
}
export const formatSingleApiEndpointAsMarkdown: FormatSingleApiEndpointAsMarkdown =
  (endpoint, shouldCheckForChanges = false) => {
    const { url, method, endpointDetailData, baseApiEndpoint } = endpoint
    const { responses } = endpointDetailData

    const responseMarkdown = responseFormatter(responses)
    const requestBody =
      endpointDetailData.requestBody as CustomRequestBodyObject // all refs have been resolved in main.ts

    const requestBodyMarkdown = requestBody?.content?.['application/json']
      ?.schema
      ? jsonToMarkdown({
          schema: requestBody?.content?.['application/json']?.schema
        })
      : ''

    const doesHaveRequestBody = requestBody !== undefined

    const parameterTableRows: string[][] = Object.entries(
      endpointDetailData.parameters ?? {}
    ).map(([key, value]) => {
      if (isReferenceObject(value)) {
        return [key, '-', '-', '-', '-']
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
          return [
            bold(value.name),
            bold(value.required),
            bold(value.in),
            bold(value.description),
            bold(value.example)
          ]
        }

        return [
          value.name,
          value.required,
          value.in,
          value.description,
          value.example
        ]
      }

      return [
        value.name,
        value.required,
        value.in,
        value.description,
        value.example
      ]
    })

    const doesHaveParameters = parameterTableRows.length > 0
    const parametersMarkdownTable = table({
      headers: PARAMETER_TABLE_HEADERS,
      rows: parameterTableRows
    })

    const generatedMarkdown = `
---
## ${symbolByMethod[method]} ${method.toUpperCase()}: ${url}

- Summary: ${endpointDetailData.summary ?? 'Not Provided'}
- Description: ${endpointDetailData.description ?? 'Not Provided'}

${doesHaveParameters ? parametersMarkdownTable : ''}

${
  doesHaveRequestBody
    ? `
### Request Body
- Content-Type: ${Object.keys(requestBody.content)[0] ?? 'Not Provided'}
- Description: ${requestBody?.description ?? 'Not Provided'}
- Example: ${requestBody?.content?.['application/json']?.example ?? 'Not Provided'}
- Content Required: ${requestBody?.required ?? 'Not Provided'}

${requestBodyMarkdown}
`
    : ''
}

${
  responseMarkdown !== ''
    ? `
### Response Parameters

${responseMarkdown}
`
    : ''
}
  
`

    // console.log(generatedMarkdown)

    return generatedMarkdown
  }
