# @sylphx/ast-core

## 0.1.0

### Minor Changes

- Initial release of @sylphx/ast monorepo

  This is the first published version of the @sylphx/ast monorepo, a high-performance AST processing toolkit.

  **Packages:**

  - **@sylphx/ast-core**: Core AST infrastructure with language-agnostic types, tree traversal, zipper navigation, query index, and incremental parsing support
  - **@sylphx/ast-optimizations**: Performance optimization components including batch processing and node pooling
  - **@sylphx/ast-plugin-system**: Generic plugin architecture for AST transformation with transform and visitor plugins
  - **@sylphx/ast-markdown**: High-performance Markdown parser achieving 26-42x faster parsing than remark, with streaming and incremental parsing support

  **Features:**

  - Monorepo architecture for scalable language parser ecosystem
  - Tree-shakable packages for minimal bundle size
  - TypeScript with full type safety
  - Comprehensive test coverage
  - Optimized for performance with SIMD-style batch processing
  - Support for incremental and streaming parsing
