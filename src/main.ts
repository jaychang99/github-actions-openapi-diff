import * as core from '@actions/core'
import { wait } from './wait'
import { getFileFromBranch } from './utils/get-file-from-branch'
import fs from 'fs'
import * as http from 'http'
import markdownit from 'markdown-it'
import { openapiDiff } from 'openapi-diff-node'
import { formatDiffFromExternalLibrary } from '@/utils/format-diff-from-external-library'
import { Slack } from '@/services/slack'
import { validateInputAndSetConfig } from '@/utils/validate-input'
import { Config } from '@/types/config'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */

// eslint-disable-next-line import/no-mutable-exports
export let locale: Config['locale'] = 'en-us'

export async function run(): Promise<void> {
  try {
    const config = validateInputAndSetConfig()

    locale = config.locale

    console.log(`starting in ${config.env} environment`)

    const isLocal = config.env === 'local'

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${config.initialDelayInMilliseconds} milliseconds ...`)

    await wait(config.initialDelayInMilliseconds)

    // parse two openapi files
    const baseBranch = process.env.GITHUB_BASE_REF!
    const headBranch = process.env.GITHUB_HEAD_REF!
    const filePath = 'openapi.json'

    const baseFile = isLocal
      ? JSON.parse(
          fs.readFileSync('./.local/examples/openapi-base.json').toString() // testing file in local env
        )
      : JSON.parse(getFileFromBranch(baseBranch, filePath).toString())

    const headFile = isLocal
      ? JSON.parse(
          fs.readFileSync('./.local/examples/openapi-head.json').toString() // testing file in local env
        )
      : JSON.parse(getFileFromBranch(headBranch, filePath).toString())

    const diffFromExternalLibrary = openapiDiff(baseFile, headFile)

    const formattedDiffFromExternalLibrary = formatDiffFromExternalLibrary(
      diffFromExternalLibrary
    )

    if (config.slackConfig.enabled) {
      const slack = new Slack(
        config.slackConfig.token,
        config.slackConfig.channelId,
        config.slackConfig.memberIdListToMention
      )
      // eslint-disable-next-line github/array-foreach
      diffFromExternalLibrary.forEach(diff => {
        slack.sendSingleApiDiff(diff)
      })
    }

    if (!isLocal) {
      // Set outputs for other workflow steps to use
      core.setOutput('result', formattedDiffFromExternalLibrary)
    }

    if (isLocal) {
      // Define the port number
      const PORT = 5050
      const md = markdownit()
      const mdRenderedResult = md.render(formattedDiffFromExternalLibrary)
      // Create a server
      const server: http.Server = http.createServer((req, res) => {
        // Set the response header
        const styleSheetCssFile = fs
          .readFileSync('./debug/markdown-stylesheet.css')
          .toString()

        const styleSheetTag = `<style>${styleSheetCssFile}</style>`

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })

        // send reponse with result
        res.end(styleSheetTag + mdRenderedResult)
      })

      // Start the server
      server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
      })
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
