# Flux AST - Technical Architecture

## Directory Structure

```
flux-ast/
├── src/
│   ├── types/              # 核心类型定义
│   │   ├── node.ts         # AST 节点类型
│   │   ├── tree.ts         # Tree 数据结构
│   │   ├── visitor.ts      # Visitor 模式类型
│   │   └── index.ts        # 导出
│   │
│   ├── core/               # 核心引擎（WASM-ready）
│   │   ├── traverse.ts     # 树遍历算法
│   │   ├── zipper.ts       # Zipper 数据结构
│   │   └── index.ts        # 导出
│   │
│   ├── api/                # 公共 API
│   │   ├── processor.ts    # 主处理器
│   │   ├── composition.ts  # 函数组合工具
│   │   ├── transforms.ts   # 通用转换
│   │   └── index.ts        # 导出
│   │
│   ├── adapters/           # 语言适配器
│   │   ├── markdown/       # Markdown 支持
│   │   │   ├── types.ts    # Markdown 节点类型
│   │   │   ├── parser.ts   # 解析器
│   │   │   ├── compiler.ts # 编译器
│   │   │   └── index.ts    # 导出
│   │   └── index.ts
│   │
│   └── index.ts            # 主入口
│
├── examples/               # 示例代码
│   ├── basic.ts            # 基础用法
│   ├── composition.ts      # 组合模式
│   └── README.md
│
├── dist/                   # 编译输出
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Core Module Overview

### 1. Types Layer (`src/types/`)

**Responsibility**: Define all core data structures and types

#### `node.ts` - AST 节点
```typescript
// 基础节点接口
interface BaseNode {
  id: NodeId              // 节点 ID（数组索引）
  type: string            // 节点类型
  parent: NodeId | null   // 父节点
  children: NodeId[]      // 子节点列表
  span?: Span             // 源码位置
  data?: Record<string, unknown>
}

// 特殊节点类型
- TextNode
- ParentNode
- RootNode
```

#### `tree.ts` - Tree 数据结构
```typescript
interface Tree {
  meta: TreeMetadata
  root: NodeId           // 根节点 ID
  nodes: BaseNode[]      // Arena 存储
  strings: Map<string, number>
}

// 操作函数
- createTree()
- getNode()
- addNode()
- updateNode()
- removeNode()
- getChildren()
- getParent()
```

#### `visitor.ts` - 访问者模式
```typescript
interface Visitor {
  enter?: (ctx: VisitorContext) => void | boolean
  leave?: (ctx: VisitorContext) => void
  [nodeType: string]: VisitorFn
}

enum TraversalOrder {
  PreOrder,
  PostOrder,
  BreadthFirst
}
```

---

### 2. Core Engine (`src/core/`)

**职责**：核心算法实现（性能关键，WASM 候选）

#### `traverse.ts` - 树遍历
```typescript
// 遍历算法
- traverse()          // 主遍历函数
- traversePreOrder()  // 前序遍历
- traversePostOrder() // 后序遍历
- traverseBreadthFirst() // 广度优先

// 查询函数
- select()            // 选择多个节点
- find()              // 查找单个节点
- selectByType()      // 按类型选择
```

**性能特点**：
- ✅ 避免递归调用栈（使用迭代）
- ✅ 早期退出优化
- ✅ 深度限制支持
- ✅ 过滤器支持

#### `zipper.ts` - Zipper 导航
```typescript
// 导航操作
- createZipper()      // 创建 zipper
- down()              // 向下
- up()                // 向上
- left()              // 向左
- right()             // 向右
- root()              // 回到根

// 编辑操作
- edit()              // 编辑当前节点
- replace()           // 替换节点
- appendChild()       // 添加子节点
- insertLeft()        // 插入左兄弟
- insertRight()       // 插入右兄弟
- remove()            // 删除节点
```

**数据结构**：
```typescript
interface Zipper {
  tree: Tree
  focus: NodeId
  path: Crumb[]       // 面包屑路径
}

interface Crumb {
  parentId: NodeId
  index: number
  left: NodeId[]      // 左兄弟
  right: NodeId[]     // 右兄弟
}
```

---

### 3. API Layer (`src/api/`)

**职责**：提供高层次、用户友好的 API

#### `processor.ts` - 主处理器
```typescript
class Processor {
  // 适配器管理
  adapter(lang: string, adapter: LanguageAdapter)

  // 解析
  parse(source: string, lang: string): ProcessorChain

  // 插件
  use(plugin: Plugin)

  // 转换
  transform(fn: TransformFn)
}

class ProcessorChain {
  visit(visitor: Visitor)
  transform(fn: TransformFn)
  zipper(): Zipper
  compile(lang?: string): string
}
```

#### `composition.ts` - 函数组合
```typescript
// 组合工具
- compose()     // 组合多个转换
- pipe()        // 管道风格
- when()        // 条件转换
- map()         // 映射
- parallel()    // 并行执行
- sequential()  // 顺序执行
- retry()       // 重试
- memoize()     // 缓存
- tap()         // 副作用
- timed()       // 计时
```

#### `transforms.ts` - 通用转换
```typescript
- transformNodes()      // 转换匹配的节点
- transformByType()     // 按类型转换
- removeNodes()         // 删除节点
- filter()              // 过滤
- mapNodes()            // 映射所有节点
- cloneTree()           // 克隆树
- mergeTrees()          // 合并树
```

---

### 4. Adapters Layer (`src/adapters/`)

**职责**：语言特定的解析和编译

#### `markdown/` - Markdown 适配器
```typescript
class MarkdownAdapter implements LanguageAdapter {
  parse(source: string): Tree
  compile(tree: Tree): string
}

