import { OpenAPIV3 } from 'openapi-types'
import { OpenapiTypes } from '../types/openapi-types'
import { formatSingleApiEndpointAsMarkdown } from './format-single-api-endpoint-as-markdown'

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
  const start = startOpenapiObj
  const target = targetOpenapiObj

  // console.log(Object.entries(target.paths))

  const addedEndpoints: CustomPathDiffItem[] = []
  const removedEndpoints: CustomPathDiffItem[] = []
  const modifiedEndpoints: CustomPathDiffItem[] = []

  compareTwoOpenApiPaths(start, target, addedEndpoints)
  compareTwoOpenApiPaths(target, start, removedEndpoints)
  compareTwoOpenApiPaths(start, target, modifiedEndpoints, true)

  // console.log(addedEndpoints)
  // console.log(removedEndpoints)

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

const compareTwoOpenApiPaths = (
  from: OpenapiTypes,
  to: OpenapiTypes,
  resultArray: CustomPathDiffItem[],
  shouldCheckForChanges = false
): void => {
  const checkNeededMethods = [
    'get',
    'post',
    'put',
    'delete',
    'patch'
  ] as OpenAPIV3.HttpMethods[]

  for (const pathAndInfoArr of Object.entries(to.paths)) {
    const path = pathAndInfoArr[0]
    const pathItemObjWithAllMethods = pathAndInfoArr[1]

    for (const method of checkNeededMethods) {
      const item = pathItemObjWithAllMethods?.[method]
      if (item) {
        const doesEndpointExistInStart = from.paths[path]
        if (!doesEndpointExistInStart && !shouldCheckForChanges) {
          resultArray.push({
            url: path,
            method,
            endpointDetailData: item
          })
        } else {
          if (shouldCheckForChanges) {
            // method + url exists in both start and target
            // check for any changes
            const startItem = doesEndpointExistInStart?.[method]
            if (startItem) {
              if (JSON.stringify(startItem) !== JSON.stringify(item)) {
                console.log('startItem', startItem)
                resultArray.push({
                  url: path,
                  method,
                  endpointDetailData: item,
                  baseApiEndpoint: startItem
                })
              }
            }
          }
        }
      }
    }
  }
}
