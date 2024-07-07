import { formatEndpointClassToMarkdown } from '@/new-logic/format-endpoint-class-to-markdown'
import { transformOpenapiDocToClass } from '@/new-logic/transform-openapi-doc-to-class'
import { OpenAPIV3 } from 'openapi-types'
type FormatOpenApiDiffToMarkdown = (arg: {
  baseOpenapiJson: OpenAPIV3.Document
  headOpenapiJson: OpenAPIV3.Document
}) => string

export const formatOpenApiDiffToMarkdown: FormatOpenApiDiffToMarkdown = ({
  baseOpenapiJson,
  headOpenapiJson
}) => {
  const baseOpenapiList = transformOpenapiDocToClass(baseOpenapiJson)
  const headOpenapiList = transformOpenapiDocToClass(headOpenapiJson)

  for (const headOpenapi of headOpenapiList) {
    const baseOpenapi =
      headOpenapi.findSameApiEndpointFromOtherList(baseOpenapiList)

    const hasExistedInPreviousVersion = !!baseOpenapi

    if (!hasExistedInPreviousVersion) {
      headOpenapi.markEndpointAsAdded()
      continue // added endpoints cannot have changed fields
    }

    headOpenapi.compareWithPreviousApiEndpointAndMarkChanges(baseOpenapi)
  }

  // check for removed endpoints
  for (const baseOpenapi of baseOpenapiList) {
    const doesEndpointexistInBothPreviousAndCurrent =
      baseOpenapi.findSameApiEndpointFromOtherList(headOpenapiList)

    if (!doesEndpointexistInBothPreviousAndCurrent) {
      baseOpenapi.markEndpointAsRemoved()
      continue // removed endpoints cannot have changed fields
    }
  }

  const addedEndpoints = headOpenapiList.filter(
    headOpenapi => headOpenapi.added
  )

  const modifiedEndpoints = headOpenapiList.filter(
    headOpenapi => headOpenapi.modified
  )

  const removedEndpoints = baseOpenapiList.filter(
    baseOpenapi => baseOpenapi.removed
  )

  const addedEndpointsMarkdown = addedEndpoints.map(endpoint =>
    formatEndpointClassToMarkdown(endpoint)
  )

  const modifiedEndpointsMarkdown = modifiedEndpoints.map(endpoint =>
    formatEndpointClassToMarkdown(endpoint)
  )

  const removedEndpointsMarkdown = removedEndpoints.map(endpoint =>
    formatEndpointClassToMarkdown(endpoint)
  )

  const markdown = `
## Added Endpoints
${addedEndpointsMarkdown.join('\n')}
## Modified Endpoints
${modifiedEndpointsMarkdown.join('\n')}
## Removed Endpoints
${removedEndpointsMarkdown.join('\n')}
`

  return markdown
}
