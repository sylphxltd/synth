# @sylphx/ast-core

Core AST infrastructure - language-agnostic types and utilities.

## Features

- **Tree & Node Types**: Fundamental AST data structures
- **Query Index**: Fast node lookup and queries
- **Traversal**: Multiple traversal strategies (DFS, BFS, visitor pattern)
- **Zipper**: Functional tree navigation with focus
- **Incremental Processing**: Efficient update tracking

## Installation

```bash
npm install @sylphx/ast-core
```

## Usage

```typescript
import { Tree, Node, createQueryIndex, traverse } from '@sylphx/ast-core'

// Create and query trees
const tree: Tree = { /* ... */ }
const index = createQueryIndex(tree)

// Traverse with visitor
traverse(tree, {
  enter: (node) => console.log(node.type),
  exit: (node) => console.log('leaving', node.type)
})
```

## API

### Types
- `Tree` - Core tree structure with arena-based node storage
- `Node` - Generic node interface
- `NodeId` - Node identifier type
- `Span` - Source location information

### Query Index
- `createQueryIndex(tree)` - Build index for fast queries
- `index.getByType(type)` - Find nodes by type
- `index.getBySpan(span)` - Find nodes by location

### Traversal
- `traverse(tree, visitor)` - DFS traversal with visitor
- `traverseBFS(tree, visitor)` - BFS traversal
- `createZipper(tree)` - Create zipper for functional navigation

### Incremental
- `IncrementalProcessor` - Track and process incremental updates
- `diffTrees(oldTree, newTree)` - Compute tree differences

## License

MIT
