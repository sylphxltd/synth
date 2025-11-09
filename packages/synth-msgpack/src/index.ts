/**
 * @sylphx/synth-msgpack
 *
 * MessagePack parser using Synth's universal AST
 */

export {
  MsgPackParser,
  createParser,
  parse,
  parseAsync,
  type MsgPackParseOptions,
} from './parser.js'

export type { Tree, Plugin, Node } from '@sylphx/synth'
