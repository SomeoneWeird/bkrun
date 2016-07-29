import {
  setMetadata,
  getMetadata
} from './metadata'

let [ , , uuid, ...parts ] = process.argv

let [ command, ...args ] = parts

if (command !== 'meta-data') {
  console.error('bkrun-agent does not implement', command)
  process.exit(1)
}

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
