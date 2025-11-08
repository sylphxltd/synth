/**
 * Test data for benchmarks
 */

export const smallMarkdown = `# Hello World

This is a simple paragraph.

## Features

- Item 1
- Item 2
- Item 3
`

export const mediumMarkdown = `# Introduction to TypeScript

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.

## Why TypeScript?

TypeScript adds optional types to JavaScript that support tools for large-scale JavaScript applications.

### Type Safety

TypeScript helps catch errors at compile time:

- Type checking
- IntelliSense support
- Refactoring tools

### Better Development Experience

Modern IDEs provide:

1. Autocompletion
2. Type hints
3. Error detection

## Getting Started

First, install TypeScript:

\`\`\`bash
npm install -g typescript
\`\`\`

Then create a simple file:

\`\`\`typescript
function greet(name: string): string {
  return "Hello, " + name;
}

console.log(greet("World"));
\`\`\`

## Advanced Features

### Generics

Generics provide a way to make components work with any data type.

### Decorators

Decorators are a special kind of declaration that can be attached to a class.

### Async/Await

TypeScript supports async/await for asynchronous programming.

## Conclusion

TypeScript is a powerful tool for building robust applications.
`

export const largeMarkdown = `# Complete Guide to Modern Web Development

## Table of Contents

1. Introduction
2. Frontend Technologies
3. Backend Technologies
4. Database Systems
5. DevOps and Deployment
6. Best Practices
7. Conclusion

## 1. Introduction

Web development has evolved significantly over the past decade. Modern web applications are complex, scalable, and user-friendly.

### The Evolution of Web

From static HTML pages to dynamic single-page applications (SPAs), the web has come a long way.

#### Early Days

- Static HTML
- Basic CSS
- Simple JavaScript

#### Modern Era

- React, Vue, Angular
- TypeScript
- Build tools and bundlers

## 2. Frontend Technologies

### HTML5

HTML5 introduced many new features:

- Semantic elements
- Canvas and SVG
- Video and audio support
- Local storage
- Geolocation API

### CSS3

Modern CSS includes:

1. Flexbox layout
2. Grid layout
3. Custom properties (variables)
4. Animations and transitions
5. Media queries for responsive design

### JavaScript Frameworks

#### React

React is a JavaScript library for building user interfaces.

\`\`\`javascript
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

Key concepts:

- Components
- Props and State
- Hooks
- Context API
- Virtual DOM

#### Vue.js

Vue is a progressive framework for building user interfaces.

\`\`\`vue
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  data() {
    return { message: 'Hello Vue!' }
  }
}
</script>
\`\`\`

Features:

- Reactive data binding
- Component system
- Vue Router
- Vuex for state management

#### Angular

Angular is a platform for building mobile and desktop web applications.

### TypeScript

TypeScript adds static typing to JavaScript:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User {
  // Implementation
  return {
    id,
    name: "John Doe",
    email: "john@example.com"
  };
}
\`\`\`

Benefits:

- Type safety
- Better IDE support
- Enhanced refactoring
- Improved documentation

## 3. Backend Technologies

### Node.js

Node.js allows you to run JavaScript on the server.

\`\`\`javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
\`\`\`

### Python with Django/Flask

Python is popular for web backends:

\`\`\`python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, World!'
\`\`\`

### Ruby on Rails

Rails is a server-side web application framework written in Ruby.

## 4. Database Systems

### SQL Databases

#### PostgreSQL

PostgreSQL is a powerful, open-source object-relational database.

Features:

- ACID compliance
- Complex queries
- Full-text search
- JSON support

#### MySQL

MySQL is one of the most popular open-source databases.

### NoSQL Databases

#### MongoDB

MongoDB is a document-oriented database:

\`\`\`javascript
db.users.insertOne({
  name: "John Doe",
  email: "john@example.com",
  age: 30
});
\`\`\`

#### Redis

Redis is an in-memory data structure store:

- Caching
- Session storage
- Real-time analytics
- Message queuing

## 5. DevOps and Deployment

### Version Control

#### Git

Essential Git commands:

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

### Continuous Integration

#### GitHub Actions

Automate your workflow:

\`\`\`yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
\`\`\`

### Containerization

#### Docker

Docker containers package applications:

\`\`\`dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
\`\`\`

### Cloud Platforms

Popular platforms:

1. AWS (Amazon Web Services)
2. Google Cloud Platform
3. Microsoft Azure
4. Vercel
5. Netlify

## 6. Best Practices

### Code Quality

- Write clean, readable code
- Follow style guides
- Use linters and formatters
- Write meaningful comments

### Testing

Types of tests:

1. Unit tests
2. Integration tests
3. End-to-end tests
4. Performance tests

\`\`\`javascript
describe('Calculator', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
\`\`\`

### Security

Important considerations:

- Input validation
- Authentication and authorization
- HTTPS everywhere
- Regular security audits
- Dependency updates

### Performance

Optimization techniques:

- Code splitting
- Lazy loading
- Caching strategies
- Image optimization
- Minification and compression

## 7. Conclusion

Modern web development is a vast and ever-evolving field. Stay curious, keep learning, and build amazing things!

### Resources

- MDN Web Docs
- Stack Overflow
- GitHub
- Dev.to
- CSS-Tricks

### Next Steps

1. Choose a technology stack
2. Build a portfolio project
3. Contribute to open source
4. Join developer communities
5. Never stop learning

---

**Happy coding!** 🚀
`

// Generate even larger content
export function generateLargeMarkdown(size: 'xl' | 'xxl' | 'xxxl'): string {
  const multiplier = size === 'xl' ? 3 : size === 'xxl' ? 10 : 50
  return largeMarkdown.repeat(multiplier)
}
