/**
 * Zipper data structure for functional tree navigation
 *
 * A zipper allows efficient navigation and modification of trees
 * in a purely functional way. It maintains a "focus" on a current node
 * and a "path" back to the root.
 */

import type { Tree, NodeId, BaseNode } from './types/index.js'
import { getNode, updateNode, addNode } from './types/index.js'

/**
 * Breadcrumb - represents one step in the path from root to focus
 */
interface Crumb {
  /** Parent node ID */
  parentId: NodeId

  /** Index of focused child in parent's children */
  index: number

  /** Siblings to the left */
  left: NodeId[]

  /** Siblings to the right */
  right: NodeId[]
}

/**
 * Zipper structure
 */
export interface Zipper {
  /** Current tree */
  tree: Tree

  /** Current focus node ID */
  focus: NodeId

  /** Path from root to focus */
  path: Crumb[]
}

/**
 * Create a zipper focused on the root
 */
export function createZipper(tree: Tree): Zipper {
  return {
    tree,
    focus: tree.root,
    path: [],
  }
}

/**
 * Create a zipper focused on a specific node
 */
export function createZipperAt(tree: Tree, nodeId: NodeId): Zipper | null {
  const node = getNode(tree, nodeId)
  if (!node) return null

  // Build path from root to node
  const path: Crumb[] = []
  let currentId = nodeId
  let current = node

  while (current.parent !== null) {
    const parent = getNode(tree, current.parent)
    if (!parent) return null

    const index = parent.children.indexOf(currentId)
    if (index === -1) return null

    path.unshift({
      parentId: current.parent,
      index,
      left: parent.children.slice(0, index),
      right: parent.children.slice(index + 1),
    })

    currentId = current.parent
    current = parent
  }

  return {
    tree,
    focus: nodeId,
    path,
  }
}

/**
 * Get the focused node
 */
export function getFocus(zipper: Zipper): BaseNode | undefined {
  return getNode(zipper.tree, zipper.focus)
}

/**
 * Move focus to the first child
 */
export function down(zipper: Zipper): Zipper | null {
  const node = getFocus(zipper)
  if (!node || node.children.length === 0) return null

  const firstChild = node.children[0]!
  const restChildren = node.children.slice(1)

  return {
    tree: zipper.tree,
    focus: firstChild,
    path: [
      ...zipper.path,
      {
        parentId: zipper.focus,
        index: 0,
        left: [],
        right: restChildren,
      },
    ],
  }
}

/**
 * Move focus to the parent
 */
export function up(zipper: Zipper): Zipper | null {
  if (zipper.path.length === 0) return null

  const crumb = zipper.path[zipper.path.length - 1]!
  const newPath = zipper.path.slice(0, -1)

  return {
    tree: zipper.tree,
    focus: crumb.parentId,
    path: newPath,
  }
}

/**
 * Move focus to the right sibling
 */
export function right(zipper: Zipper): Zipper | null {
  if (zipper.path.length === 0) return null

  const crumb = zipper.path[zipper.path.length - 1]!
  if (crumb.right.length === 0) return null

  const nextSibling = crumb.right[0]!
  const restRight = crumb.right.slice(1)

  return {
    tree: zipper.tree,
    focus: nextSibling,
    path: [
      ...zipper.path.slice(0, -1),
      {
        parentId: crumb.parentId,
        index: crumb.index + 1,
        left: [...crumb.left, zipper.focus],
        right: restRight,
      },
    ],
  }
}

/**
 * Move focus to the left sibling
 */
export function left(zipper: Zipper): Zipper | null {
  if (zipper.path.length === 0) return null

  const crumb = zipper.path[zipper.path.length - 1]!
  if (crumb.left.length === 0) return null

  const prevSibling = crumb.left[crumb.left.length - 1]!
  const restLeft = crumb.left.slice(0, -1)

  return {
    tree: zipper.tree,
    focus: prevSibling,
    path: [
      ...zipper.path.slice(0, -1),
      {
        parentId: crumb.parentId,
        index: crumb.index - 1,
        left: restLeft,
        right: [zipper.focus, ...crumb.right],
      },
    ],
  }
}

