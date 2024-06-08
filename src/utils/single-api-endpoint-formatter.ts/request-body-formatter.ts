import { tableFromObject } from '@/formatters/table-from-object'
import { FlattenedSchemaPropertyItem } from '@/types/flattened-schema-property-item'
import { getflattenedSchema } from '@/utils/get-flattened-schema'
import { SchemaObject } from '@/utils/json-to-markdown'
import { Markdown } from '@/utils/markdown/markdown'
import { OpenAPIV3 } from 'openapi-types'

export type RequestBodyFormatter = (args: {
  endpointDetailData: OpenAPIV3.OperationObject
  baseRequestBody?: CustomRequestBodyObject
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

export interface CustomRequestBodyObject {
  description?: string
  content: {
    [media: string]: CustomMediaTypeObject
  }
  required?: boolean
}

export const requestBodyFormatter: RequestBodyFormatter = ({
  endpointDetailData,
  baseRequestBody // only used for modified endpoints
}) => {
  let flattenedRequestBody: FlattenedSchemaPropertyItem[] = []
  let flattenedBaseRequestBody: FlattenedSchemaPropertyItem[] = []

  if (baseRequestBody) {
    const resolvedBaseRequestBody =
      baseRequestBody as unknown as CustomRequestBodyObject

    const baseRequestBodyContent =
      resolvedBaseRequestBody?.content?.['application/json'] ??
      resolvedBaseRequestBody?.content?.['text/plain']

    const baseRequestBodyContentSchema =
      baseRequestBodyContent?.schema as SchemaObject

    flattenedBaseRequestBody = getflattenedSchema(baseRequestBodyContentSchema)
  }

  const requestBody = endpointDetailData.requestBody as CustomRequestBodyObject // all refs have been resolved in main.ts
  flattenedRequestBody = requestBody.content['application/json'].schema
    ? getflattenedSchema(requestBody.content['application/json'].schema)
    : []
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
  const baseFlattenedSchemaPropertyList = flattenedBaseRequestBody?.map(
    row => row.property
  )
  const rowsFromNewBody = flattenedRequestBody.map(row => {
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

  const requestBodyMarkdown = requestBody?.content?.['application/json']?.schema
    ? mdc.toString()
    : ''

  return requestBodyAdditionalInfo + requestBodyMarkdown
}
