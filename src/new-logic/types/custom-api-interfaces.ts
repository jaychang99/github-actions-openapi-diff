/* eslint-disable @typescript-eslint/no-empty-interface */

import { OpenAPIV3 } from 'openapi-types'

type MetaProperties = 'added' | 'removed' | 'modified' | 'changedFields'

export interface CustomApiEndpoint {
  method: CustomMethod
  url: string
  description: string
  parameters: CustomParameterRecordItem[]
  requestBody: CustomRequestBodyRecordItem[]
  response: CustomResponseRecordItem[]
  added?: boolean
  removed?: boolean
  modified?: boolean
}

export type CustomMethod = OpenAPIV3.HttpMethods

export interface CustomParameterRecordItem {
  name?: string
  in?: string
  description?: string
  required?: string[] | boolean
  example?: string
  deprecated?: boolean
  added?: boolean
  removed?: boolean
  modified?: boolean
  changedFields?: (keyof Exclude<CustomParameterRecordItem, MetaProperties>)[]
}

export interface CustomRequestBodyRecordItem
  extends CustomRequestBodyOrResponseItem {}

export interface CustomResponseRecordItem
  extends CustomRequestBodyOrResponseItem {}

interface CustomRequestBodyOrResponseItem {
  title?: string
  type?: string
  description?: string
  default?: string
  enum?: string[]
  required?: string[] | boolean
  example?: string
  deprecated?: boolean
  added?: boolean
  removed?: boolean
  modified?: boolean
  changedFields?: (keyof Exclude<
    CustomRequestBodyOrResponseItem,
    MetaProperties
  >)[]
  schema?: OpenAPIV3.MediaTypeObject['schema']
}