/**
 * Navigate to the root
 */
export function root(zipper: Zipper): Zipper {
  return {
    tree: zipper.tree,
    focus: zipper.tree.root,
    path: [],
  }
}

/**
 * Edit the focused node
 */
export function edit(zipper: Zipper, fn: (node: BaseNode) => Partial<BaseNode>): Zipper {
  const node = getFocus(zipper)
  if (!node) return zipper

  const updates = fn(node)
  updateNode(zipper.tree, zipper.focus, updates)

  return zipper
}

/**
 * Replace the focused node completely
 */
export function replace(zipper: Zipper, newNode: Omit<BaseNode, 'id'>): Zipper {
  const node = getFocus(zipper)
  if (!node) return zipper

  updateNode(zipper.tree, zipper.focus, { ...newNode, id: zipper.focus })

  return zipper
}

/**
 * Insert a node as the rightmost child of the focus
 */
export function appendChild(zipper: Zipper, childNode: Omit<BaseNode, 'id' | 'parent'>): Zipper {
  const node = getFocus(zipper)
  if (!node) return zipper

  const childId = addNode(zipper.tree, {
    ...childNode,
    parent: zipper.focus,
  })

  updateNode(zipper.tree, zipper.focus, {
    children: [...node.children, childId],
  })

  return zipper
}

/**
 * Insert a node to the right of the focus
 */
export function insertRight(zipper: Zipper, siblingNode: Omit<BaseNode, 'id' | 'parent'>): Zipper {
  if (zipper.path.length === 0) return zipper

  const crumb = zipper.path[zipper.path.length - 1]!
  const parent = getNode(zipper.tree, crumb.parentId)
  if (!parent) return zipper

  const siblingId = addNode(zipper.tree, {
    ...siblingNode,
    parent: crumb.parentId,
  })

  updateNode(zipper.tree, crumb.parentId, {
    children: [...crumb.left, zipper.focus, siblingId, ...crumb.right],
  })

  return {
    tree: zipper.tree,
    focus: zipper.focus,
    path: [
      ...zipper.path.slice(0, -1),
      {
        ...crumb,
        right: [siblingId, ...crumb.right],
      },
    ],
  }
}

/**
 * Insert a node to the left of the focus
 */
export function insertLeft(zipper: Zipper, siblingNode: Omit<BaseNode, 'id' | 'parent'>): Zipper {
  if (zipper.path.length === 0) return zipper

  const crumb = zipper.path[zipper.path.length - 1]!
  const parent = getNode(zipper.tree, crumb.parentId)
  if (!parent) return zipper

  const siblingId = addNode(zipper.tree, {
    ...siblingNode,
    parent: crumb.parentId,
  })

  updateNode(zipper.tree, crumb.parentId, {
    children: [...crumb.left, siblingId, zipper.focus, ...crumb.right],
  })

  return {
    tree: zipper.tree,
    focus: zipper.focus,
    path: [
      ...zipper.path.slice(0, -1),
      {
        ...crumb,
        left: [...crumb.left, siblingId],
      },
    ],
  }
}

/**
 * Remove the focused node and move focus to the right sibling (or left, or parent)
 */
export function remove(zipper: Zipper): Zipper | null {
  if (zipper.path.length === 0) return null // Can't remove root

  const crumb = zipper.path[zipper.path.length - 1]!

  // Update parent's children
  updateNode(zipper.tree, crumb.parentId, {
    children: [...crumb.left, ...crumb.right],
  })

  // Move focus to right sibling, or left sibling, or parent
  if (crumb.right.length > 0) {
    return {
      tree: zipper.tree,
      focus: crumb.right[0]!,
      path: [
        ...zipper.path.slice(0, -1),
        {
          ...crumb,
          right: crumb.right.slice(1),
        },
      ],
    }
  }

  if (crumb.left.length > 0) {
    return {
      tree: zipper.tree,
      focus: crumb.left[crumb.left.length - 1]!,
      path: [
        ...zipper.path.slice(0, -1),
        {
          ...crumb,
          left: crumb.left.slice(0, -1),
        },
      ],
    }
  }

  return up(zipper)
}
