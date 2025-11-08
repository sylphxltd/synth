/**
 * @sylphx/synth-sql
 *
 * SQL parser using Synth's universal AST
 * Conversion layer over node-sql-parser
 */

export { SQLParser, createParser, parse, parseAsync } from './parser.js'
export type { SQLParseOptions } from './parser.js'
