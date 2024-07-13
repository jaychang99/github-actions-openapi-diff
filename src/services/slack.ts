import { DiffOutputItem } from 'openapi-diff-node'
import {
  RichTextBlock,
  RichTextList,
  RichTextQuote,
  RichTextSection,
  WebClient
} from '@slack/web-api'
import { translate } from '@/locale/translate'
import { Locale } from '@/types/locale'

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

type ChangeType = 'parameters' | 'requestBody' | 'responseBody'

const STATUS_TO_LOCALE_KEY: Record<
  DiffOutputItem['status'],
  Partial<keyof Locale>
> = {
  ADDED: 'status.added',
  REMOVED: 'status.removed',
  MODIFIED: 'status.modified',
  UNCHANGED: 'status.unchanged'
}

const TYPE_TO_LOCALE_KEY: Record<ChangeType, Partial<keyof Locale>> = {
  parameters: 'changed.parameters',
  requestBody: 'changed.requestBody',
  responseBody: 'changed.responseBody'
}

export class Slack {
  // eslint-disable-next-line prettier/prettier
  constructor(
    private token: string,
    private channelId: string,
    private memberIdListToMention: string[]
  ) {
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

    const mainText = `:bell: ${endpoint} ${translate(
      STATUS_TO_LOCALE_KEY[diff.status]
    )} :bell:`

    const res = await this.client.chat.postMessage({
      channel: this.channelId,
      text: mainText,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: mainText
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            // TODO: come up with a better way to tackle empty memberIdListToMention
            text: this.memberIdListToMention.length
              ? this.memberIdListToMention.map(id => `<@${id}>`).join(' ')
              : ' ' // because slack doesn't allow empty text
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*${translate('endpoint.singular')}:*\n ${endpoint}`
            },
            {
              type: 'mrkdwn',
              text: `*${translate('changed.parameters')} ${translate(
                'count'
              )}:*\n ${changedParameters.length}`
            },
            {
              type: 'mrkdwn',
              text: `*${translate('changed.requestBody')} ${translate(
                'count'
              )}:*\n ${changedRequestBody.length}`
            },
            {
              type: 'mrkdwn',
              text: `*${translate('changed.responseBody')} ${translate(
                'count'
              )}:*\n ${changedResponseBody.length}`
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
              text: translate('see_thread_for_details')
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
    type: ChangeType,
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
            text: `[${translate(STATUS_TO_LOCALE_KEY[param.status])}] - `
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

    const mainText = translate(TYPE_TO_LOCALE_KEY[type])

    await this.client.chat.postMessage({
      channel: this.channelId,
      thread_ts,
      text: mainText,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `:warning: ${mainText} :warning:`
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
