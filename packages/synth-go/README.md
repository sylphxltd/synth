# @sylphx/synth-go

Go parser using Synth's universal AST. Conversion layer over tree-sitter-go.

## Features

- ✅ **Strategic Dependency** - Uses tree-sitter-go (battle-tested Go parser)
- 🚀 **Full Go Support** - All Go language features
- 🎯 **Universal AST** - Converts tree-sitter CST to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Battle-Tested** - tree-sitter powers VS Code, Atom, and many other editors

## Installation

```bash
npm install @sylphx/synth-go
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-go'

const go = `
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`

const tree = parse(go)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { GoParser, createParser, parse, parseAsync } from '@sylphx/synth-go'

// Standalone function (recommended)
const tree = parse('package main\n\nvar x = 42')

// Async parsing (for plugins)
const tree = await parseAsync('package main\n\nvar x = 42')

// Class instance
const parser = new GoParser()
const tree = parser.parse('package main\n\nvar x = 42')

// Factory function
const parser = createParser()
const tree = parser.parse('package main\n\nvar x = 42')
```

### Plugin System

```typescript
import { parse, type Tree } from '@sylphx/synth-go'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse(goSource, { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync(goSource, { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by converting tree-sitter's concrete syntax tree. Each node includes:

### Node Structure

```typescript
{
  type: 'FunctionDeclaration',  // Mapped from tree-sitter type
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    text: 'func main()...',     // Original source text
    isNamed: true,                // tree-sitter named node
    originalType: 'function_declaration'  // Original tree-sitter type
  }
}
```

## Supported Go Features

### Data Types
- ✅ Strings (raw, interpreted)
- ✅ Integers (int, int8, int16, int32, int64)
- ✅ Floats (float32, float64)
- ✅ Booleans (`true`, `false`)
- ✅ Arrays `[5]int{1, 2, 3, 4, 5}`
- ✅ Slices `[]int{1, 2, 3}`
- ✅ Maps `map[string]int{"a": 1}`
- ✅ Structs
- ✅ Pointers
- ✅ Interfaces

### Control Flow
- ✅ `if/else` statements
- ✅ `for` loops (traditional, range, infinite)
- ✅ `switch` statements (expression and type)
- ✅ `select` for channel operations
- ✅ `defer` statements
- ✅ `goto` and labels

### Functions
- ✅ Function declarations
- ✅ Parameters and return values
- ✅ Multiple return values
- ✅ Named return values
- ✅ Variadic functions `func sum(nums ...int)`
- ✅ Anonymous functions and closures
- ✅ Methods (value and pointer receivers)

### Types and Interfaces
- ✅ Type definitions `type MyInt int`
- ✅ Struct definitions
- ✅ Interface definitions
- ✅ Empty interface `interface{}`
- ✅ Type assertions
- ✅ Type switches
- ✅ Embedded types

### Concurrency
- ✅ Goroutines `go func()`
- ✅ Channels `make(chan int)`
- ✅ Channel operations `<-ch`, `ch <-`
- ✅ Buffered channels
- ✅ Select statements
- ✅ Mutex and WaitGroup

### Packages
- ✅ Package declaration `package main`
- ✅ Import statements
- ✅ Import aliases `import f "fmt"`
- ✅ Dot imports `import . "math"`
- ✅ Blank imports `import _ "image/png"`

### Error Handling
- ✅ Error returns
- ✅ `panic` and `recover`
- ✅ `defer` for cleanup

## Examples

### HTTP Server

```typescript
const go = `
package main

import (
    "fmt"
    "log"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
    http.HandleFunc("/", handler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
`

const tree = parse(go)
```

### Concurrent Worker Pool

```typescript
const go = `
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        fmt.Printf("Worker %d processing job %d\\n", id, job)
        time.Sleep(time.Second)
        results <- job * 2
    }
}

func main() {
    const numJobs = 5
    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)
    var wg sync.WaitGroup

    // Start workers
    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    // Send jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)

    // Wait and collect results
    go func() {
        wg.Wait()
        close(results)
    }()

    for result := range results {
        fmt.Println("Result:", result)
    }
}
`

