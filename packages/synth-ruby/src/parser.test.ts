/**
 * Ruby Parser Tests
 */

import { describe, it, expect } from 'vitest'
import { parse, parseAsync, createParser, RubyParser } from './parser.js'

describe('RubyParser', () => {
  describe('Basic Parsing', () => {
    it('should parse empty Ruby', () => {
      const tree = parse('')
      expect(tree.meta.language).toBe('ruby')
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse simple puts', () => {
      const ruby = 'puts "Hello, World!"'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')
      expect(tree.nodes[tree.root]).toBeDefined()

      // Should have program root and children
      const rootChildren = tree.nodes[tree.root]!.children
      expect(rootChildren.length).toBeGreaterThan(0)
    })

    it('should parse variable assignment', () => {
      const ruby = 'x = 42'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find assignment
      const assignNode = tree.nodes.find(n => n.type.includes('Assignment'))
      expect(assignNode).toBeDefined()
    })

    it('should parse method definition', () => {
      const ruby = `
def greet(name)
  "Hello, \#{name}!"
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find method definition
      const methodNode = tree.nodes.find(n => n.type === 'Method' || n.type.includes('Method'))
      expect(methodNode).toBeDefined()
    })

    it('should parse class definition', () => {
      const ruby = `
class Person
  def initialize(name)
    @name = name
  end
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find class
      const classNode = tree.nodes.find(n => n.type === 'Class')
      expect(classNode).toBeDefined()
    })
  })

  describe('Data Types', () => {
    it('should parse string literals', () => {
      const ruby = 'text = "Hello, World!"'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find string node
      const stringNode = tree.nodes.find(n => n.type === 'String' || n.type.includes('String'))
      expect(stringNode).toBeDefined()
    })

    it('should parse single quoted strings', () => {
      const ruby = "text = 'Hello'"
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find string node
      const stringNode = tree.nodes.find(n => n.type === 'String' || n.type.includes('String'))
      expect(stringNode).toBeDefined()
    })

    it('should parse string interpolation', () => {
      const ruby = 'name = "World"; greeting = "Hello, #{name}!"'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find string with interpolation
      const interpolNode = tree.nodes.find(n => n.type.includes('Interpolation'))
      expect(interpolNode).toBeDefined()
    })

    it('should parse symbols', () => {
      const ruby = 'status = :pending'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find symbol
      const symbolNode = tree.nodes.find(n => n.type === 'Symbol' || n.data?.text?.startsWith(':'))
      expect(symbolNode).toBeDefined()
    })

    it('should parse integer literals', () => {
      const ruby = 'num = 42'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find integer node
      const intNode = tree.nodes.find(n => n.type === 'Integer' || n.data?.text === '42')
      expect(intNode).toBeDefined()
    })

    it('should parse float literals', () => {
      const ruby = 'pi = 3.14159'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find float node
      const floatNode = tree.nodes.find(n => n.type === 'Float' || n.data?.text?.includes('.'))
      expect(floatNode).toBeDefined()
    })

    it('should parse boolean literals', () => {
      const ruby = `
flag1 = true
flag2 = false
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find boolean nodes
      const boolNodes = tree.nodes.filter(n =>
        n.type === 'True' || n.type === 'False' ||
        n.data?.text === 'true' || n.data?.text === 'false'
      )
      expect(boolNodes.length).toBeGreaterThanOrEqual(2)
    })

    it('should parse arrays', () => {
      const ruby = 'numbers = [1, 2, 3, 4, 5]'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find array
      const arrayNode = tree.nodes.find(n => n.type === 'Array')
      expect(arrayNode).toBeDefined()
    })

    it('should parse hashes', () => {
      const ruby = 'person = { name: "John", age: 30 }'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find hash
      const hashNode = tree.nodes.find(n => n.type === 'Hash')
      expect(hashNode).toBeDefined()
    })

    it('should parse ranges', () => {
      const ruby = 'range = 1..10'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find range
      const rangeNode = tree.nodes.find(n => n.type === 'Range' || n.data?.text?.includes('..'))
      expect(rangeNode).toBeDefined()
    })

    it('should parse nil', () => {
      const ruby = 'value = nil'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find nil literal
      const nilNode = tree.nodes.find(n => n.type === 'Nil' || n.data?.text === 'nil')
      expect(nilNode).toBeDefined()
    })
  })

  describe('Control Flow', () => {
    it('should parse if statement', () => {
      const ruby = `
if x > 0
  puts "positive"
elsif x < 0
  puts "negative"
else
  puts "zero"
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find if statement
      const ifNode = tree.nodes.find(n => n.type === 'If' || n.type === 'IfStatement')
      expect(ifNode).toBeDefined()
    })

    it('should parse unless statement', () => {
      const ruby = `
unless x.nil?
  puts x
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find unless statement
      const unlessNode = tree.nodes.find(n => n.type === 'Unless')
      expect(unlessNode).toBeDefined()
    })

    it('should parse while loop', () => {
      const ruby = `
while x < 10
  x += 1
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find while statement
      const whileNode = tree.nodes.find(n => n.type === 'While')
      expect(whileNode).toBeDefined()
    })

    it('should parse until loop', () => {
      const ruby = `
until x >= 10
  x += 1
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find until statement
      const untilNode = tree.nodes.find(n => n.type === 'Until')
      expect(untilNode).toBeDefined()
    })

    it('should parse for loop', () => {
      const ruby = `
for i in 1..10
  puts i
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find for statement
      const forNode = tree.nodes.find(n => n.type === 'For')
      expect(forNode).toBeDefined()
    })

    it('should parse case statement', () => {
      const ruby = `
case day
when "Monday"
  puts "Start of week"
when "Friday"
  puts "End of week"
else
  puts "Midweek"
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find case statement
      const caseNode = tree.nodes.find(n => n.type === 'Case')
      expect(caseNode).toBeDefined()
    })

    it('should parse begin-rescue-end', () => {
      const ruby = `
begin
  risky_operation
rescue StandardError => e
  puts "Error: \#{e.message}"
ensure
  cleanup
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find begin statement
      const beginNode = tree.nodes.find(n => n.type === 'Begin')
      expect(beginNode).toBeDefined()
    })
  })

  describe('Methods', () => {
    it('should parse method with parameters', () => {
      const ruby = `
def add(a, b)
  a + b
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find method definition
      const methodNode = tree.nodes.find(n => n.type === 'Method' || n.type.includes('Method'))
      expect(methodNode).toBeDefined()
    })

    it('should parse method with default parameters', () => {
      const ruby = `
def greet(name = "World")
  "Hello, \#{name}!"
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find method definition
      const methodNode = tree.nodes.find(n => n.type === 'Method' || n.type.includes('Method'))
      expect(methodNode).toBeDefined()
    })

    it('should parse method with splat operator', () => {
      const ruby = `
def sum(*numbers)
  numbers.reduce(0, :+)
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find method definition
      const methodNode = tree.nodes.find(n => n.type === 'Method' || n.type.includes('Method'))
      expect(methodNode).toBeDefined()
    })

    it('should parse method with keyword arguments', () => {
      const ruby = `
def greet(name:, greeting: "Hello")
  "\#{greeting}, \#{name}!"
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find method definition
      const methodNode = tree.nodes.find(n => n.type === 'Method' || n.type.includes('Method'))
      expect(methodNode).toBeDefined()
    })

    it('should parse method with block parameter', () => {
      const ruby = `
def apply(&block)
  block.call
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find method definition
      const methodNode = tree.nodes.find(n => n.type === 'Method' || n.type.includes('Method'))
      expect(methodNode).toBeDefined()
    })
  })

  describe('Blocks', () => {
    it('should parse block with do-end', () => {
      const ruby = `
[1, 2, 3].each do |n|
  puts n
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find block
      const blockNode = tree.nodes.find(n => n.type === 'Block' || n.type === 'DoBlock')
      expect(blockNode).toBeDefined()
    })

    it('should parse block with braces', () => {
      const ruby = '[1, 2, 3].each { |n| puts n }'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find block
      const blockNode = tree.nodes.find(n => n.type === 'Block')
      expect(blockNode).toBeDefined()
    })

    it('should parse block parameters', () => {
      const ruby = `
hash.each do |key, value|
  puts "\#{key}: \#{value}"
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find block with parameters
      const blockNode = tree.nodes.find(n => n.type === 'Block' || n.type === 'DoBlock')
      expect(blockNode).toBeDefined()
    })

    it('should parse proc', () => {
      const ruby = 'double = Proc.new { |x| x * 2 }'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Should parse successfully
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse lambda', () => {
      const ruby = 'double = lambda { |x| x * 2 }'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Should parse successfully
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse stabby lambda', () => {
      const ruby = 'double = ->(x) { x * 2 }'
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find lambda
      const lambdaNode = tree.nodes.find(n => n.type === 'Lambda' || n.data?.text?.includes('->'))
      expect(lambdaNode).toBeDefined()
    })
  })

  describe('Classes', () => {
    it('should parse class with methods', () => {
      const ruby = `
class Calculator
  def add(a, b)
    a + b
  end

  def subtract(a, b)
    a - b
  end
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find class
      const classNode = tree.nodes.find(n => n.type === 'Class')
      expect(classNode).toBeDefined()
    })

    it('should parse initialize method', () => {
      const ruby = `
class Person
  def initialize(name)
    @name = name
  end
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find initialize method
      const initNode = tree.nodes.find(n => n.data?.text?.includes('initialize'))
      expect(initNode).toBeDefined()
    })

    it('should parse instance variables', () => {
      const ruby = `
class Person
  def set_name(name)
    @name = name
  end
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find instance variable
      const ivarNode = tree.nodes.find(n => n.type.includes('Instance') || n.data?.text?.startsWith('@'))
      expect(ivarNode).toBeDefined()
    })

    it('should parse class variables', () => {
      const ruby = `
class Counter
  @@count = 0
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find class variable
      const cvarNode = tree.nodes.find(n => n.data?.text?.startsWith('@@'))
      expect(cvarNode).toBeDefined()
    })

    it('should parse class methods', () => {
      const ruby = `
class Math
  def self.square(x)
    x * x
  end
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find class method
      const methodNode = tree.nodes.find(n => n.data?.text?.includes('self'))
      expect(methodNode).toBeDefined()
    })

    it('should parse inheritance', () => {
      const ruby = `
class Dog < Animal
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find class with inheritance
      const classNode = tree.nodes.find(n => n.type === 'Class')
      expect(classNode).toBeDefined()
    })

    it('should parse module', () => {
      const ruby = `
module Greetable
  def greet
    puts "Hello!"
  end
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find module
      const moduleNode = tree.nodes.find(n => n.type === 'Module')
      expect(moduleNode).toBeDefined()
    })

    it('should parse attr_accessor', () => {
      const ruby = `
class Person
  attr_accessor :name, :age
end
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find attr_accessor call
      const attrNode = tree.nodes.find(n => n.data?.text?.includes('attr_accessor'))
      expect(attrNode).toBeDefined()
    })
  })

  describe('Comments', () => {
    it('should parse line comments', () => {
      const ruby = `
# This is a comment
x = 42
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Find comment node
      const commentNode = tree.nodes.find(n => n.type.includes('Comment') || n.data?.text?.includes('#'))
      expect(commentNode).toBeDefined()
    })

    it('should parse block comments', () => {
      const ruby = `
=begin
This is a
multi-line comment
=end
x = 42
      `
      const tree = parse(ruby)

      expect(tree.meta.language).toBe('ruby')

      // Should have parsed successfully
      expect(tree.nodes[tree.root]).toBeDefined()
    })
  })

  describe('API', () => {
    it('should create parser with factory', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(RubyParser)
    })

    it('should parse with standalone function', () => {
      const tree = parse('x = 42')
      expect(tree.meta.language).toBe('ruby')
    })

    it('should parse async', async () => {
      const tree = await parseAsync('x = 42')
      expect(tree.meta.language).toBe('ruby')
    })

    it('should support plugins', () => {
      let called = false
      const plugin = {
        transform: (tree: any) => {
          called = true
          return tree
        },
      }

      const parser = createParser()
      parser.use(plugin)
      parser.parse('x = 42')

      expect(called).toBe(true)
    })

    it('should support async plugins', async () => {
      let called = false
      const plugin = {
        transform: async (tree: any) => {
          called = true
          return tree
        },
      }

      const parser = createParser()
      parser.use(plugin)
      await parser.parseAsync('x = 42')

      expect(called).toBe(true)
    })

    it('should throw error for async plugin in sync parse', () => {
      const plugin = {
        transform: async (tree: any) => tree,
      }

      const parser = createParser()
      parser.use(plugin)

      expect(() => parser.parse('x = 42')).toThrow('async')
    })

    it('should get last parsed tree', () => {
      const parser = createParser()
      parser.parse('x = 42')
      const tree = parser.getTree()

      expect(tree).toBeDefined()
      expect(tree!.meta.language).toBe('ruby')
    })
  })
})
