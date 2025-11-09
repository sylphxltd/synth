/**
 * Java Parser Tests
 */

import { describe, it, expect } from 'vitest'
import { parse, parseAsync, createParser, JavaParser } from './parser.js'

describe('JavaParser', () => {
  describe('Basic Parsing', () => {
    it('should parse empty Java', () => {
      const tree = parse('')
      expect(tree.meta.language).toBe('java')
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse simple class', () => {
      const java = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')
      expect(tree.nodes[tree.root]).toBeDefined()

      // Should have program root and children
      const rootChildren = tree.nodes[tree.root]!.children
      expect(rootChildren.length).toBeGreaterThan(0)
    })

    it('should parse variable declaration', () => {
      const java = 'int x = 42;'
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find variable declaration
      const varNode = tree.nodes.find(n => n.type.includes('VariableDecl') || n.type.includes('Local'))
      expect(varNode).toBeDefined()
    })

    it('should parse method definition', () => {
      const java = `
public int add(int a, int b) {
    return a + b;
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find method declaration
      const methodNode = tree.nodes.find(n => n.type === 'MethodDeclaration')
      expect(methodNode).toBeDefined()
    })
  })

  describe('Data Types', () => {
    it('should parse string literals', () => {
      const java = 'String text = "Hello, World!";'
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find string literal
      const stringNode = tree.nodes.find(n => n.type === 'StringLiteral')
      expect(stringNode).toBeDefined()
    })

    it('should parse integer literals', () => {
      const java = 'int num = 42;'
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find decimal integer literal
      const intNode = tree.nodes.find(n => n.type === 'DecimalIntegerLiteral')
      expect(intNode).toBeDefined()
    })

    it('should parse floating point literals', () => {
      const java = 'double pi = 3.14159;'
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find floating point literal
      const floatNode = tree.nodes.find(n => n.type.includes('Float'))
      expect(floatNode).toBeDefined()
    })

    it('should parse boolean literals', () => {
      const java = `
boolean flag1 = true;
boolean flag2 = false;
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find boolean literals
      const boolNodes = tree.nodes.filter(n => n.type === 'True' || n.type === 'False' || n.data?.text === 'true' || n.data?.text === 'false')
      expect(boolNodes.length).toBeGreaterThanOrEqual(2)
    })

    it('should parse arrays', () => {
      const java = 'int[] numbers = {1, 2, 3, 4, 5};'
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find array type or array initializer
      const arrayNode = tree.nodes.find(n => n.type.includes('Array'))
      expect(arrayNode).toBeDefined()
    })

    it('should parse null literal', () => {
      const java = 'String value = null;'
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find null literal
      const nullNode = tree.nodes.find(n => n.type === 'NullLiteral' || n.data?.text === 'null')
      expect(nullNode).toBeDefined()
    })
  })

  describe('Control Flow', () => {
    it('should parse if statement', () => {
      const java = `
if (x > 0) {
    System.out.println("positive");
} else if (x < 0) {
    System.out.println("negative");
} else {
    System.out.println("zero");
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find if statement
      const ifNode = tree.nodes.find(n => n.type === 'IfStatement')
      expect(ifNode).toBeDefined()
    })

    it('should parse for loop', () => {
      const java = `
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find for statement
      const forNode = tree.nodes.find(n => n.type === 'ForStatement')
      expect(forNode).toBeDefined()
    })

    it('should parse enhanced for loop', () => {
      const java = `
for (String item : items) {
    System.out.println(item);
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find enhanced for statement
      const forNode = tree.nodes.find(n => n.type === 'EnhancedForStatement')
      expect(forNode).toBeDefined()
    })

    it('should parse while loop', () => {
      const java = `
while (x < 10) {
    x++;
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find while statement
      const whileNode = tree.nodes.find(n => n.type === 'WhileStatement')
      expect(whileNode).toBeDefined()
    })

    it('should parse do-while loop', () => {
      const java = `
do {
    x++;
} while (x < 10);
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find do statement
      const doNode = tree.nodes.find(n => n.type === 'DoStatement')
      expect(doNode).toBeDefined()
    })

    it('should parse switch statement', () => {
      const java = `
switch (day) {
    case MONDAY:
        System.out.println("Monday");
        break;
    case TUESDAY:
        System.out.println("Tuesday");
        break;
    default:
        System.out.println("Other day");
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find switch statement
      const switchNode = tree.nodes.find(n => n.type.includes('Switch'))
      expect(switchNode).toBeDefined()
    })

    it('should parse try-catch', () => {
      const java = `
try {
    riskyOperation();
} catch (IOException e) {
    System.err.println("IO error: " + e.getMessage());
} finally {
    cleanup();
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find try statement
      const tryNode = tree.nodes.find(n => n.type === 'TryStatement')
      expect(tryNode).toBeDefined()
    })
  })

  describe('Classes and Objects', () => {
    it('should parse class with fields', () => {
      const java = `
public class Person {
    private String name;
    private int age;
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find class declaration
      const classNode = tree.nodes.find(n => n.type === 'ClassDeclaration')
      expect(classNode).toBeDefined()

      // Find field declarations
      const fieldNodes = tree.nodes.filter(n => n.type === 'FieldDeclaration')
      expect(fieldNodes.length).toBeGreaterThanOrEqual(2)
    })

    it('should parse constructor', () => {
      const java = `
public class Person {
    public Person(String name) {
        this.name = name;
    }
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find constructor declaration
      const constructorNode = tree.nodes.find(n => n.type === 'ConstructorDeclaration')
      expect(constructorNode).toBeDefined()
    })

    it('should parse interface', () => {
      const java = `
public interface Drawable {
    void draw();
    int getSize();
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find interface declaration
      const interfaceNode = tree.nodes.find(n => n.type === 'InterfaceDeclaration')
      expect(interfaceNode).toBeDefined()
    })

    it('should parse enum', () => {
      const java = `
public enum Day {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find enum declaration
      const enumNode = tree.nodes.find(n => n.type === 'EnumDeclaration')
      expect(enumNode).toBeDefined()
    })

    it('should parse class inheritance', () => {
      const java = `
public class Dog extends Animal implements Pet {
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find class with extends
      const classNode = tree.nodes.find(n => n.type === 'ClassDeclaration')
      expect(classNode).toBeDefined()

      // Find superclass
      const superNode = tree.nodes.find(n => n.type.includes('Super'))
      expect(superNode).toBeDefined()
    })
  })

  describe('Methods', () => {
    it('should parse method with parameters', () => {
      const java = `
public int add(int a, int b) {
    return a + b;
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find method declaration
      const methodNode = tree.nodes.find(n => n.type === 'MethodDeclaration')
      expect(methodNode).toBeDefined()

      // Find formal parameters
      const paramsNode = tree.nodes.find(n => n.type === 'FormalParameters')
      expect(paramsNode).toBeDefined()
    })

    it('should parse static method', () => {
      const java = `
public static void main(String[] args) {
    System.out.println("Hello");
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find method with static modifier
      const methodNode = tree.nodes.find(n => n.type === 'MethodDeclaration')
      expect(methodNode).toBeDefined()
    })

    it('should parse abstract method', () => {
      const java = `
public abstract void draw();
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find abstract method
      const methodNode = tree.nodes.find(n => n.type === 'MethodDeclaration')
      expect(methodNode).toBeDefined()
    })

    it('should parse method with throws', () => {
      const java = `
public void readFile() throws IOException {
    // Read file
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find throws clause
      const throwsNode = tree.nodes.find(n => n.type.includes('Throws'))
      expect(throwsNode).toBeDefined()
    })
  })

  describe('Generics', () => {
    it('should parse generic class', () => {
      const java = `
public class Box<T> {
    private T value;
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find type parameters
      const typeParamsNode = tree.nodes.find(n => n.type === 'TypeParameters')
      expect(typeParamsNode).toBeDefined()
    })

    it('should parse generic method', () => {
      const java = `
public <T> T getValue(T input) {
    return input;
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find type parameters
      const typeParamsNode = tree.nodes.find(n => n.type === 'TypeParameters')
      expect(typeParamsNode).toBeDefined()
    })

    it('should parse generic type usage', () => {
      const java = 'List<String> names = new ArrayList<String>();'
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find type arguments
      const typeArgsNode = tree.nodes.find(n => n.type === 'TypeArguments')
      expect(typeArgsNode).toBeDefined()
    })
  })

  describe('Annotations', () => {
    it('should parse class annotation', () => {
      const java = `
@Entity
@Table(name = "users")
public class User {
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find annotations
      const annotationNodes = tree.nodes.filter(n => n.type.includes('Annotation'))
      expect(annotationNodes.length).toBeGreaterThanOrEqual(2)
    })

    it('should parse method annotation', () => {
      const java = `
@Override
public String toString() {
    return "object";
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find annotation
      const annotationNode = tree.nodes.find(n => n.type.includes('Annotation'))
      expect(annotationNode).toBeDefined()
    })
  })

  describe('Lambda Expressions', () => {
    it('should parse simple lambda', () => {
      const java = 'Function<Integer, Integer> square = x -> x * x;'
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find lambda expression
      const lambdaNode = tree.nodes.find(n => n.type === 'LambdaExpression')
      expect(lambdaNode).toBeDefined()
    })

    it('should parse lambda with block', () => {
      const java = `
Consumer<String> printer = s -> {
    System.out.println(s);
};
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find lambda expression
      const lambdaNode = tree.nodes.find(n => n.type === 'LambdaExpression')
      expect(lambdaNode).toBeDefined()
    })
  })

  describe('Comments', () => {
    it('should parse line comments', () => {
      const java = `
// This is a comment
int x = 42;
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Find comment node
      const commentNode = tree.nodes.find(n => n.type.includes('Comment') || n.data?.text?.includes('//'))
      expect(commentNode).toBeDefined()
    })

    it('should parse block comments', () => {
      const java = `
/* This is a
   multi-line comment */
int x = 42;
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Should have parsed successfully
      expect(tree.nodes[tree.root]).toBeDefined()
    })

    it('should parse javadoc comments', () => {
      const java = `
/**
 * Adds two numbers
 * @param a First number
 * @param b Second number
 * @return Sum of a and b
 */
public int add(int a, int b) {
    return a + b;
}
      `
      const tree = parse(java)

      expect(tree.meta.language).toBe('java')

      // Should have parsed successfully
      expect(tree.nodes[tree.root]).toBeDefined()
    })
  })

  describe('API', () => {
    it('should create parser with factory', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(JavaParser)
    })

    it('should parse with standalone function', () => {
      const tree = parse('int x = 42;')
      expect(tree.meta.language).toBe('java')
    })

    it('should parse async', async () => {
      const tree = await parseAsync('int x = 42;')
      expect(tree.meta.language).toBe('java')
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
      expect(tree!.meta.language).toBe('java')
    })
  })
})
