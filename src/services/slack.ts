import { DiffOutputItem } from 'openapi-diff-node'
import {
  RichTextBlock,
  RichTextList,
  RichTextQuote,
  RichTextSection,
  WebClient
} from '@slack/web-api'

type DetailItem =
  | DiffOutputItem['queryParams']
  | DiffOutputItem['requestBody']
  | DiffOutputItem['responseBody']

interface SendEndpointReturnType {
  thread_ts?: string
  changedParameters: DetailItem
  changedRequestBody: DetailItem
  changedResponseBody: DetailItem
}

export class Slack {
  // eslint-disable-next-line prettier/prettier
  constructor(private token: string, private channelId: string) {
    this.client = new WebClient(token)
  }

  client: WebClient

  private _getUnchangedItems(item: DetailItem): DetailItem {
    return item.filter(param => param.status !== 'UNCHANGED')
  }

  private async _sendEndpoint(
    diff: DiffOutputItem
  ): Promise<SendEndpointReturnType> {
    const endpoint = `${diff.method.toUpperCase()}: ${diff.path}`

    const changedParameters = this._getUnchangedItems(diff.queryParams)
    const changedRequestBody = this._getUnchangedItems(diff.requestBody)
    const changedResponseBody = this._getUnchangedItems(diff.responseBody)

    const res = await this.client.chat.postMessage({
      channel: this.channelId,
      text: 'api changed',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `:bell: ENDPOINT ${diff.status} :bell:`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Endpoint:*\n ${endpoint}`
            },
            {
              type: 'mrkdwn',
              text: `*Parameters Changed:*\n ${changedParameters.length}`
            },
            {
              type: 'mrkdwn',
              text: `*Request Body Changed:*\n ${changedRequestBody.length}`
            },
            {
              type: 'mrkdwn',
              text: `*Response Body Changed:*\n ${changedResponseBody.length}`
            }
          ]
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          fields: [
            {
              type: 'plain_text',
              text: 'See thread for more details'
            }
          ]
        }
      ]
    })

    return {
      thread_ts: res.ts,
      changedParameters,
      changedRequestBody,
      changedResponseBody
    }
  }

  private async _sendDetailItem(
    type: 'parameters' | 'requestBody' | 'responseBody',
    item: DetailItem,
    thread_ts?: string
  ): Promise<void> {
    const elements: RichTextBlock['elements'] = []

    for (const param of item) {
      const statusAndEndpoint: RichTextQuote = {
        type: 'rich_text_quote',
        elements: [
          {
            type: 'text',
            text: `[${param.status}] - `
          },
          {
            type: 'text',
            text: param.name,
            style: {
              code: true
            }
          }
        ]
      }

      const description: RichTextList = {
        type: 'rich_text_list',
        style: 'bullet',
        indent: 0,
        border: 1,
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: param.description
              }
            ]
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: param.required ? 'Required' : 'Optional'
              }
            ]
          }
        ]
      }

      const newline: RichTextSection = {
        type: 'rich_text_section',
        elements: [
          {
            type: 'text',
            text: '\n'
          }
        ]
      }

      elements.push(statusAndEndpoint)
      elements.push(description)
      elements.push(newline)
    }

    await this.client.chat.postMessage({
      channel: this.channelId,
      thread_ts,
      text: `${type} Changed`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `:warning: ${type} Changed :warning:`
          }
        },
        {
          type: 'rich_text',
          elements
        }
      ]
    })
  }

  async sendSingleApiDiff(diff: DiffOutputItem): Promise<void> {
    try {
      const {
        thread_ts,
        changedParameters,
        changedRequestBody,
        changedResponseBody
      } = await this._sendEndpoint(diff)

      if (changedParameters.length > 0) {
        await this._sendDetailItem('parameters', changedParameters, thread_ts)
      }

      if (changedRequestBody.length > 0) {
        await this._sendDetailItem('requestBody', changedRequestBody, thread_ts)
      }

      if (changedResponseBody.length > 0) {
        await this._sendDetailItem(
          'responseBody',
          changedResponseBody,
          thread_ts
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }
}
