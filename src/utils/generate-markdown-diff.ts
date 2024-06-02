import { OpenAPIV3 } from 'openapi-types'
import { OpenapiTypes } from '../types/openapi-types'
import { formatSingleApiEndpointAsMarkdown } from './format-single-api-endpoint-as-markdown'
import { classifyAddedModifiedRemovedEndpoints } from '@/utils/classify-added-modified-removed-endpoints'

export type CustomPathDiffItem = {
  url: string
  method: OpenAPIV3.HttpMethods
  endpointDetailData: OpenAPIV3.OperationObject
  baseApiEndpoint?: OpenAPIV3.OperationObject // only used for modified endpoints
}
export type GenerateMarkdownDiff = (
  startOpenapiObj: OpenapiTypes,
  targetOpenapiObj: OpenapiTypes
) => string

export const generateMarkdownDiff: GenerateMarkdownDiff = (
  startOpenapiObj,
  targetOpenapiObj
) => {
  const { addedEndpoints, modifiedEndpoints, removedEndpoints } =
    classifyAddedModifiedRemovedEndpoints({
      startOpenapiObj,
      targetOpenapiObj
    })

  const addedEndpointsMarkdown = addedEndpoints.map(endpoint => {
    return formatSingleApiEndpointAsMarkdown(endpoint)
  })

  const modifiedEndpointsMarkdown = modifiedEndpoints.map(endpoint => {
    return formatSingleApiEndpointAsMarkdown(endpoint, true)
  })

  const removedEndpointsMarkdown = removedEndpoints.map(endpoint => {
    return formatSingleApiEndpointAsMarkdown(endpoint)
  })

  return `
# 🆕✅ Added Endpoints 
---
${addedEndpointsMarkdown.join('\n')}

# 🔄⚠️ Modified Endpoints
---

${modifiedEndpointsMarkdown.join('\n')}

# 🗑❌ Removed Endpoints 
---
${removedEndpointsMarkdown.join('\n')}
`
}
