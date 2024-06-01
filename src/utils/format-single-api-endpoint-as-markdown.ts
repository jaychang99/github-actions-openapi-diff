import { OpenAPIV3 } from 'openapi-types'
import { CustomPathDiffItem } from './generate-markdown-diff'
import { SchemaObject, jsonToMarkdown } from './json-to-markdown'
import { responseFormatter } from '@/utils/single-api-endpoint-formatter.ts/response-formatter'
import { requestParametersFormatter } from '@/utils/single-api-endpoint-formatter.ts/request-parameters-formatter'

type FormatSingleApiEndpointAsMarkdown = (
  endpoint: CustomPathDiffItem,
  shouldCheckForChanges?: boolean
) => string

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

    const parametersMarkdownTable = requestParametersFormatter({
      endpointDetailData,
      baseApiEndpoint,
      shouldCheckForChanges
    })

    const generatedMarkdown = `
---
## ${symbolByMethod[method]} ${method.toUpperCase()}: ${url}

- Summary: ${endpointDetailData.summary ?? 'Not Provided'}
- Description: ${endpointDetailData.description ?? 'Not Provided'}

${parametersMarkdownTable}

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
