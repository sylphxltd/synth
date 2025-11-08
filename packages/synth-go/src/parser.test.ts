/**
 * Go Parser Tests
 */

import { describe, it, expect } from 'vitest'
import { parse, parseAsync, createParser, GoParser } from './parser.js'

describe('GoParser', () => {
  describe('Basic Parsing', () => {
    it('should parse empty Go', () => {
      const tree = parse('')
      expect(tree.meta.language).toBe('go')
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse simple variable declaration', () => {
      const go = 'package main\n\nvar x = 42'
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes[tree.root]).toBeDefined()

      const rootChildren = tree.nodes[tree.root]!.children
      expect(rootChildren.length).toBeGreaterThan(0)
    })

    it('should parse function definition', () => {
      const go = `
package main

func main() {
    println("Hello, World!")
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const funcNode = tree.nodes.find(n => n.type === 'FunctionDeclaration')
      expect(funcNode).toBeDefined()
    })

    it('should parse struct definition', () => {
      const go = `
package main

type Person struct {
    Name string
    Age  int
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const structNode = tree.nodes.find(n => n.type?.includes('Struct') || n.type?.includes('Type'))
      expect(structNode).toBeDefined()
    })
  })

  describe('Data Types', () => {
    it('should parse string literals', () => {
      const go = 'package main\n\nvar text = "Hello, World!"'
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const stringNode = tree.nodes.find(n => n.type?.includes('String') || n.data?.text?.includes('"'))
      expect(stringNode).toBeDefined()
    })

    it('should parse integer literals', () => {
      const go = 'package main\n\nvar num = 42'
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should parse float literals', () => {
      const go = 'package main\n\nvar pi = 3.14159'
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should parse boolean literals', () => {
      const go = `
package main

var flag1 = true
var flag2 = false
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should parse slice literals', () => {
      const go = 'package main\n\nvar items = []int{1, 2, 3, 4, 5}'
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should parse map literals', () => {
      const go = 'package main\n\nvar data = map[string]int{"one": 1, "two": 2}'
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('Control Flow', () => {
    it('should parse if statement', () => {
      const go = `
package main

func main() {
    if x > 0 {
        println("positive")
    } else if x < 0 {
        println("negative")
    } else {
        println("zero")
    }
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const ifNode = tree.nodes.find(n => n.type?.includes('If'))
      expect(ifNode).toBeDefined()
    })

    it('should parse for loop', () => {
      const go = `
package main

func main() {
    for i := 0; i < 10; i++ {
        println(i)
    }
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const forNode = tree.nodes.find(n => n.type?.includes('For'))
      expect(forNode).toBeDefined()
    })

    it('should parse range loop', () => {
      const go = `
package main

func main() {
    items := []int{1, 2, 3}
    for i, v := range items {
        println(i, v)
    }
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const rangeNode = tree.nodes.find(n => n.type?.includes('Range') || n.type?.includes('For'))
      expect(rangeNode).toBeDefined()
    })

    it('should parse switch statement', () => {
      const go = `
package main

func main() {
    switch day {
    case "Monday":
        println("Start of week")
    case "Friday":
        println("End of week")
    default:
        println("Mid week")
    }
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const switchNode = tree.nodes.find(n => n.type?.includes('Switch'))
      expect(switchNode).toBeDefined()
    })
  })

  describe('Functions', () => {
    it('should parse function with parameters', () => {
      const go = `
package main

func greet(name string, greeting string) string {
    return greeting + ", " + name + "!"
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const funcNode = tree.nodes.find(n => n.type === 'FunctionDeclaration')
      expect(funcNode).toBeDefined()
    })

    it('should parse function with multiple return values', () => {
      const go = `
package main

func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const funcNode = tree.nodes.find(n => n.type === 'FunctionDeclaration')
      expect(funcNode).toBeDefined()
    })

    it('should parse function with named return values', () => {
      const go = `
package main

func split(sum int) (x, y int) {
    x = sum * 4 / 9
    y = sum - x
    return
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const funcNode = tree.nodes.find(n => n.type === 'FunctionDeclaration')
      expect(funcNode).toBeDefined()
    })

    it('should parse variadic functions', () => {
      const go = `
package main

func sum(nums ...int) int {
    total := 0
    for _, num := range nums {
        total += num
    }
    return total
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const funcNode = tree.nodes.find(n => n.type === 'FunctionDeclaration')
      expect(funcNode).toBeDefined()
    })
  })

  describe('Structs and Methods', () => {
    it('should parse struct with methods', () => {
      const go = `
package main

type Rectangle struct {
    Width  float64
    Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const methodNode = tree.nodes.find(n => n.type?.includes('Method') || n.type === 'FunctionDeclaration')
      expect(methodNode).toBeDefined()
    })

    it('should parse pointer receivers', () => {
      const go = `
package main

type Counter struct {
    count int
}

func (c *Counter) Increment() {
    c.count++
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const methodNode = tree.nodes.find(n => n.type === 'FunctionDeclaration' || n.type?.includes('Method'))
      expect(methodNode).toBeDefined()
    })

    it('should parse embedded structs', () => {
      const go = `
package main

type Person struct {
    Name string
    Age  int
}

type Employee struct {
    Person
    Salary int
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(10)
    })
  })

  describe('Interfaces', () => {
    it('should parse interface definition', () => {
      const go = `
package main

type Shape interface {
    Area() float64
    Perimeter() float64
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const interfaceNode = tree.nodes.find(n => n.type?.includes('Interface'))
      expect(interfaceNode).toBeDefined()
    })

    it('should parse empty interface', () => {
      const go = `
package main

func printAnything(v interface{}) {
    println(v)
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('Goroutines and Channels', () => {
    it('should parse goroutine', () => {
      const go = `
package main

func main() {
    go doWork()
}

func doWork() {
    println("Working...")
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const goNode = tree.nodes.find(n => n.type?.includes('Go') && n.data?.text?.includes('go'))
      expect(goNode).toBeDefined()
    })

    it('should parse channel operations', () => {
      const go = `
package main

func main() {
    ch := make(chan int)
    ch <- 42
    value := <-ch
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(10)
    })

    it('should parse select statement', () => {
      const go = `
package main

func main() {
    select {
    case msg := <-ch1:
        println(msg)
    case msg := <-ch2:
        println(msg)
    default:
        println("no message")
    }
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const selectNode = tree.nodes.find(n => n.type?.includes('Select'))
      expect(selectNode).toBeDefined()
    })
  })

  describe('Packages and Imports', () => {
    it('should parse package declaration', () => {
      const go = 'package main'
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const packageNode = tree.nodes.find(n => n.type?.includes('Package'))
      expect(packageNode).toBeDefined()
    })

    it('should parse import statement', () => {
      const go = `
package main

import "fmt"
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const importNode = tree.nodes.find(n => n.type?.includes('Import'))
      expect(importNode).toBeDefined()
    })

    it('should parse multiple imports', () => {
      const go = `
package main

import (
    "fmt"
    "os"
    "time"
)
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const importNodes = tree.nodes.filter(n => n.type?.includes('Import'))
      expect(importNodes.length).toBeGreaterThan(0)
    })

    it('should parse import with alias', () => {
      const go = `
package main

import (
    f "fmt"
    . "math"
)
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('Real-World Examples', () => {
    it('should parse HTTP server', () => {
      const go = `
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
    http.HandleFunc("/", handler)
    http.ListenAndServe(":8080", nil)
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(20)
    })

    it('should parse concurrent worker pool', () => {
      const go = `
package main

import (
    "fmt"
    "sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        fmt.Printf("Worker %d processing job %d\\n", id, job)
        results <- job * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)
    var wg sync.WaitGroup

    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    for j := 1; j <= 5; j++ {
        jobs <- j
    }
    close(jobs)

    wg.Wait()
    close(results)
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(30)
    })

    it('should parse JSON handling', () => {
      const go = `
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    Name  string \`json:"name"\`
    Email string \`json:"email"\`
    Age   int    \`json:"age"\`
}

func main() {
    user := User{
        Name:  "John Doe",
        Email: "john@example.com",
        Age:   30,
    }

    jsonData, err := json.Marshal(user)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(string(jsonData))
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(25)
    })
  })

  describe('API', () => {
    it('should work with createParser factory', () => {
      const parser = createParser()
      const tree = parser.parse('package main\n\nvar x = 42')

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should work with GoParser class', () => {
      const parser = new GoParser()
      const tree = parser.parse('package main\n\nvar x = 42')

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should work with standalone parse function', () => {
      const tree = parse('package main\n\nvar x = 42')

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should work with parseAsync function', async () => {
      const tree = await parseAsync('package main\n\nvar x = 42')

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should support getTree method', () => {
      const parser = new GoParser()
      const tree1 = parser.parse('package main\n\nvar x = 42')
      const tree2 = parser.getTree()

      expect(tree2).toBe(tree1)
    })

    it('should support plugin system with use()', () => {
      const parser = new GoParser()

      const plugin = {
        name: 'test-plugin',
        transform: (tree: any) => {
          tree.metadata = { processed: true }
          return tree
        },
      }

      parser.use(plugin)
      const tree = parser.parse('package main\n\nvar x = 42')

      expect(tree.metadata).toEqual({ processed: true })
    })

    it('should apply plugins from options', () => {
      const plugin = {
        name: 'options-plugin',
        transform: (tree: any) => {
          tree.metadata = { fromOptions: true }
          return tree
        },
      }

      const tree = parse('package main\n\nvar x = 42', { plugins: [plugin] })

      expect(tree.metadata).toEqual({ fromOptions: true })
    })

    it('should support async plugins with parseAsync', async () => {
      const asyncPlugin = {
        name: 'async-plugin',
        transform: async (tree: any) => {
          await new Promise((resolve) => setTimeout(resolve, 1))
          tree.metadata = { async: true }
          return tree
        },
      }

      const tree = await parseAsync('package main\n\nvar x = 42', { plugins: [asyncPlugin] })

      expect(tree.metadata).toEqual({ async: true })
    })

    it('should throw error if async plugin used in sync parse', () => {
      const asyncPlugin = {
        name: 'async-plugin',
        transform: async (tree: any) => tree,
      }

      expect(() => {
        parse('package main\n\nvar x = 42', { plugins: [asyncPlugin] })
      }).toThrow(/async plugins/i)
    })
  })

  describe('Edge Cases', () => {
    it('should handle comments', () => {
      const go = `
package main

// This is a comment
var x = 42  // Inline comment

/*
Multi-line
comment
*/
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(0)
    })

    it('should handle defer', () => {
      const go = `
package main

func main() {
    defer println("deferred")
    println("immediate")
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')

      const deferNode = tree.nodes.find(n => n.type?.includes('Defer') || n.data?.text?.includes('defer'))
      expect(deferNode).toBeDefined()
    })

    it('should handle panic and recover', () => {
      const go = `
package main

func safeDivide(a, b int) (result int) {
    defer func() {
        if r := recover(); r != nil {
            result = 0
        }
    }()
    return a / b
}
      `
      const tree = parse(go)

      expect(tree.meta.language).toBe('go')
      expect(tree.nodes.length).toBeGreaterThan(10)
    })
  })
})
