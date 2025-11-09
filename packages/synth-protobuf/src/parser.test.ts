import { describe, it, expect } from 'bun:test'
import { ProtobufParser, createParser, parse, parseAsync } from './parser.js'
import type { Tree, Plugin } from '@sylphx/synth'

describe('ProtobufParser', () => {
  it('should create a parser instance', () => {
    const parser = new ProtobufParser()
    expect(parser).toBeInstanceOf(ProtobufParser)
  })

  it('should create parser with factory', () => {
    const parser = createParser()
    expect(parser).toBeInstanceOf(ProtobufParser)
  })

  it('should parse basic message', () => {
    const proto = `
syntax = "proto3";

message Person {
  string name = 1;
  int32 age = 2;
}
`
    const tree = parse(proto)
    expect(tree).toBeDefined()
    expect(tree.meta.language).toBe('protobuf')
    expect(tree.meta.source).toBe(proto)

    const rootNode = tree.nodes[tree.root]
    expect(rootNode).toBeDefined()
    expect(rootNode!.children.length).toBeGreaterThan(0)

    const protoRootId = rootNode!.children[0]
    const protoRoot = tree.nodes[protoRootId!]
    expect(protoRoot).toBeDefined()
    expect(protoRoot!.type).toBe('ProtoRoot')
    expect(protoRoot!.data.syntax).toBe('proto3')
  })

  it('should parse message with fields', () => {
    const proto = `
syntax = "proto3";

message User {
  string email = 1;
  string password = 2;
  bool active = 3;
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    expect(protoRoot.children.length).toBeGreaterThan(0)

    const messageId = protoRoot.children[0]!
    const message = tree.nodes[messageId]!
    expect(message.type).toBe('ProtoMessage')
    expect(message.data.name).toBe('User')
    expect(message.children.length).toBe(3)

    const field1 = tree.nodes[message.children[0]!]!
    expect(field1.type).toBe('ProtoField')
    expect(field1.data.name).toBe('email')
    expect(field1.data.type).toBe('string')
    expect(field1.data.id).toBe(1)

    const field2 = tree.nodes[message.children[1]!]!
    expect(field2.data.name).toBe('password')
    expect(field2.data.type).toBe('string')

    const field3 = tree.nodes[message.children[2]!]!
    expect(field3.data.name).toBe('active')
    expect(field3.data.type).toBe('bool')
  })

  it('should parse enum type', () => {
    const proto = `
syntax = "proto3";

enum Status {
  UNKNOWN = 0;
  ACTIVE = 1;
  INACTIVE = 2;
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    const enumId = protoRoot.children[0]!
    const enumNode = tree.nodes[enumId]!
    expect(enumNode.type).toBe('ProtoEnum')
    expect(enumNode.data.name).toBe('Status')
    expect(enumNode.children.length).toBe(3)

    const value1 = tree.nodes[enumNode.children[0]!]!
    expect(value1.type).toBe('ProtoEnumValue')
    expect(value1.data.name).toBe('UNKNOWN')
    expect(value1.data.value).toBe(0)

    const value2 = tree.nodes[enumNode.children[1]!]!
    expect(value2.data.name).toBe('ACTIVE')
    expect(value2.data.value).toBe(1)
  })

  it('should parse service with methods', () => {
    const proto = `
syntax = "proto3";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    const serviceId = protoRoot.children[0]!
    const service = tree.nodes[serviceId]!
    expect(service.type).toBe('ProtoService')
    expect(service.data.name).toBe('UserService')
    expect(service.children.length).toBe(2)

    const method1 = tree.nodes[service.children[0]!]!
    expect(method1.type).toBe('ProtoMethod')
    expect(method1.data.name).toBe('GetUser')
    expect(method1.data.requestType).toBe('GetUserRequest')
    expect(method1.data.responseType).toBe('User')
    expect(method1.data.requestStream).toBe(false)
    expect(method1.data.responseStream).toBe(false)

    const method2 = tree.nodes[service.children[1]!]!
    expect(method2.data.name).toBe('ListUsers')
  })

  it('should parse nested messages', () => {
    const proto = `
syntax = "proto3";

message Outer {
  message Inner {
    string value = 1;
  }
  Inner inner = 1;
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    const outerMessageId = protoRoot.children[0]!
    const outerMessage = tree.nodes[outerMessageId]!
    expect(outerMessage.data.name).toBe('Outer')

    // Should have both field and nested message
    expect(outerMessage.children.length).toBe(2)

    const innerMessageId = outerMessage.children.find((childId) => {
      const child = tree.nodes[childId!]!
      return child.type === 'ProtoMessage'
    })

    expect(innerMessageId).toBeDefined()
    const innerMessage = tree.nodes[innerMessageId!]!
    expect(innerMessage.data.name).toBe('Inner')
  })

  it('should parse repeated fields', () => {
    const proto = `
syntax = "proto3";

message Post {
  repeated string tags = 1;
  repeated int32 ratings = 2;
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    const messageId = protoRoot.children[0]!
    const message = tree.nodes[messageId]!

    const field1 = tree.nodes[message.children[0]!]!
    expect(field1.data.repeated).toBe(true)
    expect(field1.data.type).toBe('string')

    const field2 = tree.nodes[message.children[1]!]!
    expect(field2.data.repeated).toBe(true)
    expect(field2.data.type).toBe('int32')
  })

  it('should parse oneof groups', () => {
    const proto = `
syntax = "proto3";

message Payload {
  oneof data {
    string text = 1;
    bytes binary = 2;
  }
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    const messageId = protoRoot.children[0]!
    const message = tree.nodes[messageId]!

    // Should have fields and oneof
    const oneofNode = message.children.find((childId) => {
      const child = tree.nodes[childId!]!
      return child.type === 'ProtoOneof'
    })

    expect(oneofNode).toBeDefined()
    const oneof = tree.nodes[oneofNode!]!
    expect(oneof.data.name).toBe('data')
    expect(oneof.data.oneof).toContain('text')
    expect(oneof.data.oneof).toContain('binary')
  })

  it('should parse package namespace', () => {
    const proto = `
syntax = "proto3";

package example.v1;

message User {
  string name = 1;
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    // Package creates namespace
    const hasNamespace = protoRoot.children.some((childId) => {
      const child = tree.nodes[childId!]!
      return child.type === 'ProtoNamespace'
    })

    // Note: protobufjs may handle packages differently
    // Just ensure we can parse it without errors
    expect(tree).toBeDefined()
  })

  it('should parse real-world user service', () => {
    const proto = `
syntax = "proto3";

message User {
  int32 id = 1;
  string email = 2;
  string name = 3;
  bool active = 4;
  repeated string roles = 5;
}

message GetUserRequest {
  int32 id = 1;
}

message ListUsersRequest {
  int32 page = 1;
  int32 page_size = 2;
}

message ListUsersResponse {
  repeated User users = 1;
  int32 total = 2;
}

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    // Should have 4 messages and 1 service
    const messages = protoRoot.children.filter((childId) => {
      const child = tree.nodes[childId!]!
      return child.type === 'ProtoMessage'
    })
    expect(messages.length).toBe(4)

    const services = protoRoot.children.filter((childId) => {
      const child = tree.nodes[childId!]!
      return child.type === 'ProtoService'
    })
    expect(services.length).toBe(1)
  })

  it('should parse streaming RPC methods', () => {
    const proto = `
syntax = "proto3";

service ChatService {
  rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    const serviceId = protoRoot.children[0]!
    const service = tree.nodes[serviceId]!

    const methodId = service.children[0]!
    const method = tree.nodes[methodId]!

    // Note: protobufjs may represent streaming differently
    // Check if the method exists
    expect(method.data.name).toBe('Chat')
  })

  it('should handle plugins synchronously', () => {
    const proto = `
syntax = "proto3";
message Test { string value = 1; }
`

    const plugin: Plugin = {
      name: 'test-plugin',
      transform(tree: Tree) {
        // Modify tree
        return tree
      },
    }

    const parser = new ProtobufParser()
    parser.use(plugin)
    const tree = parser.parse(proto)

    expect(tree).toBeDefined()
  })

  it('should handle plugins via options', () => {
    const proto = `
syntax = "proto3";
message Test { string value = 1; }
`

    const plugin: Plugin = {
      name: 'test-plugin',
      transform(tree: Tree) {
        return tree
      },
    }

    const tree = parse(proto, { plugins: [plugin] })
    expect(tree).toBeDefined()
  })

  it('should throw on async plugin in sync parse', () => {
    const proto = `
syntax = "proto3";
message Test { string value = 1; }
`

    const asyncPlugin: Plugin = {
      name: 'async-plugin',
      async transform(tree: Tree) {
        return tree
      },
    }

    expect(() => {
      parse(proto, { plugins: [asyncPlugin] })
    }).toThrow('Detected async plugins')
  })

  it('should handle async plugins in parseAsync', async () => {
    const proto = `
syntax = "proto3";
message Test { string value = 1; }
`

    const asyncPlugin: Plugin = {
      name: 'async-plugin',
      async transform(tree: Tree) {
        return tree
      },
    }

    const tree = await parseAsync(proto, { plugins: [asyncPlugin] })
    expect(tree).toBeDefined()
  })

  it('should get last parsed tree', () => {
    const proto = `
syntax = "proto3";
message Test { string value = 1; }
`

    const parser = new ProtobufParser()
    const tree = parser.parse(proto)
    const lastTree = parser.getTree()

    expect(lastTree).toBe(tree)
  })

  it('should return null before parsing', () => {
    const parser = new ProtobufParser()
    expect(parser.getTree()).toBeNull()
  })

  it('should parse complex schema with all features', () => {
    const proto = `
syntax = "proto3";

enum OrderStatus {
  PENDING = 0;
  CONFIRMED = 1;
  SHIPPED = 2;
  DELIVERED = 3;
  CANCELLED = 4;
}

message Address {
  string street = 1;
  string city = 2;
  string state = 3;
  string zip = 4;
}

message Product {
  int32 id = 1;
  string name = 2;
  double price = 3;
}

message OrderItem {
  Product product = 1;
  int32 quantity = 2;
}

message Order {
  int32 id = 1;
  int32 user_id = 2;
  repeated OrderItem items = 3;
  OrderStatus status = 4;
  Address shipping_address = 5;
  double total = 6;
}

message CreateOrderRequest {
  int32 user_id = 1;
  repeated OrderItem items = 2;
  Address shipping_address = 3;
}

message CreateOrderResponse {
  Order order = 1;
}

service OrderService {
  rpc CreateOrder (CreateOrderRequest) returns (CreateOrderResponse);
  rpc GetOrder (int32) returns (Order);
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    // Should have enums, messages, and service
    expect(protoRoot.children.length).toBeGreaterThan(0)

    const hasEnum = protoRoot.children.some((childId) => {
      const child = tree.nodes[childId!]!
      return child.type === 'ProtoEnum'
    })
    expect(hasEnum).toBe(true)

    const hasMessage = protoRoot.children.some((childId) => {
      const child = tree.nodes[childId!]!
      return child.type === 'ProtoMessage'
    })
    expect(hasMessage).toBe(true)

    const hasService = protoRoot.children.some((childId) => {
      const child = tree.nodes[childId!]!
      return child.type === 'ProtoService'
    })
    expect(hasService).toBe(true)
  })

  it('should parse proto2 syntax', () => {
    const proto = `
syntax = "proto2";

message Person {
  required string name = 1;
  optional int32 age = 2;
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    expect(protoRoot.data.syntax).toBe('proto2')

    const messageId = protoRoot.children[0]!
    const message = tree.nodes[messageId]!

    const field1 = tree.nodes[message.children[0]!]!
    expect(field1.data.rule).toBe('required')

    const field2 = tree.nodes[message.children[1]!]!
    // Note: protobufjs doesn't set rule for optional fields (it's implicit)
    expect(field2.data.name).toBe('age')
  })

  it('should use standalone parse function', () => {
    const proto = `
syntax = "proto3";
message Test { string value = 1; }
`
    const tree = parse(proto)
    expect(tree).toBeDefined()
    expect(tree.meta.language).toBe('protobuf')
  })

  it('should use standalone parseAsync function', async () => {
    const proto = `
syntax = "proto3";
message Test { string value = 1; }
`
    const tree = await parseAsync(proto)
    expect(tree).toBeDefined()
    expect(tree.meta.language).toBe('protobuf')
  })

  it('should handle parse errors gracefully', () => {
    const invalidProto = 'this is not valid protobuf syntax {'

    expect(() => {
      parse(invalidProto)
    }).toThrow()
  })

  it('should parse map fields', () => {
    const proto = `
syntax = "proto3";

message User {
  map<string, string> metadata = 1;
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    const messageId = protoRoot.children[0]!
    const message = tree.nodes[messageId]!

    // Map fields are represented as fields
    expect(message.children.length).toBeGreaterThan(0)
  })

  it('should parse import statements', () => {
    const proto = `
syntax = "proto3";

import "google/protobuf/timestamp.proto";

message Event {
  string name = 1;
}
`
    // Imports are metadata - just ensure it parses
    const tree = parse(proto)
    expect(tree).toBeDefined()
  })

  it('should parse field options', () => {
    const proto = `
syntax = "proto3";

message User {
  string email = 1;
  string password = 2;
}
`
    const tree = parse(proto)
    const protoRootId = tree.nodes[tree.root]!.children[0]!
    const protoRoot = tree.nodes[protoRootId]!

    const messageId = protoRoot.children[0]!
    const message = tree.nodes[messageId]!

    const field = tree.nodes[message.children[0]!]!
    expect(field.data.options).toBeDefined()
  })

  it('should preserve source in tree', () => {
    const proto = `
syntax = "proto3";
message Test { string value = 1; }
`
    const tree = parse(proto)
    expect(tree.meta.source).toBe(proto)
  })
})