const tree = parse(go)
```

### REST API with Struct Tags

```typescript
const go = `
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
)

type User struct {
    ID        int    \`json:"id"\`
    Name      string \`json:"name"\`
    Email     string \`json:"email"\`
    CreatedAt string \`json:"created_at"\`
}

type UserResponse struct {
    Success bool   \`json:"success"\`
    Data    User   \`json:"data,omitempty"\`
    Error   string \`json:"error,omitempty"\`
}

func getUser(w http.ResponseWriter, r *http.Request) {
    user := User{
        ID:        1,
        Name:      "John Doe",
        Email:     "john@example.com",
        CreatedAt: "2024-01-01T00:00:00Z",
    }

    response := UserResponse{
        Success: true,
        Data:    user,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

func main() {
    http.HandleFunc("/api/user", getUser)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
`

const tree = parse(go)
```

### Generic Data Structures (Go 1.18+)

```typescript
const go = `
package main

import "fmt"

type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
    var zero T
    if len(s.items) == 0 {
        return zero, false
    }
    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item, true
}

func main() {
    intStack := Stack[int]{}
    intStack.Push(1)
    intStack.Push(2)
    intStack.Push(3)

    if val, ok := intStack.Pop(); ok {
        fmt.Println("Popped:", val)
    }

    stringStack := Stack[string]{}
    stringStack.Push("hello")
    stringStack.Push("world")
}
`

const tree = parse(go)
```

### Database Operations

```typescript
const go = `
package main

import (
    "database/sql"
    "fmt"
    "log"

    _ "github.com/lib/pq"
)

type User struct {
    ID    int
    Name  string
    Email string
}

func getUsers(db *sql.DB) ([]User, error) {
    rows, err := db.Query("SELECT id, name, email FROM users")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var u User
        if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
            return nil, err
        }
        users = append(users, u)
    }

    return users, rows.Err()
}

func createUser(db *sql.DB, name, email string) (int, error) {
    var id int
    err := db.QueryRow(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
        name, email,
    ).Scan(&id)

    return id, err
}

func main() {
    connStr := "user=postgres dbname=mydb sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    users, err := getUsers(db)
    if err != nil {
        log.Fatal(err)
    }

    for _, user := range users {
        fmt.Printf("%d: %s (%s)\\n", user.ID, user.Name, user.Email)
    }
}
`

const tree = parse(go)
```

## Performance

Leverages tree-sitter's high-performance parsing:
- Fast incremental parsing
- Error recovery
- Battle-tested in production editors
- Efficient memory usage

## Development Philosophy

This package uses a **strategic dependency** approach:

- **Third-party parser:** tree-sitter-go (used by VS Code, Atom, GitHub)
- **Our conversion layer:** tree-sitter CST → Synth universal AST
- **Our value:** Universal format, cross-language tools, plugin system

### Why tree-sitter?

- ❌ Writing Go parser: 150+ hours, complex grammar, spec updates
- ✅ Using tree-sitter: Battle-tested, incremental parsing, error recovery
- **Our focus:** Universal AST format, transformations, cross-language operations

## Use Cases

- **Code analysis:** Analyze Go codebases
- **Linting:** Build custom Go linters
- **Documentation:** Extract comments and signatures
- **Code generation:** Transform Go AST
- **Migration tools:** Refactor Go code
- **Static analysis:** Complexity analysis, dependency graphs
- **Cross-language tools:** Analyze Go + JavaScript + Python together

## Comparison with go/ast

Unlike Go's built-in `go/ast` package, `@sylphx/synth-go`:

- Works in JavaScript/TypeScript environments
- Uses universal AST format compatible with other languages
- Provides plugin system for transformations
- Integrates with other Synth parsers
- Suitable for multi-language tooling

## License

MIT

---

**Note:** This package uses tree-sitter-go for parsing. See [tree-sitter-go](https://github.com/tree-sitter/tree-sitter-go) for parser details.
