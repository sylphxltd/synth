# @sylphx/synth-graphql

GraphQL parser using Synth's universal AST. Conversion layer over graphql-js (GraphQL reference implementation).

## Features

- ✅ **Reference Implementation** - Uses graphql-js (official GraphQL parser)
- 🚀 **Complete Support** - Queries, mutations, subscriptions, and SDL
- 🎯 **Universal AST** - Converts GraphQL AST to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Battle-Tested** - graphql-js is the reference implementation used everywhere

## Installation

```bash
npm install @sylphx/synth-graphql
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-graphql'

const gql = `
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}
`

const tree = parse(gql)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { GraphQLParser, createParser, parse, parseAsync } from '@sylphx/synth-graphql'

// Standalone function (recommended)
const tree = parse('{ user { name } }')

// Async parsing (for plugins)
const tree = await parseAsync('{ user { name } }')

// Class instance
const parser = new GraphQLParser()
const tree = parser.parse('{ user { name } }')

// Factory function
const parser = createParser()
const tree = parser.parse('{ user { name } }')
```

### Plugin System

```typescript
import { parse, type Tree } from '@sylphx/synth-graphql'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse(gqlSource, { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync(gqlSource, { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by converting graphql-js's AST. Each node includes:

### Node Structure

```typescript
{
  type: 'OperationDefinition',  // GraphQL node kind
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    gqlNode: { ... },  // Original graphql-js node
    text: 'query { ... }'  // Extracted text
  }
}
```

## Supported GraphQL Features

### Queries
- ✅ Basic queries
- ✅ Query with arguments
- ✅ Query with variables
- ✅ Multiple fields
- ✅ Nested selections
- ✅ Field aliases

### Mutations
- ✅ Simple mutations
- ✅ Mutations with variables
- ✅ Mutations with input objects
- ✅ Multiple mutations

### Subscriptions
- ✅ Basic subscriptions
- ✅ Subscriptions with arguments
- ✅ Real-time data subscriptions

### Fragments
- ✅ Inline fragments
- ✅ Named fragments
- ✅ Fragment spreads
- ✅ Nested fragments

### Directives
- ✅ `@include` directive
- ✅ `@skip` directive
- ✅ `@deprecated` directive
- ✅ Custom directives

### Schema Definition Language (SDL)
- ✅ Type definitions
- ✅ Interface definitions
- ✅ Union types
- ✅ Enum types
- ✅ Input types
- ✅ Schema definitions
- ✅ Extend types

### Type System
- ✅ Scalar types (String, Int, Float, Boolean, ID)
- ✅ Object types
- ✅ List types `[Type]`
- ✅ Non-null types `Type!`
- ✅ Custom scalar types

### Advanced Features
- ✅ Default values
- ✅ Variable definitions
- ✅ Input object values
- ✅ List values
- ✅ Null values
- ✅ Enum values
- ✅ Comments (`#`)
- ✅ Descriptions (`"""`)
- ✅ Block strings
- ✅ Escaped strings

## Examples

### Simple Query

```typescript
const gql = `
query {
  user {
    id
    name
    email
  }
}
`

const tree = parse(gql)
```

### Query with Variables

```typescript
const gql = `
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts {
      title
      content
    }
  }
}
`

const tree = parse(gql)
```

### Mutation

```typescript
const gql = `
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}
`

const tree = parse(gql)
```

### Subscription

```typescript
const gql = `
subscription OnMessageAdded($channelId: ID!) {
  messageAdded(channelId: $channelId) {
    id
    content
    user {
      name
    }
  }
}
`

const tree = parse(gql)
```

### Fragment Usage

```typescript
const gql = `
fragment UserFields on User {
  id
  name
  email
}

query {
  user {
    ...UserFields
    posts {
      title
    }
  }
}
`

const tree = parse(gql)
```

### Schema Definition

```typescript
const gql = `
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}

type Query {
  user(id: ID!): User
  posts(limit: Int): [Post!]!
}

type Mutation {
  createUser(name: String!, email: String!): User!
  createPost(title: String!, content: String!): Post!
}
`

const tree = parse(gql)
```

### Interface and Union

```typescript
const gql = `
interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  name: String!
}

type Post implements Node {
  id: ID!
  title: String!
}

union SearchResult = User | Post

type Query {
  search(query: String!): [SearchResult!]!
}
`

const tree = parse(gql)
```

### Directives

```typescript
const gql = `
query GetUser($withEmail: Boolean!) {
  user {
    name
    email @include(if: $withEmail)
    phone @skip(if: true)
  }
}
`

const tree = parse(gql)
```

### GitHub-like API

```typescript
const gql = `
type User {
  id: ID!
  login: String!
  name: String
  email: String
  avatarUrl: String
  repositories(first: Int, after: String): RepositoryConnection!
}

type Repository {
  id: ID!
  name: String!
  description: String
  stargazerCount: Int!
  forkCount: Int!
  owner: User!
}

type RepositoryConnection {
  edges: [RepositoryEdge!]!
  pageInfo: PageInfo!
}

type RepositoryEdge {
  node: Repository!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

type Query {
  user(login: String!): User
  repository(owner: String!, name: String!): Repository
}
`

const tree = parse(gql)
```

### E-commerce Query

```typescript
const gql = `
query GetProductDetails($id: ID!) {
  product(id: $id) {
    id
    name
    description
    price
    currency
    images {
      url
      alt
    }
    reviews(first: 5) {
      rating
      comment
      author {
        name
      }
    }
    relatedProducts(limit: 4) {
      id
      name
      price
    }
  }
}
`

const tree = parse(gql)
```

## Performance

Leverages graphql-js's proven performance:
- Fast parsing of queries and schemas
- Optimized for production use
- Used by all major GraphQL servers
- Efficient AST generation

## Development Philosophy

This package uses a **strategic dependency** approach:

- **Third-party parser:** graphql-js (GraphQL reference implementation)
- **Our conversion layer:** graphql-js AST → Synth universal AST
- **Our value:** Universal format, cross-language tools, plugin system

### Why graphql-js?

- ❌ Writing GraphQL parser: 100+ hours, complex spec, regular updates
- ✅ Using graphql-js: Reference implementation, spec-compliant, battle-tested
- **Our focus:** Universal AST format, transformations, cross-language operations

## Use Cases

- **Schema analysis:** Analyze GraphQL schemas
- **Query optimization:** Optimize GraphQL queries
- **Schema validation:** Validate schema definitions
- **Documentation generation:** Extract schema documentation
- **Code generation:** Generate types from schemas
- **Schema stitching:** Combine multiple schemas
- **Query complexity analysis:** Calculate query complexity
- **Cross-language tools:** Analyze GraphQL + JavaScript + Python together

## Parser Options

```typescript
interface GraphQLParseOptions {
  // Allow legacy SDL syntax for implements interfaces
  allowLegacySDLImplementsInterfaces?: boolean

  // Allow legacy SDL empty fields
  allowLegacySDLEmptyFields?: boolean

  // Enable experimental fragment variables
  experimentalFragmentVariables?: boolean

  // Plugin system
  plugins?: Plugin[]
}
```

## License

MIT

---

**Note:** This package uses graphql-js for parsing. See [graphql-js](https://github.com/graphql/graphql-js) for parser details.
