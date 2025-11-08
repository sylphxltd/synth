/**
 * Formatting options (Prettier-compatible)
 */

export interface FormatOptions {
  /** Print width - line length limit */
  printWidth?: number

  /** Number of spaces per indentation level */
  tabWidth?: number

  /** Use tabs instead of spaces */
  useTabs?: boolean

  /** Add semicolons at end of statements */
  semi?: boolean

  /** Use single quotes instead of double quotes */
  singleQuote?: boolean

  /** Quote object properties where required */
  quoteProps?: 'as-needed' | 'consistent' | 'preserve'

  /** Use trailing commas where valid in ES5 (objects, arrays, etc.) */
  trailingComma?: 'none' | 'es5' | 'all'

  /** Add spaces inside object literals */
  bracketSpacing?: boolean

  /** Put > of multi-line elements at end of last line */
  bracketSameLine?: boolean

  /** Include parentheses around sole arrow function parameter */
  arrowParens?: 'always' | 'avoid'

  /** Line ending type */
  endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto'
}

export const DEFAULT_OPTIONS: Required<FormatOptions> = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
}
