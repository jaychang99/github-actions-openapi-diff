import { ApiEndpoint } from '@/new-logic/api-endpoint/api-endpoint'
import { OpenAPIV3 } from 'openapi-types'

type TransformOpenapiDocToClass = (
  openapiJson: OpenAPIV3.Document
) => ApiEndpoint[]

const OPENAPI_HTTP_METHODS = OpenAPIV3.HttpMethods

const isPathItemObjectKeyHttpMethod = (
  key: string
): key is OpenAPIV3.HttpMethods => {
  const validKeyList = Object.values(OPENAPI_HTTP_METHODS) as string[]

  return validKeyList.includes(key)
}

export const transformOpenapiDocToClass: TransformOpenapiDocToClass =
  openapiJson => {
    const { paths } = openapiJson
    const endpointList: ApiEndpoint[] = []

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

        const ep = new ApiEndpoint(method, url, endpointItem.description)

        const { parameters, requestBody, responses } = endpointItem

        /**
         * Evaluate parameters
         */
        for (const parameter of parameters ?? []) {
          if ('$ref' in parameter) {
            // Reference Object
            continue
          }

          ep.setParameter(parameter)
        }

        /**
         * Evaluate requestBody
         */
        if (requestBody) {
          if (!('$ref' in requestBody)) {
            ep.setRequestBody(requestBody)
          } else {
            // when requestBody itself is a Referece Object
          }
        }

        /**
         * Evaluate responses
         */
        for (const responseKey in responses) {
          const response = responses[responseKey]

          if (!('$ref' in response)) {
            // ResponseObject
            if (response.content?.['application/json']) {
              ep.setResponse(response.content?.['application/json'])
            }
          } else {
            // ReferenceObject
          }
        }

        endpointList.push(ep)
      }
    }

    return endpointList
  }