// 节点类型
- MarkdownHeading
- MarkdownParagraph
- MarkdownList
- MarkdownCode
- MarkdownLink
- ...
```

**实现策略**：
- 简单实现：演示概念
- 未来：集成成熟的 parser (如 micromark)
- WASM 加速路径

---

## 数据流

### 解析流程

```
Source Text
    ↓
[Parser] ← Language Adapter
    ↓
Raw AST
    ↓
[Normalize] ← Create Tree structure
    ↓
Tree (Arena-based)
    ↓
[Return] → ProcessorChain
```

### 转换流程

```
Tree
    ↓
[Transform Pipeline]
    ├─ Transform 1
    ├─ Transform 2
    └─ Transform N
    ↓
Modified Tree
```

### 编译流程

```
Tree
    ↓
[Compiler] ← Language Adapter
    ↓
Target Source
```

---

## WASM 加速路径

### 设计目标
- ✅ TypeScript 实现优先（开发快速）
- ✅ 清晰的接口边界（易于替换）
- ✅ 数据结构 WASM 兼容（无需序列化）

### 替换策略

#### Phase 1: 核心引擎
```
TypeScript          WASM (Rust)
─────────────       ─────────────
traverse()    →     wasm_traverse()
select()      →     wasm_select()
zipper ops    →     wasm_zipper_*()
```

#### Phase 2: 语言适配器
```
TypeScript          WASM (Rust)
─────────────       ─────────────
markdown()    →     wasm_markdown()
html()        →     wasm_html()
```

#### Phase 3: 完整管道
```
End-to-end WASM processing
- Parse
- Transform
- Compile
```

### 接口设计

```typescript
// 当前（TS）
interface LanguageAdapter {
  parse(source: string): Tree
  compile(tree: Tree): string
}

// 未来（WASM）
class WasmMarkdownAdapter implements LanguageAdapter {
  private wasmModule: WebAssembly.Module

  parse(source: string): Tree {
    // 调用 WASM
    return this.wasmModule.parse(source)
  }

  compile(tree: Tree): string {
    return this.wasmModule.compile(tree)
  }
}
```

**数据传递**：
- Tree → 转为 ArrayBuffer
- Shared memory（未来）
- 零拷贝传递

---

## 性能考虑

### 热路径识别

1. **traverse()** - 最频繁调用
2. **getNode()** - 节点访问
3. **updateNode()** - 节点修改
4. **parse()** - 解析入口

### 优化策略

#### 已实现
- ✅ Arena allocation（连续内存）
- ✅ NodeId 系统（避免指针）
- ✅ String interning（去重）

#### 待实现
- [ ] Object pooling
- [ ] Lazy evaluation
- [ ] Parallel traversal
- [ ] SIMD operations

---

## 测试策略

### 单元测试
```typescript
// Core
src/core/traverse.test.ts
src/core/zipper.test.ts

// API
src/api/processor.test.ts
src/api/composition.test.ts

// Adapters
src/adapters/markdown.test.ts
```

### 集成测试
```typescript
// 完整 pipeline
test('markdown to html pipeline', () => {
  const result = flux()
    .parse(markdown, 'markdown')
    .transform(addTOC)
    .compile('html')

  expect(result).toBe(expected)
})
```

### 性能基准
```typescript
// vs unified
bench('parse 1KB markdown', () => {
  flux().parse(source, 'markdown')
})

bench('complex transform', () => {
  flux().transform(pipeline)
})
```

---

## 扩展点

### 1. 添加新语言

```typescript
// 1. 定义节点类型
src/adapters/mylang/types.ts

// 2. 实现 parser
src/adapters/mylang/parser.ts

// 3. 实现 compiler
src/adapters/mylang/compiler.ts

// 4. 导出适配器
src/adapters/mylang/index.ts
```

### 2. 添加新 Transform

```typescript
// 创建转换函数
export const myTransform: TransformFn = async (tree) => {
  traverse(tree, {
    enter: (ctx) => {
      // 修改逻辑
    }
  })
  return tree
}

// 使用
flux().transform(myTransform)
```

### 3. 添加新 Composition

```typescript
// 创建组合工具
export function myComposition(...fns: TransformFn[]): TransformFn {
  return async (tree) => {
    // 自定义组合逻辑
    return tree
  }
}
```

---

## 依赖关系

```
src/index.ts
    ├── src/api/
    │   ├── src/core/
    │   │   └── src/types/
    │   └── src/types/
    └── src/adapters/
        └── src/types/
```

**原则**：
- types 层无依赖
- core 层仅依赖 types
- api 层依赖 core + types
- adapters 层依赖 types

---

## 构建流程

```bash
# 开发
npm run dev        # TypeScript watch mode

# 构建
npm run build      # tsc

# 测试
npm test           # vitest
npm run test:watch # watch mode

# 性能测试
npm run bench      # vitest bench
```

---

## 发布策略

### NPM Package
```json
{
  "name": "flux-ast",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./adapters": "./dist/adapters/index.js"
  }
}
```

### 版本规划
- v0.1.x - MVP (当前)
- v0.2.x - 性能优化
- v0.3.x - 更多语言
- v1.0.0 - 稳定版
- v2.0.0 - WASM 加速版

---

## 贡献指南

1. Fork 仓库
2. 创建功能分支
3. 编写测试
4. 提交 PR
5. 等待 review

**代码规范**：
- TypeScript strict mode
- ESLint + Prettier
- 测试覆盖 > 80%
- 性能测试必须通过
