import * as core from '@actions/core'
import { wait } from './wait'
import { stdout } from 'process'
import { getFileFromBranch } from './utils/get-file-from-branch'
import fs from 'fs'
import * as http from 'http'
import { generateMarkdownDiff } from './utils/generate-markdown-diff'
import markdownit from 'markdown-it'
import { resolveRefs } from './utils/resolve-refs'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const isLocal = process.env.OPENAPI_DIFF_NODE_ENV === 'local'
    console.log(
      '----starting in',
      isLocal ? 'LOCAL' : 'GITHUB',
      'environment----'
    )

    const ms: string = isLocal ? '500' : core.getInput('milliseconds')

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

    // console.log('baseFile', baseFile)
    // console.log('headFile', headFile)

    const refResolvedBaseFile = resolveRefs(baseFile, baseFile)
    const refResolvedHeadFile = resolveRefs(headFile, headFile)

    // const diff = diffOpenapiObject(refResolvedBaseFile, refResolvedHeadFile)
    const markdownDiff = generateMarkdownDiff(
      refResolvedBaseFile,
      refResolvedHeadFile
    )

    // console.log('diff', diff)
    // const result = JSON.stringify(diff, null, 2)

    // console.log(result)

    if (!isLocal) {
      core.setOutput('result', markdownDiff)
    }

    if (isLocal) {
      // Define the port number
      const PORT = 5050
      const md = markdownit()
      const mdRenderedResult = md.render(markdownDiff)
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
