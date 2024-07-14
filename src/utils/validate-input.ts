import fs from 'fs'
import { Config } from '@/types/config'
import * as core from '@actions/core'
import { getFileFromBranch } from '@/utils/get-file-from-branch'

const DEFAULT_OPENAPI_FILE_PATH = 'openapi.json'
const MOCKUP_REPOSITORY = 'mockup_owner/mockup_repo'
const MOCKUP_SHA = 'mockup123_sha'
const MOCKUP_MESSAGE = 'mockup message for testing'

export function validateInputAndSetConfig(): Config {
  core.debug('Validating input...')

  process.env.OPENAPI_DIFF_NODE_ENV !== 'local'

  if (
    process.env.OPENAPI_DIFF_NODE_ENV !== undefined &&
    process.env.OPENAPI_DIFF_NODE_ENV !== null &&
    process.env.OPENAPI_DIFF_NODE_ENV !== 'local'
  ) {
    throw new Error(
      `OPENAPI_DIFF_NODE_ENV can only be set to 'local' and nothing else`
    )
  }

  const env = process.env.OPENAPI_DIFF_NODE_ENV ?? 'github'

  const isLocal = env === 'local'

  const locale = isLocal ? process.env.LOCALE : core.getInput('locale')

  if (locale !== 'en-us' && locale !== 'ko-kr') {
    throw new Error('locale must be set to either en-us or ko-kr')
  }

  // slack input validation
  const isSlackEnabled = isLocal
    ? process.env.SLACK_ENABLED
    : core.getInput('slack_enabled')

  if (isSlackEnabled !== 'true' && isSlackEnabled !== 'false') {
    throw new Error('slack_enabled must be set to either true or false')
  }
  const slackChannelId = isLocal
    ? process.env.SLACK_CHANNEL_ID
    : core.getInput('slack_channel_id')

  const slackAccessToken = isLocal
    ? process.env.SLACK_ACCESS_TOKEN
    : core.getInput('slack_access_token')

  const memberIdListToMention = isLocal
    ? process.env.MEMBER_ID_LIST_TO_MENTION
    : core.getInput('member_id_list_to_mention')

  const apiDocumentationUrl = isLocal
    ? process.env.API_DOCUMENTATION_URL
    : core.getInput('api_documentation_url')

  if (memberIdListToMention !== undefined && memberIdListToMention !== '') {
    // check if memberIdListToMention is a string of comma separated strings
    const memberIdListToMentionArray = memberIdListToMention.split(',')
    const invalidMemberId = memberIdListToMentionArray.find(
      memberId => memberId.trim() === ''
    )

    if (invalidMemberId) {
      throw new Error(
        `member_id_list_to_mention contains an invalid memberId: ${invalidMemberId}`
      )
    }
  }

  // get openapi files
  let baseFile: object
  let headFile: object
  if (isLocal) {
    baseFile = JSON.parse(
      fs.readFileSync('./.local/examples/openapi-base.json').toString()
    )
    headFile = JSON.parse(
      fs.readFileSync('./.local/examples/openapi-head.json').toString()
    )
  } else {
    // github env

    const isOnPullRequest = process.env.GITHUB_EVENT_NAME === 'pull_request'

    // for on:push,  head of the branch which triggered this action // ex: refs/heads/branch-name
    // for on:pull_request, head of the PR, commonly feature branchs.
    const headCommittish = isOnPullRequest
      ? // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
        process.env.GITHUB_HEAD_REF!
      : // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
        process.env.GITHUB_REF!

    // for on:pull_request, base branch of the PR, commonly master/main/develop branch
    // for on:push go one commit back to get the base branch on the target branch
    const baseCommittish = isOnPullRequest
      ? // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
        process.env.GITHUB_BASE_REF!
      : `${headCommittish}~1`

    const openapiFilePath =
      core.getInput('openapi_file_path') ?? DEFAULT_OPENAPI_FILE_PATH

    baseFile = JSON.parse(
      getFileFromBranch(baseCommittish, openapiFilePath).toString()
    )
    headFile = JSON.parse(
      getFileFromBranch(headCommittish, openapiFilePath).toString()
    )
  }

  const githubConfig: Config['githubConfig'] = {
    repository: process.env.GITHUB_REPOSITORY ?? MOCKUP_REPOSITORY,
    headCommitInfo: {
      sha: process.env.GITHUB_SHA ?? MOCKUP_SHA,
      message:
        core.getInput('head_commit_message') === ''
          ? MOCKUP_MESSAGE
          : core.getInput('head_commit_message')
    },
    baseFile,
    headFile
  }

  let slackConfig: Config['slackConfig']

  if (isSlackEnabled === 'true') {
    if (
      slackAccessToken !== '' &&
      slackAccessToken !== undefined &&
      slackChannelId !== '' &&
      slackChannelId !== undefined
    ) {
      slackConfig = {
        enabled: true,
        token: slackAccessToken,
        channelId: slackChannelId,
        memberIdListToMention: memberIdListToMention?.split(',') ?? []
      }
    } else {
      throw new Error(
        'slack_enabled is set to true, but slack_access_token and slack_channel_id are not set'
      )
    }
  } else {
    slackConfig = {
      enabled: false
    }
  }

  return {
    env,
    locale,
    initialDelayInMilliseconds: 500,
    slackConfig,
    githubConfig,
    apiDocumentationUrl
  }
}
