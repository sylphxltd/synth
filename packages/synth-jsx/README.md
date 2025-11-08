# @sylphx/synth-jsx

JSX/TSX parser using Synth's universal AST. Conversion layer over Acorn + acorn-jsx.

## Features

- ✅ **Strategic Dependency** - Uses Acorn + acorn-jsx (battle-tested JSX parser)
- 🚀 **Full JSX Support** - Elements, attributes, expressions, fragments
- 🎯 **Universal AST** - Converts JSX AST to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Production Ready** - Acorn powers Webpack, Rollup, and many build tools

## Installation

```bash
npm install @sylphx/synth-jsx
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-jsx'

const jsx = `
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>
}
`

const tree = parse(jsx)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { JSXParser, createParser, parse, parseAsync } from '@sylphx/synth-jsx'

// Standalone function (recommended)
const tree = parse('<div>Hello World</div>')

// Async parsing (for plugins)
const tree = await parseAsync('<div>Hello World</div>')

// Class instance
const parser = new JSXParser()
const tree = parser.parse('<div>Hello World</div>')

// Factory function
const parser = createParser()
const tree = parser.parse('<div>Hello World</div>')
```

### Parser Options

```typescript
import { parse } from '@sylphx/synth-jsx'

// Specify ECMAScript version
const tree = parse(jsx, { ecmaVersion: 2022 })

// Parse as script (default: 'module')
const tree = parse(jsx, { sourceType: 'script' })

// Allow return outside function
const tree = parse(jsx, { allowReturnOutsideFunction: true })
```

### Plugin System

```typescript
import { parse, type Tree } from '@sylphx/synth-jsx'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse(jsxSource, { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync(jsxSource, { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by converting Acorn's AST. Each node includes:

### Node Structure

```typescript
{
  type: 'JSXElement' | 'JSXFragment' | ...,  // Acorn node type
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    acornNode: { ... },  // Original Acorn node
    text: '<div>...</div>'  // Extracted text
  }
}
```

## Supported JSX Features

### Elements
- ✅ Basic JSX elements
- ✅ Self-closing elements `<Component />`
- ✅ Nested elements
- ✅ Multiple sibling elements

### Attributes
- ✅ String attributes `className="container"`
- ✅ Expression attributes `style={{ color: 'red' }}`
- ✅ Boolean attributes `checked`
- ✅ Spread attributes `{...props}`
- ✅ Multiple attributes

### Expressions
- ✅ Expression as child `{name}`
- ✅ Method calls `{getName()}`
- ✅ Ternary expressions `{isActive ? 'Active' : 'Inactive'}`
- ✅ Logical AND `{isVisible && <span>Visible</span>}`
- ✅ Map expressions `{items.map(...)}`

### Fragments
- ✅ Fragment shorthand `<>...</>`
- ✅ Fragment with key `<React.Fragment key="1">...</React.Fragment>`

### Components
- ✅ Functional components
- ✅ Arrow function components
- ✅ Component with props
- ✅ Component usage
- ✅ Nested components

### Event Handlers
- ✅ onClick, onChange, etc.
- ✅ Inline arrow functions
- ✅ Multiple event handlers
- ✅ Event handlers with parameters

### React Features
- ✅ Conditional rendering (ternary, logical AND)
- ✅ Lists and keys
- ✅ Hooks (useState, useEffect, etc.)
- ✅ Comments `{/* comment */}`

## Examples

### Basic Component

```typescript
const jsx = `
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>
}
`

const tree = parse(jsx)
```

### Component with State

```typescript
const jsx = `
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}
`

const tree = parse(jsx)
```

### List Rendering

```typescript
const jsx = `
function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
`

const tree = parse(jsx)
```

### Conditional Rendering

```typescript
const jsx = `
function Status({ isOnline }) {
  return (
    <div>
      {isOnline ? (
        <span className="online">Online</span>
      ) : (
        <span className="offline">Offline</span>
      )}
    </div>
  )
}
`

const tree = parse(jsx)
```

### Form Component

```typescript
const jsx = `
function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Submitting:', formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
      />
      <button type="submit">Login</button>
    </form>
  )
}
`

const tree = parse(jsx)
```

### Todo List

```typescript
const jsx = `
function TodoList() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    setTodos([...todos, { id: Date.now(), text: input, done: false }])
    setInput('')
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ))
  }

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map(todo => (
          <li
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
          >
            <span
              style={{
                textDecoration: todo.done ? 'line-through' : 'none'
              }}
            >
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
`

const tree = parse(jsx)
```

### Modal Component

```typescript
const jsx = `
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  )
}
`

const tree = parse(jsx)
```

### Card Component

```typescript
const jsx = `
function Card({ title, description, image, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      {image && <img src={image} alt={title} />}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        {description && (
          <p className="card-description">{description}</p>
        )}
      </div>
    </div>
  )
}
`

const tree = parse(jsx)
```

## Performance

Leverages Acorn's proven performance:
- Fast parsing of JSX syntax
- Optimized for production use
- Used by major build tools
- Efficient memory usage

## Development Philosophy

This package uses a **strategic dependency** approach:

- **Third-party parser:** Acorn + acorn-jsx (powers Webpack, Rollup)
- **Our conversion layer:** Acorn AST → Synth universal AST
- **Our value:** Universal format, cross-language tools, plugin system

### Why Acorn + acorn-jsx?

- ❌ Writing JSX parser: 80+ hours, complex syntax extensions
- ✅ Using Acorn: Battle-tested, extensible, fast
- **Our focus:** Universal AST format, transformations, cross-language operations

## Use Cases

- **Component analysis:** Analyze React components
- **Code transformation:** Transform JSX patterns
- **Linting:** Build custom JSX linters
- **Documentation:** Extract component docs
- **Code generation:** Generate components
- **Migration tools:** Refactor React code
- **Static analysis:** Component complexity, prop usage
- **Cross-language tools:** Analyze JSX + TypeScript + CSS together

## Parser Options

```typescript
interface JSXParseOptions {
  // ECMAScript version (default: 'latest')
  ecmaVersion?: 'latest' | 2015 | 2016 | ... | 2024

  // Source type (default: 'module')
  sourceType?: 'script' | 'module'

  // Allow return outside function
  allowReturnOutsideFunction?: boolean

  // Allow import/export everywhere
  allowImportExportEverywhere?: boolean

  // Allow hash bang (#!) at start
  allowHashBang?: boolean

  // Plugin system
  plugins?: Plugin[]
}
```

## TypeScript Support

While this parser focuses on JSX, it can also parse TypeScript JSX (TSX) files. For full TypeScript support with type annotations, consider using a dedicated TypeScript parser.

## License

MIT

---

**Note:** This package uses Acorn + acorn-jsx for parsing. See [Acorn](https://github.com/acornjs/acorn) and [acorn-jsx](https://github.com/acornjs/acorn-jsx) for parser details.
