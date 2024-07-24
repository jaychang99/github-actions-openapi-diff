import { DiffOutputItem } from 'openapi-diff-node'
import {
  RichTextBlock,
  RichTextElement,
  RichTextList,
  RichTextQuote,
  RichTextSection,
  WebClient
} from '@slack/web-api'
import { translate } from '@/locale/translate'
import { Locale } from '@/types/locale'
import { Config } from '@/types/config'

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

const STATUS_TO_LOCALE_KEY: Record<DiffOutputItem['status'], StatusConfig> = {
  ADDED: {
    color: '#58a459',
    emojiCode: 'white_check_mark',
    localeKey: 'status.added'
  },
  REMOVED: {
    color: '#bb3638',
    emojiCode: 'no_entry_sign',
    localeKey: 'status.removed'
  },
  MODIFIED: {
    color: '#f1c232',
    emojiCode: 'warning',
    localeKey: 'status.modified'
  },
  UNCHANGED: { color: '#e8e7e4', emojiCode: '', localeKey: 'status.unchanged' }
}

interface StatusConfig {
  emojiCode: string
  color: string
  localeKey: keyof Locale
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
    private memberIdListToMention: string[],
    private githubConfig: Config['githubConfig'],
    private apiDocumentationUrl?: string
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
    const description = diff.description

    const changedParameters = this._getUnchangedItems(diff.queryParams)
    const changedRequestBody = this._getUnchangedItems(diff.requestBody)
    const changedResponseBody = this._getUnchangedItems(diff.responseBody)

    const mainText = `:bell: ${endpoint} ${translate(
      STATUS_TO_LOCALE_KEY[diff.status].localeKey
    )} `
    const color = STATUS_TO_LOCALE_KEY[diff.status].color

    const additionalInfoList: RichTextElement[] = [
      {
        type: 'text',
        text: this.githubConfig.headCommitInfo.sha.slice(0, 7),
        style: {
          code: true
        }
      },
      {
        type: 'text',
        text: ` - `
      },
      {
        type: 'link',
        url: `https://github.com/${this.githubConfig.repository}/commit/${this.githubConfig.headCommitInfo.sha}`,
        text: this.githubConfig.headCommitInfo.message
      }
    ]

    if (this.apiDocumentationUrl) {
      additionalInfoList.push({
        type: 'text',
        text: `   |   `
      })
      additionalInfoList.push({
        type: 'link',
        url: this.apiDocumentationUrl,
        text: `${translate('button.goto-api-documentation')}`
      })
    }

    const res = await this.client.chat.postMessage({
      channel: this.channelId,
      text: `${mainText} at ${this.githubConfig.repository}`,
      attachments: [
        {
          color,
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
                  text: `*${translate('description')}:*\n ${description}`
                },
                {
                  type: 'mrkdwn',
                  text: `*${translate('repository')}: *\n<https://github.com/${
                    this.githubConfig.repository
                  }|${this.githubConfig.repository}>`
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
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: additionalInfoList
                }
              ]
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
      const emojiCode = STATUS_TO_LOCALE_KEY[param.status].emojiCode
      const statusLocaleKey = STATUS_TO_LOCALE_KEY[param.status].localeKey

      const statusAndEndpoint: RichTextQuote = {
        type: 'rich_text_quote',
        elements: [
          {
            type: 'emoji',
            name: emojiCode
          },
          {
            type: 'text',
            text: ` [${translate(statusLocaleKey)}] - `
          },
          {
            type: 'text',
            text: param.name,
            style: {
              code: true
            }
          },
          {
            type: 'text',
            text: ` : ${param.type}`
          }
        ]
      }

      let required = ''
      if (param.required === true) {
        required = translate('required.required')
      } else if (param.required === false) {
        required = translate('required.optional')
      } else {
        required = param.required
      }

      const descriptionElements: RichTextList['elements'] = []

      if (param.description) {
        descriptionElements.push({
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: `${translate('description')}: ${param.description}`
            }
          ]
        })
      }

      if (required !== 'N/A') {
        descriptionElements.push({
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: `${translate('required')}: ${required}`
            }
          ]
        })
      }

      if (param.example !== 'N/A') {
        descriptionElements.push({
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: `${translate('example')}: ${param.example}`
            }
          ]
        })
      }

      if (param.enum.length > 0) {
        const enumElementList: RichTextElement[] = []

        for (const e of param.enum) {
          const isFirstIteration = enumElementList.length === 0

          enumElementList.push({
            type: 'text',
            text: isFirstIteration ? 'ENUM: ' : ', '
          })
          enumElementList.push({
            type: 'text',
            text: e,
            style: {
              code: true
            }
          })
        }

        descriptionElements.push({
          type: 'rich_text_section',
          elements: enumElementList
        })
      }

      const changeLogElementList: RichTextList[] = []

      if (param.changeLogs.length > 0) {
        changeLogElementList.push({
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
                  text: translate('properties.changed')
                }
              ]
            }
          ]
        })

        for (const changeLog of param.changeLogs) {
          const { field, oldValue, newValue } = changeLog

          changeLogElementList.push({
            type: 'rich_text_list',
            style: 'bullet',
            indent: 1,
            border: 1,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: field
                  }
                ]
              }
            ]
          })

          let oldValueText = oldValue
          let newValueText = newValue

          if (Array.isArray(oldValue)) {
            if (oldValue.length > 0) {
              oldValueText = oldValue.join(', ')
            } else {
              oldValueText = `(${translate('empty.array')})`
            }
          }

          if (Array.isArray(newValue)) {
            if (newValue.length > 0) {
              newValueText = newValue.join(', ')
            } else {
              newValueText = `(${translate('empty.array')})`
            }
          }

          changeLogElementList.push({
            type: 'rich_text_list',
            style: 'bullet',
            indent: 2,
            border: 1,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: `${translate('changed.before')}: \n${oldValueText}`
                  }
                ]
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: `${translate('changed.after')}: \n${newValueText}`
                  }
                ]
              }
            ]
          })
        }
      }

      const description: RichTextList = {
        type: 'rich_text_list',
        style: 'bullet',
        indent: 0,
        border: 1,
        elements: descriptionElements
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

      if (changeLogElementList.length > 0) {
        elements.push(...changeLogElementList)
      }

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
            text: `${mainText}`
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
