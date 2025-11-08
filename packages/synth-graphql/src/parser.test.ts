import { describe, it, expect } from 'bun:test'
import { parse, parseAsync, createParser, GraphQLParser } from './parser.js'
import type { Tree } from '@sylphx/synth'

describe('GraphQLParser', () => {
  describe('Basic Queries', () => {
    it('should parse simple query', () => {
      const gql = `query {
  user {
    id
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('graphql')
      expect(tree.meta.source).toBe(gql)
      expect(Object.keys(tree.nodes).length).toBeGreaterThan(1)
    })

    it('should parse query with arguments', () => {
      const gql = `query {
  user(id: "123") {
    name
    email
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse query with variables', () => {
      const gql = `query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse query with multiple fields', () => {
      const gql = `query {
  user {
    id
    name
    email
    age
    createdAt
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Fragments', () => {
    it('should parse inline fragment', () => {
      const gql = `query {
  search {
    ... on User {
      name
      email
    }
    ... on Post {
      title
      content
    }
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse named fragment', () => {
      const gql = `fragment UserFields on User {
  id
  name
  email
}

query {
  user {
    ...UserFields
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse nested fragments', () => {
      const gql = `fragment ContactInfo on User {
  email
  phone
}

fragment UserDetails on User {
  id
  name
  ...ContactInfo
}

query {
  user {
    ...UserDetails
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Mutations', () => {
    it('should parse simple mutation', () => {
      const gql = `mutation {
  createUser(name: "John", email: "john@example.com") {
    id
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse mutation with variables', () => {
      const gql = `mutation CreateUser($name: String!, $email: String!) {
  createUser(name: $name, email: $email) {
    id
    name
    email
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse mutation with input object', () => {
      const gql = `mutation {
  createUser(input: {
    name: "John"
    email: "john@example.com"
    age: 30
  }) {
    id
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Subscriptions', () => {
    it('should parse subscription', () => {
      const gql = `subscription {
  messageAdded {
    id
    content
    user {
      name
    }
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse subscription with arguments', () => {
      const gql = `subscription OnMessageAdded($channelId: ID!) {
  messageAdded(channelId: $channelId) {
    id
    content
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Directives', () => {
    it('should parse @include directive', () => {
      const gql = `query GetUser($withEmail: Boolean!) {
  user {
    name
    email @include(if: $withEmail)
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse @skip directive', () => {
      const gql = `query GetUser($skipAge: Boolean!) {
  user {
    name
    age @skip(if: $skipAge)
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse custom directives', () => {
      const gql = `query {
  user @deprecated(reason: "Use users instead") {
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Aliases', () => {
    it('should parse field alias', () => {
      const gql = `query {
  user {
    userId: id
    fullName: name
    emailAddress: email
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse multiple queries with aliases', () => {
      const gql = `query {
  admin: user(id: "1") {
    name
  }
  guest: user(id: "2") {
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Schema Definition Language (SDL)', () => {
    it('should parse type definition', () => {
      const gql = `type User {
  id: ID!
  name: String!
  email: String
  age: Int
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse interface', () => {
      const gql = `interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  name: String!
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse union type', () => {
      const gql = `union SearchResult = User | Post | Comment

type User {
  id: ID!
  name: String!
}

type Post {
  id: ID!
  title: String!
}

type Comment {
  id: ID!
  content: String!
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse enum', () => {
      const gql = `enum UserRole {
  ADMIN
  USER
  GUEST
}

type User {
  id: ID!
  role: UserRole!
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse input type', () => {
      const gql = `input CreateUserInput {
  name: String!
  email: String!
  age: Int
}

type Mutation {
  createUser(input: CreateUserInput!): User
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse schema definition', () => {
      const gql = `schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

type Query {
  user(id: ID!): User
}

type Mutation {
  createUser(name: String!): User
}

type Subscription {
  userCreated: User
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Field Arguments', () => {
    it('should parse field with single argument', () => {
      const gql = `query {
  user(id: "123") {
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse field with multiple arguments', () => {
      const gql = `query {
  users(first: 10, offset: 20, orderBy: "createdAt") {
    id
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse field with object argument', () => {
      const gql = `query {
  users(filter: { age: { gt: 18 }, active: true }) {
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse field with array argument', () => {
      const gql = `query {
  users(ids: ["1", "2", "3"]) {
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Default Values', () => {
    it('should parse variable with default value', () => {
      const gql = `query GetUsers($limit: Int = 10) {
  users(first: $limit) {
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse field argument with default value', () => {
      const gql = `type Query {
  users(limit: Int = 10): [User!]!
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Comments', () => {
    it('should parse schema with comments', () => {
      const gql = `# User type definition
type User {
  # Unique identifier
  id: ID!
  # User's full name
  name: String!
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse query with comments', () => {
      const gql = `# Get user by ID
query GetUser($id: ID!) {
  # Fetch user
  user(id: $id) {
    name
    email
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Descriptions', () => {
    it('should parse type with description', () => {
      const gql = `"""
User account information
"""
type User {
  """
  Unique identifier for the user
  """
  id: ID!
  name: String!
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse field with description', () => {
      const gql = `type Query {
  """
  Get a user by their unique ID
  """
  user(id: ID!): User
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Real-World Examples', () => {
    it('should parse GitHub-like API schema', () => {
      const gql = `type User {
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
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse e-commerce query', () => {
      const gql = `query GetProductDetails($id: ID!) {
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
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse social media schema', () => {
      const gql = `type User {
  id: ID!
  username: String!
  displayName: String
  bio: String
  followers: [User!]!
  following: [User!]!
  posts: [Post!]!
}

type Post {
  id: ID!
  content: String!
  author: User!
  createdAt: String!
  likes: [User!]!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  createdAt: String!
}

type Mutation {
  createPost(content: String!): Post!
  likePost(postId: ID!): Post!
  addComment(postId: ID!, content: String!): Comment!
}

type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse complex mutation with nested input', () => {
      const gql = `mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    total
    status
    items {
      product {
        id
        name
        price
      }
      quantity
      subtotal
    }
    shippingAddress {
      street
      city
      country
      postalCode
    }
    payment {
      method
      status
    }
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should parse query with escaped strings', () => {
      const gql = `query {
  user {
    bio(format: "It's a \\"quoted\\" string")
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse query with block strings', () => {
      const gql = `mutation {
  createPost(content: """
    This is a
    multi-line
    string
  """) {
    id
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse query with null values', () => {
      const gql = `query {
  user(filter: { age: null }) {
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse query with boolean values', () => {
      const gql = `query {
  users(active: true, admin: false) {
    name
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })

    it('should parse query with numeric values', () => {
      const gql = `query {
  products(minPrice: 10.99, maxPrice: 99.99, limit: 20) {
    name
    price
  }
}`

      const tree = parse(gql)
      expect(tree).toBeDefined()
    })
  })

  describe('API', () => {
    it('should support standalone parse function', () => {
      const tree = parse('{ user { name } }')
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('graphql')
    })

    it('should support async parsing', async () => {
      const tree = await parseAsync('{ user { name } }')
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('graphql')
    })

    it('should support createParser factory', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(GraphQLParser)

      const tree = parser.parse('{ user { name } }')
      expect(tree).toBeDefined()
    })

    it('should support GraphQLParser class', () => {
      const parser = new GraphQLParser()
      const tree = parser.parse('{ user { name } }')
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

      parse('{ user { name } }', { plugins: [plugin] })
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

      await parseAsync('{ user { name } }', { plugins: [plugin] })
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
        parse('{ user { name } }', { plugins: [asyncPlugin] })
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

      const parser = new GraphQLParser()
      parser.use(plugin1).use(plugin2)
      parser.parse('{ user { name } }')

      expect(count).toBe(2)
    })
  })
})
