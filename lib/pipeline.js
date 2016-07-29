import fs from 'fs'
import os from 'os'
import path from 'path'

const tmpDir = path.join(os.tmpdir(), 'bkrun')

export function getPipeline (uuid) {
  const pipelineFile = path.join(tmpDir, `pipeline-${uuid}.json`)
  try {
    // Do not require() this as it's cached
    return JSON.parse(fs.readFileSync(pipelineFile).toString())
  } catch (e) {
    return
  }
}

export function deletePipeline (uuid) {
  try {
    fs.unlinkSync(path.join(tmpDir, `pipeline-${uuid}.json`))
  } catch (e) {
    console.log(e)
  }
}

export function writePipeline (uuid, pipeline) {
  const pipelineFile = path.join(tmpDir, `pipeline-${uuid}.json`)
  try {
    fs.writeFileSync(pipelineFile, JSON.stringify(pipeline))
  } catch (e) {
    return
  }
}
