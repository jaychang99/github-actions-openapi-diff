import { bold } from '@/formatters/bold'
import { table } from '@/formatters/table'
import { OpenAPIV3 } from 'openapi-types'

type RequestParametersFormatter = (args: {
  endpointDetailData: OpenAPIV3.OperationObject
  baseApiEndpoint?: OpenAPIV3.OperationObject // only used for modified endpoints
  shouldCheckForChanges?: boolean // only true for modified endpoints
}) => string

const PARAMETER_TABLE_HEADERS = [
  'Name',
  'Required',
  'In',
  'Description',
  'Example'
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isReferenceObject = (obj: any): obj is { $ref: string } => {
  return obj.$ref !== undefined
}
export const requestParametersFormatter: RequestParametersFormatter = ({
  endpointDetailData,
  baseApiEndpoint,
  shouldCheckForChanges = false
}) => {
  const parameterTableRows: string[][] = Object.entries(
    endpointDetailData.parameters ?? {}
  ).map(([key, value]) => {
    if (isReferenceObject(value)) {
      return [key, '-', '-', '-', '-']
    }

    if (shouldCheckForChanges && baseApiEndpoint) {
      const isAdded = Object.keys(baseApiEndpoint.parameters ?? {}).includes(
        key
      )
      const isRemoved = !Object.keys(
        endpointDetailData.parameters ?? {}
      ).includes(key)
      const shouldEmphasize = isAdded || isRemoved

      if (shouldEmphasize) {
        return [
          bold(value.name),
          bold(value.required),
          bold(value.in),
          bold(value.description),
          bold(value.example)
        ]
      }

      return [
        value.name,
        value.required,
        value.in,
        value.description,
        value.example
      ]
    }

    return [
      value.name,
      value.required,
      value.in,
      value.description,
      value.example
    ]
  })
  const parametersMarkdownTable = table({
    headers: PARAMETER_TABLE_HEADERS,
    rows: parameterTableRows
  })
  const doesHaveParameters = parameterTableRows.length > 0

  return doesHaveParameters ? parametersMarkdownTable : ''
}
