import * as core from '@actions/core'
import { wait } from './wait'
import { getFileFromBranch } from './utils/get-file-from-branch'
import fs from 'fs'
import * as http from 'http'
import markdownit from 'markdown-it'
import { resolveRefs } from './utils/resolve-refs'
import { transformOpenapiDocToClass } from '@/new-logic/transform-openapi-doc-to-class'
import { formatOpenApiDiffToMarkdown } from '@/new-logic/format-open-api-diff-to-markdown'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const isLocal = process.env.OPENAPI_DIFF_NODE_ENV === 'local'
    const localEnvName = isLocal ? 'LOCAL' : 'GITHUB'

    console.log('----starting in', localEnvName, 'environment----')

    const ms: string = isLocal ? '500' : core.getInput('milliseconds')

    // TODO: delete the following after modifiying test codes.
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())

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

    // resolve all refs. openapi.json has references to other properties, so we need to resolve them
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const refResolvedBaseFile = resolveRefs(baseFile, baseFile)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const refResolvedHeadFile = resolveRefs(headFile, headFile)

    // const markdownDiff = generateMarkdownDiff(
    //   refResolvedBaseFile,
    //   refResolvedHeadFile
    // )
    const markdownDiff = 'Hello from OpenAPI Diff!'

    if (!isLocal) {
      // Set outputs for other workflow steps to use
      core.setOutput('result', markdownDiff)
    }

    if (isLocal) {
      // Define the port number
      const PORT = 5050
      const md = markdownit()
      // const openapiBaseFileInMd = formatOpenApiToMarkdown(headFile)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const endpointList = transformOpenapiDocToClass(headFile)

      const markdown = formatOpenApiDiffToMarkdown({
        baseOpenapiJson: baseFile,
        headOpenapiJson: headFile
      })

      const mdRenderedResult = md.render(markdown)
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
