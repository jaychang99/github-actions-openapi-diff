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

  // slack input validation
  const isSlackEnabled = isLocal
    ? process.env.SLACK_ENABLED
    : core.getInput('slack_enabled')

  const slackChannelId = isLocal
    ? process.env.SLACK_CHANNEL_ID
    : core.getInput('slack_channel_id')

  const slackAccessToken = isLocal
    ? process.env.SLACK_ACCESS_TOKEN
    : core.getInput('slack_access_token')

  if (isSlackEnabled !== 'true' && isSlackEnabled !== 'false') {
    throw new Error('slack_enabled must be set to either true or false')
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
        initialDelayInMilliseconds: 500,
        slackConfig: {
          enabled: true,
          token: slackAccessToken,
          channelId: slackChannelId
        }
      }
    }

    throw new Error(
      'slack_enabled is set to true, but slack_access_token and slack_channel_id are not set'
    )
  } else {
    return {
      env,
      initialDelayInMilliseconds: 500,
      slackConfig: {
        enabled: false
      }
    }
  }
}
