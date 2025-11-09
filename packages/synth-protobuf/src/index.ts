/**
 * @sylphx/synth-protobuf
 *
 * Protocol Buffers parser using Synth's universal AST
 */

export {
  ProtobufParser,
  createParser,
  parse,
  parseAsync,
  type ProtobufParseOptions,
} from './parser.js'

export type { Tree, Plugin, Node } from '@sylphx/synth'
