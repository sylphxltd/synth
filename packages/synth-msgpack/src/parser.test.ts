import { describe, it, expect } from 'bun:test'
import { MsgPackParser, createParser, parse, parseAsync } from './parser.js'
import { encode } from '@msgpack/msgpack'
import type { Tree, Plugin } from '@sylphx/synth'

describe('MsgPackParser', () => {
  it('should create a parser instance', () => {
    const parser = new MsgPackParser()
    expect(parser).toBeInstanceOf(MsgPackParser)
  })

  it('should create parser with factory', () => {
    const parser = createParser()
    expect(parser).toBeInstanceOf(MsgPackParser)
  })

  it('should parse null', () => {
    const data = encode(null)
    const tree = parse(data)

    expect(tree).toBeDefined()
    expect(tree.meta.language).toBe('msgpack')

    const rootNode = tree.nodes[tree.root]
    expect(rootNode!.children.length).toBe(1)

    const nullNode = tree.nodes[rootNode!.children[0]!]
    expect(nullNode!.type).toBe('MsgPackNull')
    expect(nullNode!.data.value).toBe(null)
  })

  it('should parse boolean values', () => {
    const trueData = encode(true)
    const falseData = encode(false)

    const trueTree = parse(trueData)
    const falseTree = parse(falseData)

    const trueNode = trueTree.nodes[trueTree.nodes[trueTree.root]!.children[0]!]
    expect(trueNode!.type).toBe('MsgPackBoolean')
    expect(trueNode!.data.value).toBe(true)

    const falseNode = falseTree.nodes[falseTree.nodes[falseTree.root]!.children[0]!]
    expect(falseNode!.type).toBe('MsgPackBoolean')
    expect(falseNode!.data.value).toBe(false)
  })

  it('should parse numbers', () => {
    const positiveData = encode(42)
    const negativeData = encode(-17)
    const floatData = encode(3.14)

    const positiveTree = parse(positiveData)
    const positiveNode = positiveTree.nodes[positiveTree.nodes[positiveTree.root]!.children[0]!]
    expect(positiveNode!.type).toBe('MsgPackNumber')
    expect(positiveNode!.data.value).toBe(42)

    const negativeTree = parse(negativeData)
    const negativeNode = negativeTree.nodes[negativeTree.nodes[negativeTree.root]!.children[0]!]
    expect(negativeNode!.data.value).toBe(-17)

    const floatTree = parse(floatData)
    const floatNode = floatTree.nodes[floatTree.nodes[floatTree.root]!.children[0]!]
    expect(floatNode!.data.value).toBe(3.14)
  })

  it('should parse strings', () => {
    const data = encode('Hello, MessagePack!')
    const tree = parse(data)

    const stringNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(stringNode!.type).toBe('MsgPackString')
    expect(stringNode!.data.value).toBe('Hello, MessagePack!')
  })

  it('should parse binary data', () => {
    const binaryData = new Uint8Array([0x01, 0x02, 0x03, 0xff])
    const data = encode(binaryData)
    const tree = parse(data)

    const binaryNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(binaryNode!.type).toBe('MsgPackBinary')
    expect(binaryNode!.data.length).toBe(4)
    expect(binaryNode!.data.value).toBe('010203ff')
  })

  it('should parse arrays', () => {
    const data = encode([1, 2, 3, 4, 5])
    const tree = parse(data)

    const arrayNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(arrayNode!.type).toBe('MsgPackArray')
    expect(arrayNode!.data.length).toBe(5)
    expect(arrayNode!.children.length).toBe(5)

    const firstElement = tree.nodes[arrayNode!.children[0]!]
    expect(firstElement!.type).toBe('MsgPackNumber')
    expect(firstElement!.data.value).toBe(1)
  })

  it('should parse nested arrays', () => {
    const data = encode([[1, 2], [3, 4], [5, 6]])
    const tree = parse(data)

    const arrayNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(arrayNode!.type).toBe('MsgPackArray')
    expect(arrayNode!.children.length).toBe(3)

    const firstNested = tree.nodes[arrayNode!.children[0]!]
    expect(firstNested!.type).toBe('MsgPackArray')
    expect(firstNested!.children.length).toBe(2)
  })

  it('should parse objects/maps', () => {
    const data = encode({ name: 'Alice', age: 30, active: true })
    const tree = parse(data)

    const mapNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(mapNode!.type).toBe('MsgPackMap')
    expect(mapNode!.data.size).toBe(3)
    expect(mapNode!.children.length).toBe(3)

    const nameNode = mapNode!.children.find((childId) => {
      const child = tree.nodes[childId!]!
      return child.data.key === 'name'
    })
    expect(nameNode).toBeDefined()
    const nameValue = tree.nodes[nameNode!]!
    expect(nameValue.type).toBe('MsgPackString')
    expect(nameValue.data.value).toBe('Alice')
  })

  it('should parse nested objects', () => {
    const data = encode({
      user: {
        name: 'Bob',
        profile: {
          email: 'bob@example.com',
          verified: true,
        },
      },
    })
    const tree = parse(data)

    const rootMap = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(rootMap!.type).toBe('MsgPackMap')

    const userNode = rootMap!.children.find((childId) => {
      const child = tree.nodes[childId!]!
      return child.data.key === 'user'
    })
    expect(userNode).toBeDefined()
    const userMap = tree.nodes[userNode!]!
    expect(userMap.type).toBe('MsgPackMap')
  })

  it('should parse mixed array', () => {
    const data = encode([1, 'two', true, null, [5, 6]])
    const tree = parse(data)

    const arrayNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(arrayNode!.children.length).toBe(5)

    const types = arrayNode!.children.map((childId) => tree.nodes[childId!]!.type)
    expect(types).toEqual([
      'MsgPackNumber',
      'MsgPackString',
      'MsgPackBoolean',
      'MsgPackNull',
      'MsgPackArray',
    ])
  })

  it('should parse real-world user data', () => {
    const userData = {
      id: 12345,
      username: 'alice_smith',
      email: 'alice@example.com',
      active: true,
      profile: {
        firstName: 'Alice',
        lastName: 'Smith',
        age: 28,
        interests: ['coding', 'music', 'travel'],
      },
      settings: {
        notifications: true,
        theme: 'dark',
      },
    }

    const data = encode(userData)
    const tree = parse(data)

    const rootMap = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(rootMap!.type).toBe('MsgPackMap')
    expect(rootMap!.children.length).toBe(6)
  })

  it('should parse array of objects', () => {
    const data = encode([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ])
    const tree = parse(data)

    const arrayNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(arrayNode!.type).toBe('MsgPackArray')
    expect(arrayNode!.children.length).toBe(3)

    const firstItem = tree.nodes[arrayNode!.children[0]!]
    expect(firstItem!.type).toBe('MsgPackMap')
  })

  it('should handle plugins synchronously', () => {
    const data = encode({ test: 42 })

    const plugin: Plugin = {
      name: 'test-plugin',
      transform(tree: Tree) {
        return tree
      },
    }

    const parser = new MsgPackParser()
    parser.use(plugin)
    const tree = parser.parse(data)

    expect(tree).toBeDefined()
  })

  it('should handle plugins via options', () => {
    const data = encode({ test: 42 })

    const plugin: Plugin = {
      name: 'test-plugin',
      transform(tree: Tree) {
        return tree
      },
    }

    const tree = parse(data, { plugins: [plugin] })
    expect(tree).toBeDefined()
  })

  it('should throw on async plugin in sync parse', () => {
    const data = encode({ test: 42 })

    const asyncPlugin: Plugin = {
      name: 'async-plugin',
      async transform(tree: Tree) {
        return tree
      },
    }

    expect(() => {
      parse(data, { plugins: [asyncPlugin] })
    }).toThrow('Detected async plugins')
  })

  it('should handle async plugins in parseAsync', async () => {
    const data = encode({ test: 42 })

    const asyncPlugin: Plugin = {
      name: 'async-plugin',
      async transform(tree: Tree) {
        return tree
      },
    }

    const tree = await parseAsync(data, { plugins: [asyncPlugin] })
    expect(tree).toBeDefined()
  })

  it('should get last parsed tree', () => {
    const data = encode({ test: 42 })

    const parser = new MsgPackParser()
    const tree = parser.parse(data)
    const lastTree = parser.getTree()

    expect(lastTree).toBe(tree)
  })

  it('should return null before parsing', () => {
    const parser = new MsgPackParser()
    expect(parser.getTree()).toBeNull()
  })

  it('should use standalone parse function', () => {
    const data = encode(123)
    const tree = parse(data)
    expect(tree).toBeDefined()
    expect(tree.meta.language).toBe('msgpack')
  })

  it('should use standalone parseAsync function', async () => {
    const data = encode(456)
    const tree = await parseAsync(data)
    expect(tree).toBeDefined()
    expect(tree.meta.language).toBe('msgpack')
  })

  it('should handle ArrayBuffer input', () => {
    const data = encode(789)
    const arrayBuffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    )
    const tree = parse(arrayBuffer)

    expect(tree).toBeDefined()
    const numNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(numNode!.data.value).toBe(789)
  })

  it('should parse empty object', () => {
    const data = encode({})
    const tree = parse(data)

    const mapNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(mapNode!.type).toBe('MsgPackMap')
    expect(mapNode!.data.size).toBe(0)
    expect(mapNode!.children.length).toBe(0)
  })

  it('should parse empty array', () => {
    const data = encode([])
    const tree = parse(data)

    const arrayNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(arrayNode!.type).toBe('MsgPackArray')
    expect(arrayNode!.data.length).toBe(0)
    expect(arrayNode!.children.length).toBe(0)
  })

  it('should parse large numbers', () => {
    const data = encode(Number.MAX_SAFE_INTEGER)
    const tree = parse(data)

    const numNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(numNode!.data.value).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('should parse unicode strings', () => {
    const data = encode('Hello 世界 🌍')
    const tree = parse(data)

    const stringNode = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(stringNode!.type).toBe('MsgPackString')
    expect(stringNode!.data.value).toBe('Hello 世界 🌍')
  })

  it('should parse deeply nested structure', () => {
    const deepData = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep',
            },
          },
        },
      },
    }

    const data = encode(deepData)
    const tree = parse(data)

    expect(tree).toBeDefined()
    const rootMap = tree.nodes[tree.nodes[tree.root]!.children[0]!]
    expect(rootMap!.type).toBe('MsgPackMap')
  })
})
