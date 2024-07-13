/* eslint-disable github/array-foreach */
import { generateMarkdownTable } from '@/utils/markdown/generate-markdown-table'
import { DiffOutputItem } from 'openapi-diff-node'

export function formatDiffFromExternalLibrary(
  diff: readonly DiffOutputItem[]
): string {
  const apiList: string[] = []
  const diffCopy = [...diff]

  // sort diff based on status and in the order of ['ADDED', 'MODIFIED', 'REMOVED']
  diffCopy.sort((a, b) => {
    const order = ['ADDED', 'MODIFIED', 'REMOVED']
    return order.indexOf(a.status) - order.indexOf(b.status)
  })

  diffCopy.forEach(item => {
    const { status, path, method, queryParams, requestBody, responseBody } =
      item

    const title = `# ${status} ${method.toUpperCase()} ${path}`

    const queryParamsTitle = '## Query Parameters'
    const queryParamsTable = generateMarkdownTable(queryParams)

    const requestBodyTable = generateMarkdownTable(requestBody)
    const requestBodyTitle = '## Request Body'

    const responseBodyTable = generateMarkdownTable(responseBody)
    const responseBodyTitle = '## Response Body'

    apiList.push(
      `
${title}

${queryParams.length ? queryParamsTitle : ''}

${queryParams.length ? queryParamsTable : ''}

${requestBody.length ? requestBodyTitle : ''}

${requestBody.length ? requestBodyTable : ''}

${responseBody.length ? responseBodyTitle : ''}

${responseBody.length ? responseBodyTable : ''}
      `
    )
  })

  return apiList.join('\n')
}
