import * as core from '@actions/core'
import { wait } from './wait'
import { stdout } from 'process'
import { getFileFromBranch } from './utils/get-file-from-branch'
import { diffOpenapiObject } from './utils/diff-openapi-object'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())

    // print to stdout

    stdout.write('This is a single-line string\n')

    // const result = `
    // This is a multi-line string

    // # API Differences

    // ## ADDED
    // ---

    // ## MODIFIED
    // ---

    // ## DELETED
    // ---
    // `

    // parse two openapi files
    const baseBranch = process.env.GITHUB_BASE_REF!
    const headBranch = process.env.GITHUB_HEAD_REF!
    const filePath = './openapi.json'

    const baseFile = JSON.parse(
      getFileFromBranch(baseBranch, filePath).toString()
    )
    const headFile = JSON.parse(
      getFileFromBranch(headBranch, filePath).toString()
    )

    console.log('baseFile', baseFile)
    console.log('headFile', headFile)

    const diff = diffOpenapiObject(baseFile, headFile)

    console.log('diff', diff)
    const result = JSON.stringify(diff, null, 2)

    console.log(result)

    core.setOutput('result', result)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
