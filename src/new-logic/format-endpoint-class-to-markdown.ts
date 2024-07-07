import { ApiEndpoint } from '@/new-logic/api-endpoint/api-endpoint'
import {
  DEFAULT_MESSAGES,
  PARAMETERS_TABLE_HEADERS,
  REQUEST_BODY_TABLE_HEADERS
} from '@/new-logic/constants/markdown-messages'
import { formatRequestBodyResponseInClassInMarkdown } from '@/new-logic/format-request-body-response-in-class-in-markdown'
import { MarkdownGenerator } from '@/new-logic/markdown/markdown-generator'

type FormatEndpointClassToMarkdown = (endpoint: ApiEndpoint) => string

export const formatEndpointClassToMarkdown: FormatEndpointClassToMarkdown =
  endpoint => {
    const md = new MarkdownGenerator()
    const { method, url, description, parameters, requestBody, response } =
      endpoint.getApiEndpoint()

    md.addHorizontalRule()
    md.addH1(`${method.toUpperCase()}: ${url}`)

    md.addBulletPoint(
      `Description: ${description ?? DEFAULT_MESSAGES.UNDEFINED_DESCRIPTION}`
    )

    /**
     * format parameters
     */
    if (parameters.length > 0) {
      md.addH2('Parameters')
      md.addTableHeader(PARAMETERS_TABLE_HEADERS)
      md.setCurrentTableHeader(PARAMETERS_TABLE_HEADERS)

      for (const parameter of parameters) {
        const {
          name,
          in: location,
          description: parameterDescription,
          required,
          deprecated,
          example
        } = parameter

        md.addTableRow({
          name: name ?? '',
          in: location ?? '',
          description: parameterDescription ?? '',
          required:
            typeof required === 'boolean'
              ? required.toString()
              : required?.join(', '),
          deprecated,
          example
        })
      }
    }

    /**
     * format requestBody
     */
    if (requestBody.length > 0) {
      md.addH2('Request Body')
      const requestBodyMd = formatRequestBodyResponseInClassInMarkdown({
        content: requestBody,
        tableHeaders: REQUEST_BODY_TABLE_HEADERS
      })
      md.addString(requestBodyMd)
    }

    /**
     * format response
     */
    if (response.length > 0) {
      md.addH2('Response')
      const responseMd = formatRequestBodyResponseInClassInMarkdown({
        content: response,
        tableHeaders: REQUEST_BODY_TABLE_HEADERS
      })
      md.addString(responseMd)
    }

    return md.getMarkdown()
  }
