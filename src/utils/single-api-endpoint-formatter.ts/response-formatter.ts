import { tableFromObject } from '@/formatters/table-from-object'
import { FlattenedSchemaPropertyItem } from '@/types/flattened-schema-property-item'
import { getflattenedSchema } from '@/utils/get-flattened-schema'
import { SchemaObject } from '@/utils/json-to-markdown'
import { Markdown } from '@/utils/markdown/markdown'
import { OpenAPIV3 } from 'openapi-types'

type ResponseFormatter = (
  responses: OpenAPIV3.ResponsesObject,
  baseResponse?: OpenAPIV3.ResponsesObject
) => string

export const responseFormatter: ResponseFormatter = (
  responses,
  baseResponse
) => {
  let flattenedResponse: FlattenedSchemaPropertyItem[] = []
  let flattenedBaseResponse: FlattenedSchemaPropertyItem[] = []

  if (baseResponse) {
    const successBaseReponse = (baseResponse['200'] ??
      baseResponse['201']) as OpenAPIV3.ResponseObject // all refs have been resolved in main.ts

    const successBaseResponseContent =
      successBaseReponse?.content?.['application/json'] ??
      successBaseReponse?.content?.['text/plain']

    const successBaseResponseContentSchema =
      successBaseResponseContent?.schema as SchemaObject

    flattenedBaseResponse = getflattenedSchema(successBaseResponseContentSchema)
  }
  const successResponse = (responses['200'] ??
    responses['201']) as OpenAPIV3.ResponseObject // all refs have been resolved in main.ts

  const successResponseContent =
    successResponse?.content?.['application/json'] ??
    successResponse?.content?.['text/plain']

  const successResponseContentSchema =
    successResponseContent?.schema as SchemaObject

  flattenedResponse = getflattenedSchema(successResponseContentSchema)

  // const responseMarkdown = successResponseContent?.schema
  //   ? jsonToMarkdownTable({ schema: successResponseContentSchema })
  //   : ''

  const mdc = new Markdown()

  const headers = ['Property', 'Type', 'Required', 'Description', 'Example']

  // const rows = Object.entries(obj.schema.properties ?? {}).map(
  //   ([propertyName, propertyMetadata]) => [
  //     propertyName,
  //     propertyMetadata.type,
  //     obj.schema.required?.includes(propertyName) ? 'Yes' : 'No',
  //     propertyMetadata.description ?? '',
  //     propertyMetadata.example ?? ''
  //   ]
  // )
  const baseFlattenedSchemaPropertyList = flattenedBaseResponse?.map(
    row => row.property
  )
  const rowsFromNewBody = flattenedResponse.map(row => {
    const hasBeenAdded = !baseFlattenedSchemaPropertyList.includes(row.property)

    return {
      property: `${hasBeenAdded ? '✅' : ''} ${row.property}`,
      type: row.type,
      required: row.required,
      description: row.description,
      example: row.example
    }
  })
  const rows = [...rowsFromNewBody]
  const dataIndex = headers.map(header => header.toLowerCase())

  const tableMarkdown = tableFromObject({ headers, rows, dataIndex })

  mdc.appendToNewLine(tableMarkdown)

  const responseMarkdown = successResponseContent?.schema ? mdc.toString() : ''

  return responseMarkdown
}
