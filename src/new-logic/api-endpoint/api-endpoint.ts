import {
  CustomApiEndpoint,
  CustomParameterRecordItem,
  CustomRequestBodyRecordItem,
  CustomResponseRecordItem
} from '@/new-logic/types/custom-api-interfaces'
import { OpenAPIV3 } from 'openapi-types'

type RequestBodyOrResponse = 'requestBody' | 'response'

export class ApiEndpoint {
  constructor(
    private method: CustomApiEndpoint['method'],
    private url: CustomApiEndpoint['url'],
    private description?: CustomApiEndpoint['description']
  ) {
    this.method = method
    this.url = url
    this.description = description
  }
  added = false
  removed = false
  modified = false
  parameters: CustomApiEndpoint['parameters'] = []
  requestBody: CustomApiEndpoint['requestBody'] = []
  response: CustomApiEndpoint['response'] = []

  getEndpoint(): CustomApiEndpoint {
    return {
      method: this.method,
      url: this.url,
      description: this.description ?? '',
      parameters: this.parameters,
      requestBody: this.requestBody,
      response: this.response
    }
  }

  _recursivelyHandleSchema(
    schema: OpenAPIV3.MediaTypeObject['schema'],
    previousPropertyKey = '',
    requestBodyOrResponse: RequestBodyOrResponse
  ): void {
    if (schema && !('$ref' in schema)) {
      if (schema.type === 'array') {
        // ArraySchemaObject
        if (schema) {
          console.log('schema:', schema)
        }
        if (!('$ref' in schema.items)) {
          const { properties } = schema.items

          for (const propertyKey in properties) {
            const property = properties[propertyKey]

            if ('$ref' in property) {
              // Reference Object
            } else {
              // NonReferenceObject
              const title = `${previousPropertyKey}[].${propertyKey}`

              this._setRequestBodyOrResponse(
                {
                  title,
                  type: property.type ?? '',
                  description: property.description ?? '',
                  default: property.default ?? '',
                  enum: property.enum,
                  required: property.required ?? [],
                  example: property.example ?? '',
                  deprecated: property.deprecated ?? false
                },
                requestBodyOrResponse,
                property
              )
            }
          }
        }
      } else {
        // NonArraySchemaObject
        const { properties } = schema

        for (const propertyKey in properties) {
          const property = properties[propertyKey]

          if ('$ref' in property) {
            // Reference Object
          } else {
            // NonReferenceObject
            const title = `${previousPropertyKey}${propertyKey}`

            this._setRequestBodyOrResponse(
              {
                title,
                type: property.type ?? '',
                description: property.description ?? '',
                default: property.default ?? '',
                enum: property.enum,
                required: property.required ?? false,
                example: property.example ?? '',
                deprecated: property.deprecated ?? false
              },
              requestBodyOrResponse,
              property
            )
          }
        }
      }
    }
  }

  _setRequestBodyOrResponse(
    item: CustomRequestBodyRecordItem | CustomResponseRecordItem,
    requestBodyOrResponse: RequestBodyOrResponse,
    nextSchemaToPass?: OpenAPIV3.MediaTypeObject['schema']
  ): void {
    switch (requestBodyOrResponse) {
      case 'requestBody':
        this.requestBody.push(item)
        break
      case 'response':
        this.response.push(item)
        break
    }

    this._recursivelyHandleSchema(
      nextSchemaToPass,
      item.title,
      requestBodyOrResponse
    )
  }

  _findParameterByName(name: string): CustomParameterRecordItem | undefined {
    return this.parameters.find(parameter => parameter.name === name)
  }

  _findRequestBodyOrResponseByTitle(
    title: string,
    requestBodyOrResponse: RequestBodyOrResponse
  ): CustomRequestBodyRecordItem | CustomResponseRecordItem | undefined {
    switch (requestBodyOrResponse) {
      case 'requestBody':
        return this.requestBody.find(requestBody => requestBody.title === title)
      case 'response':
        return this.response.find(response => response.title === title)
    }
  }

  setParameter(parameter: CustomParameterRecordItem): void {
    this.parameters.push(parameter)
  }

  setRequestBody(requestBody: CustomRequestBodyRecordItem): void {
    this._setRequestBodyOrResponse(
      requestBody,
      'requestBody',
      requestBody.schema
    )
  }

  setResponse(response: CustomResponseRecordItem): void {
    this._setRequestBodyOrResponse(response, 'response', response.schema)
  }

  markEndpointAsAdded(): void {
    this.added = true
  }

  markEndpointAsRemoved(): void {
    this.removed = true
  }

  markParameterAsAddedByName(name: string): void {
    const parameter = this._findParameterByName(name)

    if (parameter) {
      parameter.added = true
    }
  }

  markRequestBodyOrResponseAsAddedByTitle(
    title: string,
    requestBodyOrResponse: RequestBodyOrResponse
  ): void {
    const requestBodyOrResponseItem = this._findRequestBodyOrResponseByTitle(
      title,
      requestBodyOrResponse
    )

    if (requestBodyOrResponseItem) {
      requestBodyOrResponseItem.added = true
    }
  }

  getApiEndpoint(): CustomApiEndpoint {
    return {
      method: this.method,
      url: this.url,
      description: this.description ?? '',
      parameters: this.parameters,
      requestBody: this.requestBody,
      response: this.response
    }
  }

