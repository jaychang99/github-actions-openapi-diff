import { Config } from '@/types/config'

export interface GithubInput {
  /**
   * The environment in which the action is running
   * @default 'github'
   */
  initialDelayInMilliseconds?: Config['initialDelayInMilliseconds']

  /**
   * The locale to use for the action
   * @default 'en-us'
   */
  locale?: string

  /**
   * If posting to slack via webhook, provide the webhook url
   */
  slackWebhookUrl?: string

  /**
   * If posting to slack via token, provide the token and channel id
   */
  slackToken?: string
  slackChannelId?: string

  /**
   * If mentioning specific slack members, provide their ids
   */
  memberIdListToMention?: string

  /**
   * openapi file path
   */
  openapiFilePath?: string

  /**
   * The last commit message which triggered the action
   */
  headCommitMessage?: string

  /**
   * URL of the api documentation - Optional
   */
  apiDocumentationUrl?: string
}
