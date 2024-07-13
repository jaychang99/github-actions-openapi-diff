import { Config } from '@/types/config'
import * as core from '@actions/core'

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

  if (isSlackEnabled === 'true') {
    if (
      slackAccessToken !== '' &&
      slackAccessToken !== undefined &&
      slackChannelId !== '' &&
      slackChannelId !== undefined
    ) {
      return {
        env,
        locale,
        initialDelayInMilliseconds: 500,
        slackConfig: {
          enabled: true,
          token: slackAccessToken,
          channelId: slackChannelId,
          memberIdListToMention: memberIdListToMention?.split(',') ?? []
        }
      }
    }

    throw new Error(
      'slack_enabled is set to true, but slack_access_token and slack_channel_id are not set'
    )
  } else {
    return {
      env,
      locale,
      initialDelayInMilliseconds: 500,
      slackConfig: {
        enabled: false
      }
    }
  }
}
