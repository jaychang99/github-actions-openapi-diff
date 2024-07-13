import { Config } from '@/types/config'

export interface GithubInput {
  /**
   * The environment in which the action is running
   * @default 'github'
   */
  initialDelayInMilliseconds?: Config['initialDelayInMilliseconds']

  /**
   * If posting to slack via webhook, provide the webhook url
   */
  slackWebhookUrl?: string

  /**
   * If posting to slack via token, provide the token and channel id
   */
  slackToken?: string
  slackChannelId?: string
}
