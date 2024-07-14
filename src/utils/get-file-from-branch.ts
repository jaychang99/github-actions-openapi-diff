import { execSync } from 'child_process'
import { readFileSync } from 'fs'

export function getFileFromBranch(
  branch: string,
  filePath: string,
  offsetFromHead?: number
): Buffer {
  const offset = offsetFromHead ? `~${offsetFromHead}` : ''

  execSync(`git fetch origin ${branch}`)
  execSync(`git checkout ${branch} -- ${filePath}`)
  execSync(`git checkout HEAD${offset} -- ${filePath}`)
  return readFileSync(filePath)
}
