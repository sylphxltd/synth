# @sylphx/ast-plugin-system

Generic plugin architecture for AST transformation.

## Features

- **Transform Plugins**: Whole-tree transformations
- **Visitor Plugins**: Type-based node visiting
- **Plugin Manager**: Composable plugin system
- **Async Support**: Plugin hooks can be async
- **Type-Safe**: Full TypeScript support

## Installation

```bash
npm install @sylphx/ast-plugin-system
```

## Usage

### Transform Plugin

```typescript
import { createTransformPlugin } from '@sylphx/ast-plugin-system'

const plugin = createTransformPlugin(
  {
    name: 'add-metadata',
    version: '1.0.0',
    description: 'Add metadata to all nodes',
  },
  (tree) => {
    tree.meta.processed = Date.now()
    return tree
  }
)
```

### Visitor Plugin

```typescript
import { createVisitorPlugin } from '@sylphx/ast-plugin-system'

const plugin = createVisitorPlugin(
  {
    name: 'uppercase-text',
    version: '1.0.0',
  },
  {
    text: (node) => ({
      ...node,
      value: node.value.toUpperCase()
    })
  },
  {
    setup: async (tree) => console.log('Starting...'),
    teardown: async (tree) => console.log('Done!')
  }
)
```

### Plugin Manager

```typescript
import { PluginManager } from '@sylphx/ast-plugin-system'

const manager = new PluginManager()
manager.use(plugin1).use(plugin2)

const transformed = await manager.apply(tree)
```

## API

### Plugin Types
- `TransformPlugin` - Whole-tree transformation
- `VisitorPlugin` - Node-specific visitors
- `PluginMetadata` - Plugin information

### Plugin Manager
- `use(plugin)` - Register plugin
- `useAll(plugins)` - Register multiple plugins
- `apply(tree)` - Apply all plugins
- `applyTransforms(tree)` - Apply only transform plugins
- `applyVisitors(tree)` - Apply only visitor plugins
- `clear()` - Remove all plugins
- `remove(name)` - Remove plugin by name
- `has(name)` - Check if plugin exists

### Factory Functions
- `createTransformPlugin(meta, fn)` - Create transform plugin
- `createVisitorPlugin(meta, visitors, hooks?)` - Create visitor plugin

### Type Guards
- `isTransformPlugin(plugin)` - Check if transform plugin
- `isVisitorPlugin(plugin)` - Check if visitor plugin

## License

MIT
