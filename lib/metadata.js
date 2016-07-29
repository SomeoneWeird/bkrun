import fs from 'fs'
import os from 'os'
import path from 'path'

const tmpDir = path.join(os.tmpdir(), 'bkrun')

export function getMetadata (uuid, key) {
  try {
    let file = require(path.join(tmpDir, `${uuid}.json`))
    if (typeof file[key] !== 'undefined') {
      return file[key]
    } else {
      throw new Error() // missing
    }
  } catch (e) {
    throw e
  }
}

export function setMetadata (uuid, key, value) {
  let filePath = path.join(tmpDir, `${uuid}.json`)
  try {
    fs.accessSync(tmpDir)
  } catch (e) {
    fs.mkdirSync(tmpDir)
  }
  let file
  try {
    file = require(filePath)
  } catch (e) {
    file = {}
  }
  file[key] = value
  fs.writeFileSync(filePath, JSON.stringify(file))
}
