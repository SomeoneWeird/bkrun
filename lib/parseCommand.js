import { parse } from 'parse-spawn-args'

export default function parseCommand (command) {
  let split = command.split(' ')
  let cmd = split.splice(0, 1)[0]
  let join = split.join(' ')
  let args = []
  if (join.length > 0) {
    args = parse(join)
  }
  return [ cmd, args ]
}
