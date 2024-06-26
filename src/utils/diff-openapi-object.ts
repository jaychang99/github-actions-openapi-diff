/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenapiTypes } from '../types/openapi-types'

export type DiffOpenapiObject = (
  startOpenapiObj: OpenapiTypes,
  targetOpenapiObj: OpenapiTypes
) => OpenapiTypes

export const diffOpenapiObject: DiffOpenapiObject = (
  startOpenapiObj,
  targetOpenapiObj
) => {
  // diff two objects and return the diff
  // diff not only keys but values, too.
  // if the value is an object, diff it recursively
  // if value is same don't return
  // return startOpenapiObj;

  const diff = (startObj: any, targetObj: any): OpenapiTypes => {
    const keys = new Set([...Object.keys(startObj), ...Object.keys(targetObj)])
    const diffObj: any = {}
    for (const key of keys) {
      if (
        startObj[key] &&
        targetObj[key] &&
        typeof startObj[key] === 'object' &&
        typeof targetObj[key] === 'object'
      ) {
        const diffResult = diff(startObj[key], targetObj[key])
        if (Object.keys(diffResult).length > 0) {
          diffObj[key] = diffResult
        }
      } else if (startObj[key] !== targetObj[key]) {
        diffObj[key] = targetObj[key]
      }
    }
    // keys.forEach(key => {
    //   if (
    //     startObj[key] &&
    //     targetObj[key] &&
    //     typeof startObj[key] === 'object' &&
    //     typeof targetObj[key] === 'object'
    //   ) {
    //     const diffResult = diff(startObj[key], targetObj[key])
    //     if (Object.keys(diffResult).length > 0) {
    //       diffObj[key] = diffResult
    //     }
    //   } else if (startObj[key] !== targetObj[key]) {
    //     diffObj[key] = targetObj[key]
    //   }
    // })
    return diffObj
  }

  return diff(startOpenapiObj, targetOpenapiObj)
}
