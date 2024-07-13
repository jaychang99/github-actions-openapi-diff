export interface Config {
  locale: 'en-us' | 'ko-kr'
  env: 'local' | 'github'
  initialDelayInMilliseconds: number
  slackConfig: SlackDisabledOptions | SlackEnabledOptions
}

interface SlackDisabledOptions {
  enabled: false
}

interface SlackEnabledOptions {
  enabled: true
  token: string
  channelId: string
  memberIdListToMention: string[]
}
