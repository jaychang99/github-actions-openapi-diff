import { SchemaObject } from '@/utils/json-to-markdown'
import { jsonToMarkdownTable } from '@/utils/json-to-markdown-table'
import { OpenAPIV3 } from 'openapi-types'

export type RequestBodyFormatter = (args: {
  endpointDetailData: OpenAPIV3.OperationObject
}) => string
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

export const requestBodyFormatter: RequestBodyFormatter = ({
  endpointDetailData
}) => {
  const requestBody = endpointDetailData.requestBody as CustomRequestBodyObject // all refs have been resolved in main.ts
  const doesHaveRequestBody = requestBody !== undefined

  if (!doesHaveRequestBody) {
    return ''
  }

  const requestBodyAdditionalInfo = `
### Request Body
- Content-Type: ${Object.keys(requestBody.content)[0] ?? 'Not Provided'}
- Description: ${requestBody?.description ?? 'Not Provided'}
- Example: ${requestBody?.content?.['application/json']?.example ?? 'Not Provided'}
- Content Required: ${requestBody?.required ?? 'Not Provided'}
`

  const requestBodyMarkdown = requestBody?.content?.['application/json']?.schema
    ? jsonToMarkdownTable({
        schema: requestBody?.content?.['application/json']?.schema
      })
    : ''

  return requestBodyAdditionalInfo + requestBodyMarkdown
}