  findSameApiEndpointFromOtherList(
    otherList: ApiEndpoint[]
  ): ApiEndpoint | undefined {
    // TODO: possibly improve performance
    return otherList.find(
      otherApiEndpoint =>
        otherApiEndpoint.method === this.method &&
        otherApiEndpoint.url === this.url
    )
  }

  _compareWithPreviousApiEndpointParametersAndMarkChanges(
    previousApiEndpoint: ApiEndpoint
  ): void {
    for (const parameter of this.parameters) {
      const previousParameter = previousApiEndpoint._findParameterByName(
        parameter.name ?? ''
      )

      if (!previousParameter) {
        parameter.added = true
        continue
      }
      if (!parameter.changedFields) {
        parameter.changedFields = []
      }

      if (parameter.in !== previousParameter.in) {
        parameter.modified = true
        parameter.changedFields.push('in')
      }

      if (parameter.description !== previousParameter.description) {
        parameter.modified = true
        parameter.changedFields.push('description')
      }

      if (parameter.required !== previousParameter.required) {
        parameter.modified = true
        parameter.changedFields.push('required')
      }

      if (parameter.example !== previousParameter.example) {
        parameter.modified = true
        parameter.changedFields.push('example')
      }

      if (parameter.deprecated !== previousParameter.deprecated) {
        parameter.modified = true
        parameter.changedFields.push('deprecated')
      }
    }
  }

  _compareWithPreviousApiEndpointRequestBodyOrResponseAndMarkChanges(
    previousApiEndpoint: ApiEndpoint,
    requestBodyOrResponse: RequestBodyOrResponse
  ): void {
    const currentRequestBodyOrResponseList =
      requestBodyOrResponse === 'requestBody' ? this.requestBody : this.response

    const previousRequestBodyOrResponseList =
      requestBodyOrResponse === 'requestBody'
        ? previousApiEndpoint.requestBody
        : previousApiEndpoint.response

    for (const currentRequestBodyOrResponse of currentRequestBodyOrResponseList) {
      const previousRequestBodyOrResponse =
        previousRequestBodyOrResponseList.find(
          previous => previous.title === currentRequestBodyOrResponse.title
        )

      if (!previousRequestBodyOrResponse) {
        currentRequestBodyOrResponse.added = true
        continue
      }

      if (!currentRequestBodyOrResponse.changedFields) {
        currentRequestBodyOrResponse.changedFields = []
      }

      if (
        currentRequestBodyOrResponse.type !== previousRequestBodyOrResponse.type
      ) {
        currentRequestBodyOrResponse.modified = true
        currentRequestBodyOrResponse.changedFields.push('type')
      }

      if (
        currentRequestBodyOrResponse.description !==
        previousRequestBodyOrResponse.description
      ) {
        currentRequestBodyOrResponse.modified = true
        currentRequestBodyOrResponse.changedFields.push('description')
      }

      if (
        currentRequestBodyOrResponse.default !==
        previousRequestBodyOrResponse.default
      ) {
        currentRequestBodyOrResponse.modified = true
        currentRequestBodyOrResponse.changedFields.push('default')
      }

      const isEnumEqual =
        currentRequestBodyOrResponse.enum?.length ===
          previousRequestBodyOrResponse.enum?.length &&
        currentRequestBodyOrResponse.enum?.every((value, index) => {
          return value === previousRequestBodyOrResponse.enum?.[index]
        })

      if (
        !isEnumEqual &&
        JSON.stringify(currentRequestBodyOrResponse.enum) !==
          JSON.stringify(previousRequestBodyOrResponse.enum)
      ) {
        currentRequestBodyOrResponse.modified = true
        currentRequestBodyOrResponse.changedFields.push('enum')
      }

      if (
        currentRequestBodyOrResponse.required !==
        previousRequestBodyOrResponse.required
      ) {
        currentRequestBodyOrResponse.modified = true
        currentRequestBodyOrResponse.changedFields.push('required')
      }

      if (
        currentRequestBodyOrResponse.example !==
        previousRequestBodyOrResponse.example
      ) {
        currentRequestBodyOrResponse.modified = true
        currentRequestBodyOrResponse.changedFields.push('example')
      }

      if (
        currentRequestBodyOrResponse.deprecated !==
        previousRequestBodyOrResponse.deprecated
      ) {
        currentRequestBodyOrResponse.modified = true
        currentRequestBodyOrResponse.changedFields.push('deprecated')
      }
    }
  }

  compareWithPreviousApiEndpointAndMarkChanges(
    previousApiEndpoint: ApiEndpoint
  ): void {
    this._compareWithPreviousApiEndpointParametersAndMarkChanges(
      previousApiEndpoint
    )

    this._compareWithPreviousApiEndpointRequestBodyOrResponseAndMarkChanges(
      previousApiEndpoint,
      'requestBody'
    )

    this._compareWithPreviousApiEndpointRequestBodyOrResponseAndMarkChanges(
      previousApiEndpoint,
      'response'
    )

    this.modified =
      this.parameters.some(parameter => parameter.modified) ||
      this.requestBody.some(requestBody => requestBody.modified) ||
      this.response.some(response => response.modified)
  }
}
