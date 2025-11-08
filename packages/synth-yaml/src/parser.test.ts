/**
 * YAML Parser Tests
 */

import { describe, it, expect } from 'vitest'
import { YAMLParser, parse, parseAsync } from './parser.js'

describe('YAMLParser', () => {
  describe('Basic Values', () => {
    it('should parse null', () => {
      const tree = parse('null')
      const nodes = tree.nodes.filter(n => n.type === 'Null')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe(null)
    })

    it('should parse tilde as null', () => {
      const tree = parse('~')
      const nodes = tree.nodes.filter(n => n.type === 'Null')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe(null)
    })

    it('should parse true', () => {
      const tree = parse('true')
      const nodes = tree.nodes.filter(n => n.type === 'Boolean')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe(true)
    })

    it('should parse false', () => {
      const tree = parse('false')
      const nodes = tree.nodes.filter(n => n.type === 'Boolean')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe(false)
    })
  })

  describe('Numbers', () => {
    it('should parse integer', () => {
      const tree = parse('42')
      const nodes = tree.nodes.filter(n => n.type === 'Number')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe(42)
    })

    it('should parse negative integer', () => {
      const tree = parse('-42')
      const nodes = tree.nodes.filter(n => n.type === 'Number')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe(-42)
    })

    it('should parse float', () => {
      const tree = parse('3.14')
      const nodes = tree.nodes.filter(n => n.type === 'Number')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe(3.14)
    })

    it('should parse scientific notation', () => {
      const tree = parse('1.5e10')
      const nodes = tree.nodes.filter(n => n.type === 'Number')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe(1.5e10)
    })
  })

  describe('Strings', () => {
    it('should parse plain string', () => {
      const tree = parse('hello')
      const nodes = tree.nodes.filter(n => n.type === 'String')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe('hello')
    })

    it('should parse quoted string', () => {
      const tree = parse('"hello world"')
      const nodes = tree.nodes.filter(n => n.type === 'String')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe('hello world')
    })

    it('should parse single-quoted string', () => {
      const tree = parse("'hello world'")
      const nodes = tree.nodes.filter(n => n.type === 'String')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBe('hello world')
    })

    it('should parse multiline string', () => {
      const yaml = `|
        line 1
        line 2
        line 3`

      const tree = parse(yaml)
      const nodes = tree.nodes.filter(n => n.type === 'String')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toContain('line 1')
      expect(nodes[0]?.data?.value).toContain('line 2')
    })

    it('should parse folded string', () => {
      const yaml = `>
        this is a very
        long string that
        should be folded`

      const tree = parse(yaml)
      const nodes = tree.nodes.filter(n => n.type === 'String')

      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.data?.value).toBeDefined()
    })
  })

  describe('Sequences (Arrays)', () => {
    it('should parse flow sequence', () => {
      const tree = parse('[1, 2, 3]')
      const seqNode = tree.nodes.find(n => n.type === 'Sequence')

      expect(seqNode).toBeDefined()
      expect(seqNode?.children).toHaveLength(3)
    })

    it('should parse block sequence', () => {
      const yaml = `
- item1
- item2
- item3`

      const tree = parse(yaml)
      const seqNode = tree.nodes.find(n => n.type === 'Sequence')

      expect(seqNode).toBeDefined()
      expect(seqNode?.children).toHaveLength(3)
    })

    it('should parse nested sequences', () => {
      const yaml = `
- [1, 2]
- [3, 4]`

      const tree = parse(yaml)
      const sequences = tree.nodes.filter(n => n.type === 'Sequence')

      expect(sequences.length).toBeGreaterThan(1)
    })

    it('should parse mixed type sequence', () => {
      const yaml = `
- 42
- "string"
- true
- null`

      const tree = parse(yaml)
      const seqNode = tree.nodes.find(n => n.type === 'Sequence')

      expect(seqNode?.children).toHaveLength(4)

      const types = seqNode!.children.map(id => tree.nodes[id]!.type)
      expect(types).toContain('Number')
      expect(types).toContain('String')
      expect(types).toContain('Boolean')
      expect(types).toContain('Null')
    })
  })

  describe('Maps (Objects)', () => {
    it('should parse flow map', () => {
      const tree = parse('{name: Alice, age: 30}')
      const mapNode = tree.nodes.find(n => n.type === 'Map')

      expect(mapNode).toBeDefined()
      expect(mapNode?.children).toHaveLength(2)
    })

    it('should parse block map', () => {
      const yaml = `
name: Alice
age: 30
active: true`

      const tree = parse(yaml)
      const mapNode = tree.nodes.find(n => n.type === 'Map')

      expect(mapNode).toBeDefined()
      expect(mapNode?.children).toHaveLength(3)

      const pairs = mapNode!.children.map(id => tree.nodes[id]!)
      expect(pairs[0]?.type).toBe('Pair')
      expect(pairs[0]?.data?.key).toBe('name')
    })

    it('should parse nested maps', () => {
      const yaml = `
person:
  name: Alice
  age: 30`

      const tree = parse(yaml)
      const maps = tree.nodes.filter(n => n.type === 'Map')

      expect(maps.length).toBeGreaterThan(1)
    })
  })

  describe('Complex Structures', () => {
    it('should parse users list', () => {
      const yaml = `
users:
  - name: Alice
    age: 30
  - name: Bob
    age: 25`

      const tree = parse(yaml)
      const rootMap = tree.nodes.find(n => n.type === 'Map')

      expect(rootMap).toBeDefined()
    })

    it('should parse config file', () => {
      const yaml = `
database:
  host: localhost
  port: 5432
  credentials:
    user: admin
    password: secret

features:
  - auth
  - logging
  - metrics`

      const tree = parse(yaml)
      const maps = tree.nodes.filter(n => n.type === 'Map')
      const seqs = tree.nodes.filter(n => n.type === 'Sequence')

      expect(maps.length).toBeGreaterThan(2)
      expect(seqs).toHaveLength(1)
    })

    it('should parse deeply nested structure', () => {
      const yaml = `
a:
  b:
    c:
      d:
        e: value`

      const tree = parse(yaml)
      const maps = tree.nodes.filter(n => n.type === 'Map')

      expect(maps.length).toBeGreaterThan(4)
    })
  })

  describe('YAML-specific Features', () => {
    it('should handle anchors and aliases', () => {
      const yaml = `
defaults: &defaults
  timeout: 30
  retry: 3

production:
  <<: *defaults
  timeout: 60`

      const tree = parse(yaml)
      expect(tree).toBeDefined()
    })

    it('should handle explicit types', () => {
      const yaml = `
number: !!int "42"
string: !!str 42`

      const tree = parse(yaml)
      expect(tree).toBeDefined()
    })

    it('should handle comments', () => {
      const yaml = `
# This is a comment
name: Alice  # inline comment
age: 30`

      const tree = parse(yaml)
      const mapNode = tree.nodes.find(n => n.type === 'Map')

      expect(mapNode?.children).toHaveLength(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty document', () => {
      const tree = parse('')
      expect(tree.nodes[tree.root]?.children).toHaveLength(0)
    })

    it('should handle whitespace-only', () => {
      const tree = parse('   \n  \n  ')
      expect(tree.nodes[tree.root]?.children).toHaveLength(0)
    })

    it('should handle empty map', () => {
      const tree = parse('{}')
      const mapNode = tree.nodes.find(n => n.type === 'Map')

      expect(mapNode?.children).toHaveLength(0)
    })

    it('should handle empty sequence', () => {
      const tree = parse('[]')
      const seqNode = tree.nodes.find(n => n.type === 'Sequence')

      expect(seqNode?.children).toHaveLength(0)
    })

    it('should handle keys with special characters', () => {
      const yaml = `
"key:with:colons": value
"key with spaces": value`

      const tree = parse(yaml)
      const mapNode = tree.nodes.find(n => n.type === 'Map')

      expect(mapNode?.children).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should throw on invalid YAML', () => {
      expect(() => {
        parse('invalid: [unclosed')
      }).toThrow()
    })

    it('should throw on indentation errors', () => {
      const badYaml = `
map:
  key: value
 badIndent: value`

      expect(() => {
        parse(badYaml)
      }).toThrow()
    })
  })

  describe('Standalone Functions', () => {
    it('should parse with standalone parse()', () => {
      const tree = parse('value: 42')
      const mapNode = tree.nodes.find(n => n.type === 'Map')

      expect(mapNode).toBeDefined()
    })

    it('should parse with parseAsync()', async () => {
      const tree = await parseAsync('value: 42')
      const mapNode = tree.nodes.find(n => n.type === 'Map')

      expect(mapNode).toBeDefined()
    })
  })

  describe('Parser Class', () => {
    it('should create parser', () => {
      const parser = new YAMLParser()
      expect(parser).toBeDefined()
    })

    it('should parse with parser instance', () => {
      const parser = new YAMLParser()
      const tree = parser.parse('value: 42')

      expect(tree).toBeDefined()
    })

    it('should get last parsed tree', () => {
      const parser = new YAMLParser()
      parser.parse('value: 42')

      const tree = parser.getTree()
      expect(tree).toBeDefined()
    })
  })

  describe('Real-World Examples', () => {
    it('should parse GitHub Actions workflow', () => {
      const yaml = `
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test`

      const tree = parse(yaml)
      const rootMap = tree.nodes.find(n => n.type === 'Map')

      expect(rootMap).toBeDefined()
    })

    it('should parse Docker Compose file', () => {
      const yaml = `
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html

  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: secret`

      const tree = parse(yaml)
      const maps = tree.nodes.filter(n => n.type === 'Map')

      expect(maps.length).toBeGreaterThan(3)
    })

    it('should parse Kubernetes config', () => {
      const yaml = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
    ports:
    - containerPort: 80`

      const tree = parse(yaml)
      const rootMap = tree.nodes.find(n => n.type === 'Map')

      expect(rootMap).toBeDefined()
    })
  })
})
