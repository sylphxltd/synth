import { describe, it, expect } from 'bun:test'
import { parse, parseAsync, createParser, JSXParser } from './parser.js'
import type { Tree } from '@sylphx/synth'

describe('JSXParser', () => {
  describe('Basic JSX Elements', () => {
    it('should parse simple JSX element', () => {
      const jsx = '<div>Hello World</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('jsx')
      expect(tree.meta.source).toBe(jsx)
      expect(Object.keys(tree.nodes).length).toBeGreaterThan(1)
    })

    it('should parse self-closing element', () => {
      const jsx = '<img />'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse nested elements', () => {
      const jsx = `
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
        </div>
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse multiple sibling elements', () => {
      const jsx = `
        <div>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </div>
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('JSX Attributes', () => {
    it('should parse element with string attribute', () => {
      const jsx = '<div className="container">Content</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse element with expression attribute', () => {
      const jsx = '<div style={{ color: "red" }}>Content</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse element with boolean attribute', () => {
      const jsx = '<input type="checkbox" checked />'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse element with spread attributes', () => {
      const jsx = '<div {...props}>Content</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse element with multiple attributes', () => {
      const jsx = '<img src="photo.jpg" alt="Photo" width={100} height={100} />'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('JSX Expressions', () => {
    it('should parse expression as child', () => {
      const jsx = '<div>{name}</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse expression with method call', () => {
      const jsx = '<div>{getName()}</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse ternary expression', () => {
      const jsx = '<div>{isActive ? "Active" : "Inactive"}</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse logical AND expression', () => {
      const jsx = '<div>{isVisible && <span>Visible</span>}</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse map expression', () => {
      const jsx = '<ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('JSX Fragments', () => {
    it('should parse fragment shorthand', () => {
      const jsx = `
        <>
          <div>First</div>
          <div>Second</div>
        </>
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse fragment with key', () => {
      const jsx = '<React.Fragment key="fragment-1"><div>Content</div></React.Fragment>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('React Components', () => {
    it('should parse functional component', () => {
      const jsx = `
        function Welcome() {
          return <h1>Hello, World!</h1>
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse arrow function component', () => {
      const jsx = `
        const Welcome = () => {
          return <h1>Hello, World!</h1>
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse component with props', () => {
      const jsx = `
        function Greeting({ name }) {
          return <h1>Hello, {name}!</h1>
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse component usage', () => {
      const jsx = '<Welcome name="John" />'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse nested components', () => {
      const jsx = `
        <App>
          <Header />
          <Main>
            <Sidebar />
            <Content />
          </Main>
          <Footer />
        </App>
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('Event Handlers', () => {
    it('should parse onClick handler', () => {
      const jsx = '<button onClick={handleClick}>Click me</button>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse inline arrow function handler', () => {
      const jsx = '<button onClick={() => console.log("clicked")}>Click me</button>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse multiple event handlers', () => {
      const jsx = `
        <input
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse event handler with parameter', () => {
      const jsx = '<button onClick={(e) => handleClick(e, id)}>Click me</button>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('Conditional Rendering', () => {
    it('should parse if-else with ternary', () => {
      const jsx = `
        function Status({ isOnline }) {
          return (
            <div>
              {isOnline ? <Online /> : <Offline />}
            </div>
          )
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse conditional with logical AND', () => {
      const jsx = `
        function Notification({ hasNotification, message }) {
          return (
            <div>
              {hasNotification && <span>{message}</span>}
            </div>
          )
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse null coalescing', () => {
      const jsx = '<div>{value ?? "default"}</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('Lists and Keys', () => {
    it('should parse list with map', () => {
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
      expect(tree).toBeDefined()
    })

    it('should parse list with index key', () => {
      const jsx = `
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse nested lists', () => {
      const jsx = `
        <div>
          {categories.map(category => (
            <div key={category.id}>
              <h2>{category.name}</h2>
              <ul>
                {category.items.map(item => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('Hooks', () => {
    it('should parse useState hook', () => {
      const jsx = `
        function Counter() {
          const [count, setCount] = useState(0)
          return (
            <div>
              <p>Count: {count}</p>
              <button onClick={() => setCount(count + 1)}>Increment</button>
            </div>
          )
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse useEffect hook', () => {
      const jsx = `
        function Component() {
          useEffect(() => {
            console.log('mounted')
            return () => console.log('unmounted')
          }, [])
          return <div>Content</div>
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse multiple hooks', () => {
      const jsx = `
        function Form() {
          const [name, setName] = useState('')
          const [email, setEmail] = useState('')
          useEffect(() => {
            document.title = name
          }, [name])
          return (
            <form>
              <input value={name} onChange={(e) => setName(e.target.value)} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </form>
          )
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('Real-World Examples', () => {
    it('should parse todo list component', () => {
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
              <input value={input} onChange={(e) => setInput(e.target.value)} />
              <button onClick={addTodo}>Add</button>
              <ul>
                {todos.map(todo => (
                  <li key={todo.id} onClick={() => toggleTodo(todo.id)}>
                    <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
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
      expect(tree).toBeDefined()
    })

    it('should parse form component', () => {
      const jsx = `
        function LoginForm() {
          const [formData, setFormData] = useState({
            email: '',
            password: ''
          })
          const [errors, setErrors] = useState({})

          const handleChange = (e) => {
            setFormData({
              ...formData,
              [e.target.name]: e.target.value
            })
          }

          const handleSubmit = (e) => {
            e.preventDefault()
            if (!formData.email) {
              setErrors({ email: 'Email is required' })
              return
            }
            console.log('Submitting:', formData)
          }

          return (
            <form onSubmit={handleSubmit}>
              <div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <button type="submit">Login</button>
            </form>
          )
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse card component', () => {
      const jsx = `
        function Card({ title, description, image, onClick }) {
          return (
            <div className="card" onClick={onClick}>
              {image && <img src={image} alt={title} />}
              <div className="card-body">
                <h3 className="card-title">{title}</h3>
                {description && <p className="card-description">{description}</p>}
              </div>
            </div>
          )
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse modal component', () => {
      const jsx = `
        function Modal({ isOpen, onClose, children }) {
          if (!isOpen) return null

          return (
            <div className="modal-overlay" onClick={onClose}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                {children}
              </div>
            </div>
          )
        }
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('Comments', () => {
    it('should parse JSX with comments', () => {
      const jsx = `
        <div>
          {/* This is a comment */}
          <span>Content</span>
        </div>
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse multiline comments', () => {
      const jsx = `
        <div>
          {/*
            This is a
            multiline comment
          */}
          <span>Content</span>
        </div>
      `

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should parse empty element', () => {
      const jsx = '<div></div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse element with only whitespace', () => {
      const jsx = '<div>   </div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse deeply nested elements', () => {
      const jsx = '<a><b><c><d><e><f>Deep</f></e></d></c></b></a>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse element with numeric child', () => {
      const jsx = '<div>{42}</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse element with boolean child', () => {
      const jsx = '<div>{true}</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })

    it('should parse element with null child', () => {
      const jsx = '<div>{null}</div>'

      const tree = parse(jsx)
      expect(tree).toBeDefined()
    })
  })

  describe('API', () => {
    it('should support standalone parse function', () => {
      const tree = parse('<div>Test</div>')
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('jsx')
    })

    it('should support async parsing', async () => {
      const tree = await parseAsync('<div>Test</div>')
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('jsx')
    })

    it('should support createParser factory', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(JSXParser)

      const tree = parser.parse('<div>Test</div>')
      expect(tree).toBeDefined()
    })

    it('should support JSXParser class', () => {
      const parser = new JSXParser()
      const tree = parser.parse('<div>Test</div>')
      expect(tree).toBeDefined()

      const retrieved = parser.getTree()
      expect(retrieved).toBe(tree)
    })

    it('should support plugins', () => {
      let transformed = false

      const plugin = {
        name: 'test-plugin',
        transform(tree: Tree) {
          transformed = true
          return tree
        },
      }

      parse('<div>Test</div>', { plugins: [plugin] })
      expect(transformed).toBe(true)
    })

    it('should support async plugins', async () => {
      let transformed = false

      const plugin = {
        name: 'async-plugin',
        async transform(tree: Tree) {
          await new Promise((resolve) => setTimeout(resolve, 10))
          transformed = true
          return tree
        },
      }

      await parseAsync('<div>Test</div>', { plugins: [plugin] })
      expect(transformed).toBe(true)
    })

    it('should throw error when using async plugin with sync parse', () => {
      const asyncPlugin = {
        name: 'async-plugin',
        async transform(tree: Tree) {
          return tree
        },
      }

      expect(() => {
        parse('<div>Test</div>', { plugins: [asyncPlugin] })
      }).toThrow('Detected async plugins')
    })

    it('should support use() method for plugins', () => {
      let count = 0

      const plugin1 = {
        name: 'plugin1',
        transform(tree: Tree) {
          count++
          return tree
        },
      }

      const plugin2 = {
        name: 'plugin2',
        transform(tree: Tree) {
          count++
          return tree
        },
      }

      const parser = new JSXParser()
      parser.use(plugin1).use(plugin2)
      parser.parse('<div>Test</div>')

      expect(count).toBe(2)
    })
  })

  describe('Parser Options', () => {
    it('should parse with ECMAScript version option', () => {
      const jsx = '<div>Test</div>'

      const tree = parse(jsx, { ecmaVersion: 2020 })
      expect(tree).toBeDefined()
    })

    it('should parse as script', () => {
      const jsx = '<div>Test</div>'

      const tree = parse(jsx, { sourceType: 'script' })
      expect(tree).toBeDefined()
    })

    it('should allow return outside function', () => {
      const jsx = 'return <div>Test</div>'

      const tree = parse(jsx, { allowReturnOutsideFunction: true })
      expect(tree).toBeDefined()
    })
  })
})
