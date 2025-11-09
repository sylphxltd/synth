/**
 * C Parser Tests
 */

import { describe, it, expect } from 'vitest'
import { parse, parseAsync, createParser, CParser } from './parser.js'

describe('CParser', () => {
  describe('Basic Parsing', () => {
    it('should parse empty C', () => {
      const tree = parse('')
      expect(tree.meta.language).toBe('c')
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse simple main function', () => {
      const c = `
int main() {
    printf("Hello, World!\\n");
    return 0;
}
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')
      expect(tree.nodes[tree.root]).toBeDefined()

      // Should have translation unit root and children
      const rootChildren = tree.nodes[tree.root]!.children
      expect(rootChildren.length).toBeGreaterThan(0)
    })

    it('should parse variable declaration', () => {
      const c = 'int x = 42;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find declaration
      const declNode = tree.nodes.find(n => n.type.includes('Declaration'))
      expect(declNode).toBeDefined()
    })

    it('should parse function definition', () => {
      const c = `
int add(int a, int b) {
    return a + b;
}
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find function definition
      const funcNode = tree.nodes.find(n => n.type === 'FunctionDefinition')
      expect(funcNode).toBeDefined()
    })
  })

  describe('Data Types', () => {
    it('should parse integer types', () => {
      const c = `
int x = 42;
long y = 100L;
short z = 10;
unsigned int w = 42U;
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find type specifiers
      const typeNodes = tree.nodes.filter(n => n.type.includes('Type') || n.type.includes('PrimitiveType'))
      expect(typeNodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse floating point types', () => {
      const c = `
float x = 3.14f;
double y = 3.14159;
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find float/double types
      const floatNodes = tree.nodes.filter(n => n.data?.text?.includes('.') || n.type.includes('Float'))
      expect(floatNodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse character types', () => {
      const c = `
char c = 'A';
char *str = "Hello";
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find char declarations
      const charNodes = tree.nodes.filter(n => n.data?.text?.includes('char'))
      expect(charNodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse boolean type (C99)', () => {
      const c = `
#include <stdbool.h>
bool flag = true;
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Should parse successfully
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse void type', () => {
      const c = 'void func() {}'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find void
      const voidNode = tree.nodes.find(n => n.data?.text === 'void')
      expect(voidNode).toBeDefined()
    })
  })

  describe('Pointers', () => {
    it('should parse pointer declaration', () => {
      const c = 'int *ptr;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find pointer declarator
      const ptrNode = tree.nodes.find(n => n.type.includes('Pointer'))
      expect(ptrNode).toBeDefined()
    })

    it('should parse pointer dereference', () => {
      const c = 'int x = *ptr;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find dereference operator
      const derefNode = tree.nodes.find(n => n.data?.text === '*ptr')
      expect(derefNode).toBeDefined()
    })

    it('should parse address-of operator', () => {
      const c = 'int *ptr = &x;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find address-of
      const addrNode = tree.nodes.find(n => n.data?.text?.includes('&'))
      expect(addrNode).toBeDefined()
    })

    it('should parse double pointer', () => {
      const c = 'int **ptr;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find pointer declarator
      const ptrNode = tree.nodes.find(n => n.type.includes('Pointer'))
      expect(ptrNode).toBeDefined()
    })
  })

  describe('Arrays', () => {
    it('should parse array declaration', () => {
      const c = 'int arr[10];'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find array declarator
      const arrNode = tree.nodes.find(n => n.type.includes('Array'))
      expect(arrNode).toBeDefined()
    })

    it('should parse array initialization', () => {
      const c = 'int arr[] = {1, 2, 3, 4, 5};'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find initializer list
      const initNode = tree.nodes.find(n => n.type.includes('Initializer'))
      expect(initNode).toBeDefined()
    })

    it('should parse multidimensional array', () => {
      const c = 'int matrix[3][3];'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find array declarator
      const arrNode = tree.nodes.find(n => n.type.includes('Array'))
      expect(arrNode).toBeDefined()
    })

    it('should parse array access', () => {
      const c = 'int x = arr[0];'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find subscript expression
      const subNode = tree.nodes.find(n => n.type.includes('Subscript'))
      expect(subNode).toBeDefined()
    })
  })

  describe('Structs and Unions', () => {
    it('should parse struct definition', () => {
      const c = `
struct Point {
    int x;
    int y;
};
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find struct specifier
      const structNode = tree.nodes.find(n => n.type.includes('Struct'))
      expect(structNode).toBeDefined()
    })

    it('should parse struct declaration and initialization', () => {
      const c = `
struct Point p = {10, 20};
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find struct usage
      const structNode = tree.nodes.find(n => n.type.includes('Struct'))
      expect(structNode).toBeDefined()
    })

    it('should parse union', () => {
      const c = `
union Data {
    int i;
    float f;
    char str[20];
};
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find union specifier
      const unionNode = tree.nodes.find(n => n.type.includes('Union'))
      expect(unionNode).toBeDefined()
    })

    it('should parse member access', () => {
      const c = 'int x = point.x;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find field expression
      const fieldNode = tree.nodes.find(n => n.type.includes('Field'))
      expect(fieldNode).toBeDefined()
    })

    it('should parse arrow operator', () => {
      const c = 'int x = ptr->x;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find pointer member access
      const arrowNode = tree.nodes.find(n => n.data?.text?.includes('->'))
      expect(arrowNode).toBeDefined()
    })
  })

  describe('Control Flow', () => {
    it('should parse if statement', () => {
      const c = `
if (x > 0) {
    printf("positive");
} else if (x < 0) {
    printf("negative");
} else {
    printf("zero");
}
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find if statement
      const ifNode = tree.nodes.find(n => n.type === 'IfStatement')
      expect(ifNode).toBeDefined()
    })

    it('should parse for loop', () => {
      const c = `
for (int i = 0; i < 10; i++) {
    printf("%d\\n", i);
}
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find for statement
      const forNode = tree.nodes.find(n => n.type === 'ForStatement')
      expect(forNode).toBeDefined()
    })

    it('should parse while loop', () => {
      const c = `
while (x < 10) {
    x++;
}
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find while statement
      const whileNode = tree.nodes.find(n => n.type === 'WhileStatement')
      expect(whileNode).toBeDefined()
    })

    it('should parse do-while loop', () => {
      const c = `
do {
    x++;
} while (x < 10);
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find do statement
      const doNode = tree.nodes.find(n => n.type === 'DoStatement')
      expect(doNode).toBeDefined()
    })

    it('should parse switch statement', () => {
      const c = `
switch (day) {
    case 0:
        printf("Sunday");
        break;
    case 1:
        printf("Monday");
        break;
    default:
        printf("Other");
}
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find switch statement
      const switchNode = tree.nodes.find(n => n.type === 'SwitchStatement')
      expect(switchNode).toBeDefined()
    })

    it('should parse break and continue', () => {
      const c = `
for (int i = 0; i < 10; i++) {
    if (i == 5) break;
    if (i % 2 == 0) continue;
}
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find break and continue
      const breakNode = tree.nodes.find(n => n.type === 'BreakStatement')
      const contNode = tree.nodes.find(n => n.type === 'ContinueStatement')
      expect(breakNode).toBeDefined()
      expect(contNode).toBeDefined()
    })

    it('should parse goto and labels', () => {
      const c = `
    if (error) goto cleanup;
    // do work
cleanup:
    free(ptr);
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find goto statement
      const gotoNode = tree.nodes.find(n => n.type.includes('Goto'))
      expect(gotoNode).toBeDefined()
    })
  })

  describe('Functions', () => {
    it('should parse function declaration', () => {
      const c = 'int add(int a, int b);'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find declaration
      const declNode = tree.nodes.find(n => n.type.includes('Declaration'))
      expect(declNode).toBeDefined()
    })

    it('should parse function definition', () => {
      const c = `
int add(int a, int b) {
    return a + b;
}
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find function definition
      const funcNode = tree.nodes.find(n => n.type === 'FunctionDefinition')
      expect(funcNode).toBeDefined()
    })

    it('should parse function call', () => {
      const c = 'int result = add(1, 2);'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find call expression
      const callNode = tree.nodes.find(n => n.type === 'CallExpression')
      expect(callNode).toBeDefined()
    })

    it('should parse variadic function', () => {
      const c = 'int printf(const char *format, ...);'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Should parse successfully
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse function pointers', () => {
      const c = 'int (*func_ptr)(int, int);'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find function pointer declarator
      const ptrNode = tree.nodes.find(n => n.type.includes('Pointer'))
      expect(ptrNode).toBeDefined()
    })
  })

  describe('Preprocessor', () => {
    it('should parse #include', () => {
      const c = '#include <stdio.h>'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find preproc include
      const includeNode = tree.nodes.find(n => n.type.includes('Preproc') && n.type.includes('Include'))
      expect(includeNode).toBeDefined()
    })

    it('should parse #define', () => {
      const c = '#define PI 3.14159'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find preproc def
      const defineNode = tree.nodes.find(n => n.type.includes('Preproc') && n.type.includes('Def'))
      expect(defineNode).toBeDefined()
    })

    it('should parse #ifdef', () => {
      const c = `
#ifdef DEBUG
    printf("Debug mode\\n");
#endif
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find preproc ifdef
      const ifdefNode = tree.nodes.find(n => n.type.includes('Preproc') && n.type.includes('Ifdef'))
      expect(ifdefNode).toBeDefined()
    })

    it('should parse #ifndef', () => {
      const c = `
#ifndef HEADER_H
#define HEADER_H
#endif
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find preproc ifndef
      const ifndefNode = tree.nodes.find(n => n.type.includes('Preproc'))
      expect(ifndefNode).toBeDefined()
    })

    it('should parse macro function', () => {
      const c = '#define MAX(a, b) ((a) > (b) ? (a) : (b))'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find preproc function def
      const macroNode = tree.nodes.find(n => n.type.includes('Preproc'))
      expect(macroNode).toBeDefined()
    })
  })

  describe('Operators', () => {
    it('should parse arithmetic operators', () => {
      const c = 'int x = a + b - c * d / e % f;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find binary expressions
      const binNodes = tree.nodes.filter(n => n.type.includes('Binary'))
      expect(binNodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse increment and decrement', () => {
      const c = `
x++;
++x;
y--;
--y;
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find update expressions
      const updateNodes = tree.nodes.filter(n => n.type.includes('Update'))
      expect(updateNodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse bitwise operators', () => {
      const c = 'int x = a & b | c ^ d << e >> f;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find binary expressions
      const binNodes = tree.nodes.filter(n => n.type.includes('Binary'))
      expect(binNodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse logical operators', () => {
      const c = 'int x = a && b || !c;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find logical expressions
      const logicNodes = tree.nodes.filter(n => n.type.includes('Binary') || n.type.includes('Unary'))
      expect(logicNodes.length).toBeGreaterThanOrEqual(1)
    })

    it('should parse ternary operator', () => {
      const c = 'int x = (a > b) ? a : b;'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find conditional expression
      const ternaryNode = tree.nodes.find(n => n.type.includes('Conditional'))
      expect(ternaryNode).toBeDefined()
    })

    it('should parse sizeof', () => {
      const c = 'int size = sizeof(int);'
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find sizeof expression
      const sizeofNode = tree.nodes.find(n => n.type.includes('Sizeof'))
      expect(sizeofNode).toBeDefined()
    })
  })

  describe('Comments', () => {
    it('should parse line comments', () => {
      const c = `
// This is a comment
int x = 42;
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Find comment node
      const commentNode = tree.nodes.find(n => n.type.includes('Comment') || n.data?.text?.includes('//'))
      expect(commentNode).toBeDefined()
    })

    it('should parse block comments', () => {
      const c = `
/* This is a
   multi-line comment */
int x = 42;
      `
      const tree = parse(c)

      expect(tree.meta.language).toBe('c')

      // Should have parsed successfully
      expect(tree.nodes[tree.root]).toBeDefined()
    })
  })

  describe('API', () => {
    it('should create parser with factory', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(CParser)
    })

    it('should parse with standalone function', () => {
      const tree = parse('int x = 42;')
      expect(tree.meta.language).toBe('c')
    })

    it('should parse async', async () => {
      const tree = await parseAsync('int x = 42;')
      expect(tree.meta.language).toBe('c')
    })

    it('should support plugins', () => {
      let called = false
      const plugin = {
        transform: (tree: any) => {
          called = true
          return tree
        },
      }

      const parser = createParser()
      parser.use(plugin)
      parser.parse('int x = 42;')

      expect(called).toBe(true)
    })

    it('should support async plugins', async () => {
      let called = false
      const plugin = {
        transform: async (tree: any) => {
          called = true
          return tree
        },
      }

      const parser = createParser()
      parser.use(plugin)
      await parser.parseAsync('int x = 42;')

      expect(called).toBe(true)
    })

    it('should throw error for async plugin in sync parse', () => {
      const plugin = {
        transform: async (tree: any) => tree,
      }

      const parser = createParser()
      parser.use(plugin)

      expect(() => parser.parse('int x = 42;')).toThrow('async')
    })

    it('should get last parsed tree', () => {
      const parser = createParser()
      parser.parse('int x = 42;')
      const tree = parser.getTree()

      expect(tree).toBeDefined()
      expect(tree!.meta.language).toBe('c')
    })
  })
})
