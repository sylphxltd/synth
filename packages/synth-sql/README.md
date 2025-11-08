# @sylphx/synth-sql

SQL parser using Synth's universal AST. Conversion layer over node-sql-parser.

## Features

- ✅ **Strategic Dependency** - Uses node-sql-parser (battle-tested SQL parser)
- 🚀 **Multiple Dialects** - MySQL, PostgreSQL, SQLite, MariaDB, Transact-SQL
- 🎯 **Universal AST** - Converts SQL AST to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Production Ready** - node-sql-parser used in enterprise applications

## Installation

```bash
npm install @sylphx/synth-sql
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-sql'

const sql = `
SELECT id, name, email
FROM users
WHERE age > 18
ORDER BY created_at DESC;
`

const tree = parse(sql)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { SQLParser, createParser, parse, parseAsync } from '@sylphx/synth-sql'

// Standalone function (recommended)
const tree = parse('SELECT * FROM users;')

// With dialect option
const tree = parse('SELECT * FROM users;', { dialect: 'postgresql' })

// Async parsing (for plugins)
const tree = await parseAsync('SELECT * FROM users;')

// Class instance
const parser = new SQLParser()
const tree = parser.parse('SELECT * FROM users;')

// Factory function
const parser = createParser()
const tree = parser.parse('SELECT * FROM users;')
```

### Dialect Support

```typescript
import { parse } from '@sylphx/synth-sql'

// MySQL (default)
const tree = parse(sql, { dialect: 'mysql' })

// PostgreSQL
const tree = parse(sql, { dialect: 'postgresql' })

// SQLite
const tree = parse(sql, { dialect: 'sqlite' })

// MariaDB
const tree = parse(sql, { dialect: 'mariadb' })

// Transact-SQL (SQL Server)
const tree = parse(sql, { dialect: 'transactsql' })
```

### Plugin System

```typescript
import { parse, type Tree } from '@sylphx/synth-sql'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse(sqlSource, { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync(sqlSource, { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by converting node-sql-parser's AST. Each node includes:

### Node Structure

```typescript
{
  type: 'Select',  // Mapped from node-sql-parser type
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    sqlNode: { ... },  // Original node-sql-parser node
    text: 'SELECT ...'  // Extracted text
  }
}
```

## Supported SQL Features

### Basic Queries
- ✅ SELECT statements
- ✅ INSERT statements (single and multiple values)
- ✅ UPDATE statements
- ✅ DELETE statements
- ✅ WHERE clauses
- ✅ ORDER BY, LIMIT, OFFSET
- ✅ DISTINCT

### Joins
- ✅ INNER JOIN
- ✅ LEFT JOIN / LEFT OUTER JOIN
- ✅ RIGHT JOIN / RIGHT OUTER JOIN
- ✅ FULL JOIN / FULL OUTER JOIN
- ✅ CROSS JOIN
- ✅ Multiple joins

### Aggregations
- ✅ COUNT, SUM, AVG, MIN, MAX
- ✅ GROUP BY
- ✅ HAVING clauses

### Subqueries
- ✅ Subqueries in WHERE clause
- ✅ Subqueries in FROM clause
- ✅ Correlated subqueries
- ✅ IN, EXISTS operators

### Common Table Expressions (CTEs)
- ✅ Simple CTEs (WITH clause)
- ✅ Multiple CTEs
- ✅ Recursive CTEs (WITH RECURSIVE)

### Window Functions
- ✅ ROW_NUMBER()
- ✅ RANK(), DENSE_RANK()
- ✅ PARTITION BY
- ✅ ORDER BY in window functions
- ✅ Aggregate functions with OVER

### DDL Statements
- ✅ CREATE TABLE
- ✅ ALTER TABLE
- ✅ DROP TABLE
- ✅ CREATE INDEX
- ✅ PRIMARY KEY, FOREIGN KEY constraints
- ✅ UNIQUE, NOT NULL constraints
- ✅ DEFAULT values

### Advanced Features
- ✅ CASE expressions
- ✅ UNION, UNION ALL
- ✅ INTERSECT
- ✅ EXCEPT
- ✅ NULL handling (IS NULL, IS NOT NULL, COALESCE)
- ✅ String functions
- ✅ Date/time functions
- ✅ Mathematical operations

### Transactions
- ✅ BEGIN TRANSACTION
- ✅ COMMIT
- ✅ ROLLBACK

### Views
- ✅ CREATE VIEW
- ✅ DROP VIEW

## Examples

### Simple SELECT Query

```typescript
const sql = `
SELECT u.id, u.name, u.email
FROM users u
WHERE u.active = true
  AND u.age > 18
ORDER BY u.created_at DESC
LIMIT 10;
`

