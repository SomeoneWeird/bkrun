import path from 'path'

import {
  setMetadata,
  getMetadata
} from './metadata'

import {
  writePipeline
} from './pipeline'

import loadFile from './loadFile'

let [ , , uuid, ...parts ] = process.argv

let [ command, ...args ] = parts

switch (command) {
  case 'meta-data': {
    handleMetadata()
    break
  }
  case 'pipeline': {
    handlePipeline()
    break
  }
  default: {
    console.error('bkrun-agent does not implement', command)
    process.exit(1)
  }
}

function handlePipeline () {
  let [ upload, file, replace ] = args

  if (file === '--replace') {
    replace = '--replace'
    file = null
  }

  if (upload !== 'upload') {
    console.error('bkrun-agent pipeline action must be upload')
    process.exit(1)
  }

  function gotPipeline (pipeline) {
    writePipeline(uuid, {
      replace: replace === '--replace',
      pipeline
    })
    process.exit()
  }

  if (file) {
    let pipeline = loadFile(path.resolve(process.cwd(), file))
    return gotPipeline(pipeline)
  }

  console.log('bkrun-agent pipeline upload doesnt support stdin uploading yet')
}

function handleMetadata () {
  let [ action, key, value ] = args

  if (!~[ 'get', 'set' ].indexOf(action)) {
    console.error('bkrun-agent meta-data action must be get or set')
    process.exit(1)
  }

  if (action === 'get') {
    try {
      console.log(getMetadata(uuid, key))
    } catch (e) {
      process.exit(1)
    }
  }

  if (action === 'set') {
    try {
      setMetadata(uuid, key, value)
    } catch (e) {
      throw e
    }
  }
}