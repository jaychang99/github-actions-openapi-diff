import { OpenAPIV3 } from 'openapi-types'

type DiffModifiedData = (
  baseApiData: OpenAPIV3.OperationObject,
  targetApiData: OpenAPIV3.OperationObject
) => OpenAPIV3.OperationObject

export const diffModifiedData: DiffModifiedData = (
  baseApiData,
  targetApiData
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diff = (baseData: any, targetData: any): OpenAPIV3.OperationObject => {
    const keys = new Set([...Object.keys(baseData), ...Object.keys(targetData)])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diffObj: any = {}
    for (const key of keys) {
      if (
        baseData[key] &&
        targetData[key] &&
        typeof baseData[key] === 'object' &&
        typeof targetData[key] === 'object'
      ) {
        const diffResult = diff(baseData[key], targetData[key])
        if (Object.keys(diffResult).length > 0) {
          diffObj[key] = diffResult
        }
      } else if (baseData[key] !== targetData[key]) {
        diffObj[key] = targetData[key]
      }
    }
    return diffObj
  }

  return diff(baseApiData, targetApiData)
}
