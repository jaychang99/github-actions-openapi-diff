import { VALID_HTTP_METHODS } from '@/constants/valid-http-methods'
import { OpenapiTypes } from '@/types/openapi-types'
import { CustomPathDiffItem } from '@/utils/generate-markdown-diff'
import { OpenAPIV3 } from 'openapi-types'

type ClassifyAddedModifiedRemovedEndpoints = (arg: {
  startOpenapiObj: OpenapiTypes
  targetOpenapiObj: OpenapiTypes
}) => {
  addedEndpoints: CustomPathDiffItem[]
  modifiedEndpoints: CustomPathDiffItem[]
  removedEndpoints: CustomPathDiffItem[]
}

export const classifyAddedModifiedRemovedEndpoints: ClassifyAddedModifiedRemovedEndpoints =
  ({ startOpenapiObj, targetOpenapiObj }) => {
    const startPaths = startOpenapiObj.paths
    const targetPaths = targetOpenapiObj.paths

    const addedEndpoints: CustomPathDiffItem[] = []
    const removedEndpoints: CustomPathDiffItem[] = []
    const modifiedEndpoints: CustomPathDiffItem[] = []

    // find added or modified endpoints
    for (const [path, value] of Object.entries(targetPaths)) {
      if (!value) continue // if path is empty, skip
      for (const [method, endpointDetailData] of Object.entries(value)) {
        // if it is not about HTTP method, skip
        if (!VALID_HTTP_METHODS.includes(method)) continue

        const startEndpointData =
          startPaths?.[path]?.[method as OpenAPIV3.HttpMethods]

        // if endpoint does not exist in start, it is added
        if (!startEndpointData) {
          addedEndpoints.push({
            url: path,
            method: method as OpenAPIV3.HttpMethods,
            endpointDetailData: endpointDetailData as OpenAPIV3.OperationObject
          })
          continue
        }

        // if endpoint exists in start, but the content is different, it is modified
        if (
          JSON.stringify(startEndpointData) !==
          JSON.stringify(endpointDetailData)
        ) {
          modifiedEndpoints.push({
            url: path,
            method: method as OpenAPIV3.HttpMethods,
            endpointDetailData: endpointDetailData as OpenAPIV3.OperationObject,
            baseApiEndpoint: startEndpointData
          })
        }
      }
    }

    // find removed endpoints
    for (const [path, value] of Object.entries(startPaths)) {
      if (!value) continue // if path is empty, skip
      for (const [method, endpointDetailData] of Object.entries(value)) {
        // if it is not about HTTP method, skip
        if (!VALID_HTTP_METHODS.includes(method)) continue

        const targetEndpointData =
          targetPaths?.[path]?.[method as OpenAPIV3.HttpMethods]

        // if endpoint does not exist in target, it is removed
        if (!targetEndpointData) {
          removedEndpoints.push({
            url: path,
            method: method as OpenAPIV3.HttpMethods,
            endpointDetailData: endpointDetailData as OpenAPIV3.OperationObject
          })
        }
      }
    }

    return { addedEndpoints, modifiedEndpoints, removedEndpoints }
  }
