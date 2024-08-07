export interface Config {
  locale: 'en-us' | 'ko-kr'
  env: 'local' | 'github'
  initialDelayInMilliseconds: number
  slackConfig: SlackDisabledOptions | SlackEnabledOptions
  githubConfig: GithubOptions
  apiDocumentationUrl?: string
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

interface GithubOptions {
  repository: string // /{owner}/{repo}
  baseFile: object
  headFile: object
  headCommitInfo: {
    sha: string
    message: string
  }
}