const tree = parse(sql)
```

### JOIN with Aggregation

```typescript
const sql = `
SELECT
  u.name,
  COUNT(o.id) as order_count,
  SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC;
`

const tree = parse(sql)
```

### Common Table Expression (CTE)

```typescript
const sql = `
WITH active_users AS (
  SELECT * FROM users WHERE active = true
),
recent_orders AS (
  SELECT * FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
)
SELECT u.name, COUNT(o.id) as order_count
FROM active_users u
LEFT JOIN recent_orders o ON u.id = o.user_id
GROUP BY u.name;
`

const tree = parse(sql)
```

### Window Functions

```typescript
const sql = `
SELECT
  name,
  department,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg,
  ROW_NUMBER() OVER (ORDER BY salary DESC) as salary_rank
FROM employees;
`

const tree = parse(sql)
```

### Complex Analytics Query

```typescript
const sql = `
WITH monthly_sales AS (
  SELECT
    DATE_TRUNC('month', created_at) as month,
    product_id,
    SUM(quantity) as total_quantity,
    SUM(amount) as total_amount
  FROM orders
  WHERE created_at >= '2024-01-01'
  GROUP BY DATE_TRUNC('month', created_at), product_id
)
SELECT
  p.name as product_name,
  ms.month,
  ms.total_quantity,
  ms.total_amount,
  RANK() OVER (
    PARTITION BY ms.month
    ORDER BY ms.total_amount DESC
  ) as sales_rank
FROM monthly_sales ms
INNER JOIN products p ON ms.product_id = p.id
ORDER BY ms.month, sales_rank;
`

const tree = parse(sql, { dialect: 'postgresql' })
```

### CREATE TABLE with Constraints

```typescript
const sql = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  age INTEGER CHECK (age >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

const tree = parse(sql)
```

### INSERT Multiple Rows

```typescript
const sql = `
INSERT INTO users (name, email, age)
VALUES
  ('Alice', 'alice@example.com', 30),
  ('Bob', 'bob@example.com', 25),
  ('Charlie', 'charlie@example.com', 35);
`

const tree = parse(sql)
```

### UPDATE with JOIN

```typescript
const sql = `
UPDATE users u
INNER JOIN user_stats s ON u.id = s.user_id
SET u.total_orders = s.order_count
WHERE s.order_count > 0;
`

const tree = parse(sql, { dialect: 'mysql' })
```

## Performance

Leverages node-sql-parser's proven performance:
- Fast parsing of complex queries
- Support for large SQL scripts
- Production-tested in enterprise applications
- Efficient AST generation

## Development Philosophy

This package uses a **strategic dependency** approach:

- **Third-party parser:** node-sql-parser (widely used, multi-dialect support)
- **Our conversion layer:** node-sql-parser AST → Synth universal AST
- **Our value:** Universal format, cross-language tools, plugin system

### Why node-sql-parser?

- ❌ Writing SQL parser: 300+ hours, complex grammar, multiple dialects
- ✅ Using node-sql-parser: Battle-tested, multi-dialect, actively maintained
- **Our focus:** Universal AST format, transformations, cross-language operations

## Use Cases

- **Query analysis:** Analyze SQL queries for optimization
- **Schema extraction:** Extract table and column information
- **Query transformation:** Rewrite queries programmatically
- **SQL linting:** Build custom SQL linters
- **Documentation:** Extract query documentation
- **Migration tools:** Convert between SQL dialects
- **Static analysis:** Detect problematic patterns
- **Cross-language tools:** Analyze SQL + JavaScript + Python together

## Dialect Differences

Different SQL dialects have varying syntax:

```typescript
// MySQL: LIMIT/OFFSET
parse('SELECT * FROM users LIMIT 10 OFFSET 5', { dialect: 'mysql' })

// PostgreSQL: LIMIT/OFFSET or FETCH
parse('SELECT * FROM users LIMIT 10 OFFSET 5', { dialect: 'postgresql' })

// SQL Server: TOP/OFFSET FETCH
parse('SELECT TOP 10 * FROM users', { dialect: 'transactsql' })
```

Always specify the correct dialect for best results.

## License

MIT

---

**Note:** This package uses node-sql-parser for parsing. See [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser) for parser details.
