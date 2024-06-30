import { MarkdownGenerator } from '@/new-logic/markdown/markdown-generator'
import { getRequestBodyResponseContentInMarkdown } from '@/new-logic/operation-object-handlers/get-request-body-response-content-in-markdown'
import { OpenAPIV3 } from 'openapi-types'

type FormatOpenApiToMarkdown = (openapiJson: OpenAPIV3.Document) => string

const OPENAPI_HTTP_METHODS = OpenAPIV3.HttpMethods
const DEFAULT_MESSAGES = {
  UNDEFINED_DESCRIPTION: '-'
}
type CustomParameterItemType = {
  name?: string
  in?: string
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  schema?: string
  example?: string
  examples?: string
  content?: string
}
const PARAMETERS_TABLE_HEADERS = [
  'name',
  'in',
  'description',
  'required',
  'deprecated',
  'allowEmptyValue',
  'schema',
  'example',
  'examples',
  'content'
]

const REQUEST_BODY_TABLE_HEADERS = [
  'title',
  'type',
  'description',
  'default',
  'enum',
  'content',
  'required',
  'properties',
  'example',
  'deprecated'
]

const isPathItemObjectKeyHttpMethod = (
  key: string
): key is OpenAPIV3.HttpMethods => {
  const validKeyList = Object.values(OPENAPI_HTTP_METHODS) as string[]

  return validKeyList.includes(key)
}

export const formatOpenApiToMarkdown: FormatOpenApiToMarkdown = openapiJson => {
  const { paths } = openapiJson
  const markdownList: string[] = []

  for (const path in paths) {
    const url = path
    const pathItemWithAllMethods = paths[path]

    for (const key in pathItemWithAllMethods) {
      if (!isPathItemObjectKeyHttpMethod(key)) {
        continue
      }

      const method = key
      const endpointItem = pathItemWithAllMethods[method]

      if (!endpointItem) {
        continue
      }

      const md = new MarkdownGenerator()

      const { description, parameters, requestBody, responses } = endpointItem
      const { UNDEFINED_DESCRIPTION } = DEFAULT_MESSAGES

      md.addHorizontalRule()
      md.addH1(`${method.toUpperCase()}: ${url}`)

      md.addBulletPoint(`Description: ${description ?? UNDEFINED_DESCRIPTION}`)

      md.addH2('Parameters')
      md.addTableHeader(PARAMETERS_TABLE_HEADERS)
      md.setCurrentTableHeader(PARAMETERS_TABLE_HEADERS)
      for (const parameter of parameters ?? []) {
        if ('$ref' in parameter) {
          // Reference Object
          continue
        }

        const {
          name,
          in: location,
          description: parameterDescription,
          required,
          deprecated,
          allowEmptyValue,
          // schema,
          example
          // examples,
          // content
        } = parameter

        md.addTableRow<CustomParameterItemType>({
          name: name ?? '',
          in: location ?? '',
          description: parameterDescription ?? '',
          required,
          deprecated,
          allowEmptyValue,
          // schema,
          example
          // examples,
          // content
        })
      }

      if (requestBody) {
        if (!('$ref' in requestBody)) {
          md.addH2('Request Body')

          const requestBodyMd = getRequestBodyResponseContentInMarkdown({
            content: requestBody.content,
            tableHeaders: REQUEST_BODY_TABLE_HEADERS
          })

          md.addString(requestBodyMd)
        } else {
          // when requestBody itself is a Referece Object
        }
      }

      for (const responseKey in responses) {
        const response = responses[responseKey]

        md.addH2(`Response: ${responseKey}`)

        if (!('$ref' in response)) {
          // ResponseObject

          md.addBulletPoint(
            `Description: ${response.description ?? UNDEFINED_DESCRIPTION}`
          )

          const responseBodyMd = getRequestBodyResponseContentInMarkdown({
            content: response.content,
            tableHeaders: REQUEST_BODY_TABLE_HEADERS
          })

          md.addString(responseBodyMd)
        } else {
          // ReferenceObject
        }
      }

      markdownList.push(md.getMarkdown())
    }
  }

  return markdownList.join('\n')
}
