import { CustomPathDiffItem } from './generate-markdown-diff'
import { responseFormatter } from '@/utils/single-api-endpoint-formatter.ts/response-formatter'
import { requestParametersFormatter } from '@/utils/single-api-endpoint-formatter.ts/request-parameters-formatter'
import { requestBodyFormatter } from '@/utils/single-api-endpoint-formatter.ts/request-body-formatter'

type FormatSingleApiEndpointAsMarkdown = (
  endpoint: CustomPathDiffItem,
  shouldCheckForChanges?: boolean
) => string

const symbolByMethod: Record<CustomPathDiffItem['method'], string> = {
  get: '🟦',
  post: '🟩',
  put: '🟧',
  delete: '🟥',
  patch: '♻️',
  options: '⚙️',
  head: '🔍',
  trace: '🔍'
}

export const formatSingleApiEndpointAsMarkdown: FormatSingleApiEndpointAsMarkdown =
  (endpoint, shouldCheckForChanges = false) => {
    const { url, method, endpointDetailData, baseApiEndpoint } = endpoint
    const { responses } = endpointDetailData

    const parametersMarkdownTable = requestParametersFormatter({
      endpointDetailData,
      baseApiEndpoint,
      shouldCheckForChanges
    })
    const requestBodyMarkdown = requestBodyFormatter({
      endpointDetailData
    })
    const responseMarkdown = responseFormatter(
      responses,
      baseApiEndpoint?.responses
    )

    const generatedMarkdown = `
---
## ${symbolByMethod[method]} ${method.toUpperCase()}: ${url}

- Summary: ${endpointDetailData.summary ?? 'Not Provided'}
- Description: ${endpointDetailData.description ?? 'Not Provided'}

${parametersMarkdownTable}

${requestBodyMarkdown}

${
  responseMarkdown !== ''
    ? `
### Response Parameters

${responseMarkdown}
`
    : ''
}
  
`

    // console.log(generatedMarkdown)

    return generatedMarkdown
  }
