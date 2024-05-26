// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveRefs(obj: any, root: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => resolveRefs(item, root))
  } else if (obj !== null && typeof obj === 'object') {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty('$ref')) {
      const refPath = obj['$ref'].replace('#/', '').split('/')
      let refObj = root
      for (const part of refPath) {
        refObj = refObj[part]
        if (!refObj) {
          throw new Error(`Reference not found: ${obj['$ref']}`)
        }
      }
      return resolveRefs(refObj, root) // Resolve recursive $ref in the referenced object
    }
    for (const key in obj) {
      obj[key] = resolveRefs(obj[key], root)
    }
  }
  return obj
}
