/**
 * Core type exports
 */

export type {
  Position,
  Span,
  NodeId,
  BaseNode,
  Node,
  TextNode,
  ParentNode,
  RootNode,
} from './node.js'

export {
  isTextNode,
  isParentNode,
} from './node.js'

export type {
  TreeMetadata,
  Tree,
} from './tree.js'

export {
  createTree,
  getNode,
  getRoot,
  addNode,
  updateNode,
  removeNode,
  getChildren,
  getParent,
  internString,
} from './tree.js'

export type {
  VisitorContext,
  VisitorFn,
  Visitor,
  TraversalOptions,
} from './visitor.js'

export {
  TraversalOrder,
} from './visitor.js'
