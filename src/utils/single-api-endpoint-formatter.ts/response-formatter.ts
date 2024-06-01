import { SchemaObject, jsonToMarkdown } from '@/utils/json-to-markdown'
import { OpenAPIV3 } from 'openapi-types'

type ResponseFormatter = (responses: OpenAPIV3.ResponsesObject) => string

export const responseFormatter: ResponseFormatter = responses => {
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

  return responseMarkdown
}
