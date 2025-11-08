/**
 * AST → Code Printer
 *
 * Converts Synth JavaScript AST back to formatted code
 */

import type { BaseNode, Tree } from '@sylphx/synth'
import type { FormatOptions } from './options.js'
import { DEFAULT_OPTIONS } from './options.js'

export class Printer {
  private options: Required<FormatOptions>
  private currentIndent = 0
  private output: string[] = []

  constructor(options: FormatOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  print(tree: Tree): string {
    this.output = []
    this.currentIndent = 0

    // Find Program node
    const program = tree.nodes.find(n => n.type === 'Program')
    if (!program) {
      throw new Error('No Program node found in tree')
    }

    // Print all children
    const children = this.getChildren(tree, program)
    this.printStatements(tree, children)

    return this.output.join('')
  }

  private printStatements(tree: Tree, nodes: BaseNode[], separator = '\n\n'): void {
    nodes.forEach((node, i) => {
      this.printNode(tree, node)
      if (i < nodes.length - 1) {
        this.write(separator)
      }
    })
  }

  private printNode(tree: Tree, node: BaseNode): void {
    switch (node.type) {
      case 'Program':
        this.printProgram(tree, node)
        break

      case 'VariableDeclaration':
        this.printVariableDeclaration(tree, node)
        break

      case 'FunctionDeclaration':
        this.printFunctionDeclaration(tree, node)
        break

      case 'ExpressionStatement':
        this.printExpressionStatement(tree, node)
        break

      case 'ReturnStatement':
        this.printReturnStatement(tree, node)
        break

      case 'IfStatement':
        this.printIfStatement(tree, node)
        break

      case 'BlockStatement':
        this.printBlockStatement(tree, node)
        break

      case 'CallExpression':
        this.printCallExpression(tree, node)
        break

      case 'MemberExpression':
        this.printMemberExpression(tree, node)
        break

      case 'Identifier':
        this.printIdentifier(node)
        break

      case 'Literal':
        this.printLiteral(node)
        break

      case 'BinaryExpression':
        this.printBinaryExpression(tree, node)
        break

      case 'UnaryExpression':
        this.printUnaryExpression(tree, node)
        break

      case 'ArrowFunctionExpression':
        this.printArrowFunction(tree, node)
        break

      case 'ArrayExpression':
        this.printArrayExpression(tree, node)
        break

      case 'ObjectExpression':
        this.printObjectExpression(tree, node)
        break

      case 'Property':
        this.printProperty(tree, node)
        break

      case 'VariableDeclarator':
        this.printVariableDeclarator(tree, node)
        break

      case 'ImportDeclaration':
        this.printImportDeclaration(tree, node)
        break

      case 'ExportNamedDeclaration':
      case 'ExportDefaultDeclaration':
        this.printExportDeclaration(tree, node)
        break

      case 'ClassDeclaration':
        this.printClassDeclaration(tree, node)
        break

      case 'MethodDefinition':
        this.printMethodDefinition(tree, node)
        break

      default:
        // Fallback for unsupported nodes
        this.write(`/* ${node.type} */`)
    }
  }

  private printProgram(tree: Tree, node: BaseNode): void {
    const children = this.getChildren(tree, node)
    this.printStatements(tree, children)
  }

  private printVariableDeclaration(tree: Tree, node: BaseNode): void {
    const kind = node.data?.kind || 'const'
    this.writeIndent()
    this.write(`${kind} `)

    const declarators = this.getChildren(tree, node)
    declarators.forEach((decl, i) => {
      this.printNode(tree, decl)
      if (i < declarators.length - 1) {
        this.write(', ')
      }
    })

    if (this.options.semi) {
      this.write(';')
    }
  }

  private printVariableDeclarator(tree: Tree, node: BaseNode): void {
    const children = this.getChildren(tree, node)
    const id = children.find(n => n.type === 'Identifier' || n.type.includes('Pattern'))
    const init = children.find(n => n !== id)

    if (id) {
      this.printNode(tree, id)
    }

    if (init) {
      this.write(' = ')
      this.printNode(tree, init)
    }
  }

  private printFunctionDeclaration(tree: Tree, node: BaseNode): void {
    this.writeIndent()

    if (node.data?.async) {
      this.write('async ')
    }

    this.write('function')

    if (node.data?.generator) {
      this.write('*')
    }

    const name = node.data?.id
    if (name) {
      this.write(` ${name}`)
    }

    this.write('(')

    const children = this.getChildren(tree, node)
    // Body is always BlockStatement, params are everything else
    const body = children.find(n => n.type === 'BlockStatement')
    const params = children.filter(n => n !== body)

    params.forEach((param, i) => {
      this.printNode(tree, param)
      if (i < params.length - 1) {
        this.write(', ')
      }
    })

    this.write(') ')

    if (body) {
      this.printNode(tree, body)
    }
  }

  private printArrowFunction(tree: Tree, node: BaseNode): void {
    this.write('(')

    const children = this.getChildren(tree, node)
    // Last child is usually the body (BlockStatement or expression)
    // Everything before that are params
    const body = children[children.length - 1]
    const params = children.slice(0, -1)

    params.forEach((param, i) => {
      this.printNode(tree, param)
      if (i < params.length - 1) {
        this.write(', ')
      }
    })

    this.write(') => ')

    if (body) {
      if (body.type === 'BlockStatement') {
        this.printNode(tree, body)
      } else {
        this.printNode(tree, body)
      }
    }
  }

  private printBlockStatement(tree: Tree, node: BaseNode): void {
    this.write('{')

    const children = this.getChildren(tree, node)
    if (children.length > 0) {
      this.write('\n')
      this.currentIndent++
      this.printStatements(tree, children, '\n')
      this.write('\n')
      this.currentIndent--
      this.writeIndent()
    }

    this.write('}')
  }

  private printExpressionStatement(tree: Tree, node: BaseNode): void {
    this.writeIndent()
    const children = this.getChildren(tree, node)
    if (children[0]) {
      this.printNode(tree, children[0])
    }
    if (this.options.semi) {
      this.write(';')
    }
  }

  private printReturnStatement(tree: Tree, node: BaseNode): void {
    this.writeIndent()
    this.write('return')

    const children = this.getChildren(tree, node)
    if (children[0]) {
      this.write(' ')
      this.printNode(tree, children[0])
    }

    if (this.options.semi) {
      this.write(';')
    }
  }

  private printIfStatement(tree: Tree, node: BaseNode): void {
    this.writeIndent()
    this.write('if (')

    const children = this.getChildren(tree, node)
    const test = children[0]
    const consequent = children[1]
    const alternate = children[2]

    if (test) {
      this.printNode(tree, test)
    }

    this.write(') ')

    if (consequent) {
      this.printNode(tree, consequent)
    }

    if (alternate) {
      this.write(' else ')
      this.printNode(tree, alternate)
    }
  }

  private printCallExpression(tree: Tree, node: BaseNode): void {
    const children = this.getChildren(tree, node)
    const callee = children[0]
    const args = children.slice(1)

    if (callee) {
      this.printNode(tree, callee)
    }

    this.write('(')
    args.forEach((arg, i) => {
      this.printNode(tree, arg)
      if (i < args.length - 1) {
        this.write(', ')
      }
    })
    this.write(')')
  }

  private printMemberExpression(tree: Tree, node: BaseNode): void {
    const children = this.getChildren(tree, node)
    const object = children[0]
    const property = children[1]
    const computed = node.data?.computed

    if (object) {
      this.printNode(tree, object)
    }

    if (computed) {
      this.write('[')
      if (property) {
        this.printNode(tree, property)
      }
      this.write(']')
    } else {
      this.write('.')
      if (property) {
        this.printNode(tree, property)
      }
    }
  }

  private printBinaryExpression(tree: Tree, node: BaseNode): void {
    const children = this.getChildren(tree, node)
    const left = children[0]
    const right = children[1]
    const operator = node.data?.operator

    if (left) {
      this.printNode(tree, left)
    }

    this.write(` ${operator} `)

    if (right) {
      this.printNode(tree, right)
    }
  }

  private printUnaryExpression(tree: Tree, node: BaseNode): void {
    const operator = node.data?.operator
    const prefix = node.data?.prefix !== false

    if (prefix) {
      this.write(operator as string)
      const children = this.getChildren(tree, node)
      if (children[0]) {
        this.printNode(tree, children[0])
      }
    }
  }

  private printArrayExpression(tree: Tree, node: BaseNode): void {
    this.write('[')
    const children = this.getChildren(tree, node)
    children.forEach((elem, i) => {
      this.printNode(tree, elem)
      if (i < children.length - 1) {
        this.write(', ')
      }
    })
    if (this.options.trailingComma === 'all' || this.options.trailingComma === 'es5') {
      if (children.length > 0) {
        this.write(',')
      }
    }
    this.write(']')
  }

  private printObjectExpression(tree: Tree, node: BaseNode): void {
    const children = this.getChildren(tree, node)

    if (children.length === 0) {
      this.write('{}')
      return
    }

    this.write('{')
    if (this.options.bracketSpacing) {
      this.write(' ')
    }

    children.forEach((prop, i) => {
      this.printNode(tree, prop)
      if (i < children.length - 1) {
        this.write(', ')
      }
    })

    if (this.options.trailingComma === 'all' || this.options.trailingComma === 'es5') {
      this.write(',')
    }

    if (this.options.bracketSpacing) {
      this.write(' ')
    }
    this.write('}')
  }

  private printProperty(tree: Tree, node: BaseNode): void {
    const children = this.getChildren(tree, node)
    const key = children[0]
    const value = children[1]

    if (key) {
      this.printNode(tree, key)
    }

    this.write(': ')

    if (value) {
      this.printNode(tree, value)
    }
  }

  private printImportDeclaration(_tree: Tree, _node: BaseNode): void {
    this.writeIndent()
    this.write('import ')

    // Simplified: would need to handle specifiers properly
    this.write('/* import */')

    if (this.options.semi) {
      this.write(';')
    }
  }

  private printExportDeclaration(tree: Tree, node: BaseNode): void {
    this.writeIndent()
    this.write('export ')

    if (node.type === 'ExportDefaultDeclaration') {
      this.write('default ')
    }

    const children = this.getChildren(tree, node)
    if (children[0]) {
      this.printNode(tree, children[0])
    }
  }

  private printClassDeclaration(tree: Tree, node: BaseNode): void {
    this.writeIndent()
    this.write('class ')

    const name = node.data?.id
    if (name && typeof name === 'string') {
      this.write(`${name} `)
    }

    // Handle class body
    const children = this.getChildren(tree, node)
    const classBody = children.find(n => n.type === 'ClassBody')

    if (classBody) {
      const methods = this.getChildren(tree, classBody)

      this.write('{')

      if (methods.length > 0) {
        this.write('\n')
        this.currentIndent++
        methods.forEach(method => {
          this.printNode(tree, method)
          this.write('\n')
        })
        this.currentIndent--
        this.writeIndent()
      }

      this.write('}')
    } else {
      this.write('{}')
    }
  }

  private printMethodDefinition(tree: Tree, node: BaseNode): void {
    this.writeIndent()

    const kind = node.data?.kind
    if (kind && kind !== 'method') {
      this.write(`${kind} `)
    }

    const key = this.getChildren(tree, node).find(n => n.type === 'Identifier')
    if (key) {
      this.printNode(tree, key)
    }

    this.write('() ')

    const value = this.getChildren(tree, node).find(n => n.type === 'FunctionExpression')
    if (value) {
      const body = this.getChildren(tree, value).find(n => n.type === 'BlockStatement')
      if (body) {
        this.printNode(tree, body)
      }
    }
  }

  private printIdentifier(node: BaseNode): void {
    const name = node.data?.name
    if (name) {
      this.write(String(name))
    }
  }

  private printLiteral(node: BaseNode): void {
    const raw = node.data?.raw
    const value = node.data?.value

    if (raw !== undefined) {
      // Handle quote style
      if (typeof value === 'string') {
        const quote = this.options.singleQuote ? "'" : '"'
        this.write(`${quote}${value}${quote}`)
      } else {
        this.write(String(raw))
      }
    } else if (value !== undefined) {
      this.write(JSON.stringify(value))
    }
  }

  private getChildren(tree: Tree, node: BaseNode): BaseNode[] {
    return node.children.map(id => tree.nodes[id]!).filter(Boolean)
  }

  private writeIndent(): void {
    const indent = this.options.useTabs
      ? '\t'.repeat(this.currentIndent)
      : ' '.repeat(this.currentIndent * this.options.tabWidth)
    this.write(indent)
  }

  private write(str: string): void {
    this.output.push(str)
  }
}
