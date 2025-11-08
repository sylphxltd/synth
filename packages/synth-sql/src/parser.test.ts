import { describe, it, expect } from 'bun:test'
import { parse, parseAsync, createParser, SQLParser } from './parser.js'
import type { Tree } from '@sylphx/synth'

describe('SQLParser', () => {
  describe('Basic Queries', () => {
    it('should parse SELECT query', () => {
      const sql = 'SELECT * FROM users;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('sql')
      expect(tree.meta.source).toBe(sql)
      expect(Object.keys(tree.nodes).length).toBeGreaterThan(1)
    })

    it('should parse SELECT with WHERE clause', () => {
      const sql = `SELECT id, name, email
                   FROM users
                   WHERE age > 18 AND active = true;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse INSERT statement', () => {
      const sql = `INSERT INTO users (name, email, age)
                   VALUES ('John Doe', 'john@example.com', 30);`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse multiple value INSERT', () => {
      const sql = `INSERT INTO users (name, email)
                   VALUES
                     ('Alice', 'alice@example.com'),
                     ('Bob', 'bob@example.com'),
                     ('Charlie', 'charlie@example.com');`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse UPDATE statement', () => {
      const sql = `UPDATE users
                   SET email = 'newemail@example.com', age = 31
                   WHERE id = 1;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse DELETE statement', () => {
      const sql = 'DELETE FROM users WHERE age < 18;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Joins', () => {
    it('should parse INNER JOIN', () => {
      const sql = `SELECT u.name, o.order_id
                   FROM users u
                   INNER JOIN orders o ON u.id = o.user_id;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse LEFT JOIN', () => {
      const sql = `SELECT u.name, o.order_id
                   FROM users u
                   LEFT JOIN orders o ON u.id = o.user_id;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse multiple JOINs', () => {
      const sql = `SELECT u.name, o.order_id, p.product_name
                   FROM users u
                   INNER JOIN orders o ON u.id = o.user_id
                   INNER JOIN products p ON o.product_id = p.id;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse CROSS JOIN', () => {
      const sql = `SELECT *
                   FROM colors
                   CROSS JOIN sizes;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Aggregations', () => {
    it('should parse COUNT', () => {
      const sql = 'SELECT COUNT(*) FROM users;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse GROUP BY with aggregations', () => {
      const sql = `SELECT country, COUNT(*) as user_count, AVG(age) as avg_age
                   FROM users
                   GROUP BY country;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse HAVING clause', () => {
      const sql = `SELECT country, COUNT(*) as user_count
                   FROM users
                   GROUP BY country
                   HAVING COUNT(*) > 10;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse multiple aggregation functions', () => {
      const sql = `SELECT
                     COUNT(*) as total,
                     SUM(amount) as total_amount,
                     AVG(amount) as avg_amount,
                     MIN(amount) as min_amount,
                     MAX(amount) as max_amount
                   FROM orders;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Subqueries', () => {
    it('should parse subquery in WHERE clause', () => {
      const sql = `SELECT name
                   FROM users
                   WHERE id IN (SELECT user_id FROM orders WHERE total > 100);`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse subquery in FROM clause', () => {
      const sql = `SELECT avg_age
                   FROM (
                     SELECT AVG(age) as avg_age
                     FROM users
                     GROUP BY country
                   ) as country_averages;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse correlated subquery', () => {
      const sql = `SELECT u.name, u.salary
                   FROM employees u
                   WHERE u.salary > (
                     SELECT AVG(salary)
                     FROM employees
                     WHERE department_id = u.department_id
                   );`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Common Table Expressions (CTEs)', () => {
    it('should parse simple CTE', () => {
      const sql = `WITH active_users AS (
                     SELECT * FROM users WHERE active = true
                   )
                   SELECT * FROM active_users;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse multiple CTEs', () => {
      const sql = `WITH
                     active_users AS (
                       SELECT * FROM users WHERE active = true
                     ),
                     recent_orders AS (
                       SELECT * FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
                     )
                   SELECT u.name, COUNT(o.id) as order_count
                   FROM active_users u
                   LEFT JOIN recent_orders o ON u.id = o.user_id
                   GROUP BY u.name;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse recursive CTE', () => {
      const sql = `WITH RECURSIVE employee_hierarchy AS (
                     SELECT id, name, manager_id, 1 as level
                     FROM employees
                     WHERE manager_id IS NULL

                     UNION ALL

                     SELECT e.id, e.name, e.manager_id, eh.level + 1
                     FROM employees e
                     INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
                   )
                   SELECT * FROM employee_hierarchy;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Window Functions', () => {
    it('should parse ROW_NUMBER', () => {
      const sql = `SELECT
                     name,
                     salary,
                     ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num
                   FROM employees;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse PARTITION BY', () => {
      const sql = `SELECT
                     name,
                     department,
                     salary,
                     AVG(salary) OVER (PARTITION BY department) as dept_avg
                   FROM employees;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse RANK and DENSE_RANK', () => {
      const sql = `SELECT
                     name,
                     score,
                     RANK() OVER (ORDER BY score DESC) as score_rank,
                     DENSE_RANK() OVER (ORDER BY score DESC) as dense_rank
                   FROM students;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('DDL Statements', () => {
    it('should parse CREATE TABLE', () => {
      const sql = `CREATE TABLE users (
                     id INTEGER PRIMARY KEY,
                     name VARCHAR(100) NOT NULL,
                     email VARCHAR(255) UNIQUE,
                     age INTEGER,
                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                   );`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse CREATE TABLE with foreign key', () => {
      const sql = `CREATE TABLE orders (
                     id INTEGER PRIMARY KEY,
                     user_id INTEGER,
                     total DECIMAL(10, 2),
                     FOREIGN KEY (user_id) REFERENCES users(id)
                   );`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse ALTER TABLE', () => {
      const sql = 'ALTER TABLE users ADD COLUMN phone VARCHAR(20);'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse DROP TABLE', () => {
      const sql = 'DROP TABLE IF EXISTS temp_users;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse CREATE INDEX', () => {
      const sql = 'CREATE INDEX idx_users_email ON users(email);'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Set Operations', () => {
    it('should parse UNION', () => {
      const sql = `SELECT name FROM customers
                   UNION
                   SELECT name FROM suppliers;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse UNION ALL', () => {
      const sql = `SELECT product_id FROM sales_2023
                   UNION ALL
                   SELECT product_id FROM sales_2024;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse INTERSECT', () => {
      const sql = `SELECT email FROM customers
                   INTERSECT
                   SELECT email FROM newsletter_subscribers;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse EXCEPT', () => {
      const sql = `SELECT email FROM all_users
                   EXCEPT
                   SELECT email FROM deleted_users;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Advanced Features', () => {
    it('should parse CASE statement', () => {
      const sql = `SELECT
                     name,
                     CASE
                       WHEN age < 18 THEN 'Minor'
                       WHEN age < 65 THEN 'Adult'
                       ELSE 'Senior'
                     END as age_group
                   FROM users;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse ORDER BY with multiple columns', () => {
      const sql = 'SELECT * FROM users ORDER BY country ASC, age DESC;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse LIMIT and OFFSET', () => {
      const sql = 'SELECT * FROM users ORDER BY created_at DESC LIMIT 10 OFFSET 20;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse DISTINCT', () => {
      const sql = 'SELECT DISTINCT country FROM users;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse NULL handling', () => {
      const sql = `SELECT name, COALESCE(phone, 'N/A') as phone
                   FROM users
                   WHERE email IS NOT NULL;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Transactions', () => {
    it('should parse BEGIN TRANSACTION', () => {
      const sql = 'BEGIN TRANSACTION;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse COMMIT', () => {
      const sql = 'COMMIT;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse ROLLBACK', () => {
      const sql = 'ROLLBACK;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Views', () => {
    it('should parse CREATE VIEW', () => {
      const sql = `CREATE VIEW active_users_view AS
                   SELECT id, name, email
                   FROM users
                   WHERE active = true;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse DROP VIEW', () => {
      const sql = 'DROP VIEW IF EXISTS temp_view;'

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Real-World Examples', () => {
    it('should parse analytics query', () => {
      const sql = `WITH monthly_sales AS (
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
                   ORDER BY ms.month, sales_rank;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse user activity report', () => {
      const sql = `SELECT
                     u.id,
                     u.name,
                     u.email,
                     COUNT(DISTINCT o.id) as order_count,
                     SUM(o.total) as lifetime_value,
                     MAX(o.created_at) as last_order_date,
                     CASE
                       WHEN MAX(o.created_at) > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'Active'
                       WHEN MAX(o.created_at) > DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'At Risk'
                       ELSE 'Churned'
                     END as user_status
                   FROM users u
                   LEFT JOIN orders o ON u.id = o.user_id
                   GROUP BY u.id, u.name, u.email
                   HAVING COUNT(o.id) > 0
                   ORDER BY lifetime_value DESC;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse migration script', () => {
      const sql = `CREATE TABLE posts (
                     id INT AUTO_INCREMENT PRIMARY KEY,
                     user_id INTEGER NOT NULL,
                     title VARCHAR(200) NOT NULL,
                     content TEXT,
                     published BOOLEAN DEFAULT false,
                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                   );`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should parse single-line comments', () => {
      const sql = `-- Get all active users
                   SELECT * FROM users WHERE active = true;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse multi-line comments', () => {
      const sql = `/*
                    * Get user statistics
                    * Includes order count and lifetime value
                    */
                   SELECT id, name FROM users;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse string literals with escapes', () => {
      const sql = `SELECT 'It\\'s a string' as text;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })

    it('should parse numeric literals', () => {
      const sql = `SELECT
                     42 as int_value,
                     3.14 as float_value,
                     1.5e10 as scientific;`

      const tree = parse(sql)
      expect(tree).toBeDefined()
    })
  })

  describe('API', () => {
    it('should support standalone parse function', () => {
      const tree = parse('SELECT * FROM users;')
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('sql')
    })

    it('should support async parsing', async () => {
      const tree = await parseAsync('SELECT * FROM users;')
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('sql')
    })

    it('should support createParser factory', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(SQLParser)

      const tree = parser.parse('SELECT * FROM users;')
      expect(tree).toBeDefined()
    })

    it('should support SQLParser class', () => {
      const parser = new SQLParser()
      const tree = parser.parse('SELECT * FROM users;')
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

      parse('SELECT * FROM users;', { plugins: [plugin] })
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

      await parseAsync('SELECT * FROM users;', { plugins: [plugin] })
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
        parse('SELECT * FROM users;', { plugins: [asyncPlugin] })
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

      const parser = new SQLParser()
      parser.use(plugin1).use(plugin2)
      parser.parse('SELECT * FROM users;')

      expect(count).toBe(2)
    })
  })
})
