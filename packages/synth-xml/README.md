# @sylphx/synth-xml

XML parser using Synth's universal AST. Conversion layer over fast-xml-parser.

## Features

- ✅ **Strategic Dependency** - Uses fast-xml-parser (battle-tested, high-performance)
- 🚀 **Full XML 1.0 Support** - Elements, attributes, text, comments, CDATA
- 🎯 **Universal AST** - Converts XML to Synth's language-agnostic format
- 🔌 **Plugin System** - Transform AST with sync/async plugins
- 📦 **Production Ready** - fast-xml-parser used in thousands of projects

## Installation

```bash
npm install @sylphx/synth-xml
```

## Usage

### Quick Start

```typescript
import { parse } from '@sylphx/synth-xml'

const xml = `
<user id="123">
  <name>John Doe</name>
  <email>john@example.com</email>
</user>
`

const tree = parse(xml)
console.log(tree.nodes[tree.root])
```

### Parser API

```typescript
import { XMLParser, createParser, parse, parseAsync } from '@sylphx/synth-xml'

// Standalone function (recommended)
const tree = parse('<root>Hello World</root>')

// Async parsing (for plugins)
const tree = await parseAsync('<root>Hello World</root>')

// Class instance
const parser = new XMLParser()
const tree = parser.parse('<root>Hello World</root>')

// Factory function
const parser = createParser()
const tree = parser.parse('<root>Hello World</root>')
```

### Parser Options

```typescript
import { parse } from '@sylphx/synth-xml'

// Ignore attributes
const tree = parse(xml, { ignoreAttributes: true })

// Remove namespace prefixes
const tree = parse(xml, { removeNSPrefix: true })

// Parse attribute values as numbers/booleans
const tree = parse(xml, { parseAttributeValue: true })

// Trim whitespace from values
const tree = parse(xml, { trimValues: true })
```

### Plugin System

```typescript
import { parse, type Tree } from '@sylphx/synth-xml'

// Sync plugin
const myPlugin = {
  name: 'my-plugin',
  transform(tree: Tree) {
    // Modify tree
    return tree
  }
}

const tree = parse(xmlSource, { plugins: [myPlugin] })

// Async plugin
const asyncPlugin = {
  name: 'async-plugin',
  async transform(tree: Tree) {
    // Async modifications
    return tree
  }
}

const tree = await parseAsync(xmlSource, { plugins: [asyncPlugin] })
```

## AST Structure

The parser generates a universal Synth AST by converting fast-xml-parser's output. Each node includes:

### Node Structure

```typescript
{
  type: 'Element' | 'Text' | 'Comment' | 'CDATA',
  parent: NodeId,
  children: [NodeId],
  span: {
    start: { offset, line, column },
    end: { offset, line, column }
  },
  data: {
    tagName?: string,      // For Element nodes
    attributes?: object,   // For Element nodes
    text?: string          // For Text/Comment/CDATA nodes
  }
}
```

## Supported XML Features

### Basic Elements
- ✅ Start and end tags
- ✅ Self-closing tags `<br/>`
- ✅ Nested elements
- ✅ Empty elements

### Attributes
- ✅ Single and multiple attributes
- ✅ Double and single quotes
- ✅ Boolean attributes
- ✅ Numeric attributes

### Content Types
- ✅ Text content
- ✅ Mixed content (text + elements)
- ✅ CDATA sections
- ✅ Comments
- ✅ Multiline content

### Namespaces
- ✅ Default namespaces
- ✅ Prefixed namespaces
- ✅ Multiple namespaces
- ✅ Namespace declarations

### Special Characters
- ✅ Entity references (`&lt;`, `&gt;`, `&amp;`, `&quot;`, `&apos;`)
- ✅ Numeric character references
- ✅ Escaped characters

### Advanced Features
- ✅ Processing instructions
- ✅ XML declarations
- ✅ Deep nesting
- ✅ Whitespace handling

## Examples

### Simple Document

```typescript
const xml = `
<book>
  <title>The Great Gatsby</title>
  <author>F. Scott Fitzgerald</author>
  <year>1925</year>
</book>
`

const tree = parse(xml)
```

### With Attributes

```typescript
const xml = `
<user id="123" role="admin">
  <name>John Doe</name>
  <email verified="true">john@example.com</email>
</user>
`

const tree = parse(xml)
```

### RSS Feed

```typescript
const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example Blog</title>
    <link>https://example.com</link>
    <description>A sample blog</description>
    <item>
      <title>First Post</title>
      <link>https://example.com/first-post</link>
      <description>This is the first post</description>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
`

const tree = parse(xml)
```

### SVG

```typescript
const xml = `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/>
  <rect x="10" y="10" width="30" height="30" fill="blue"/>
  <line x1="0" y1="0" x2="100" y2="100" stroke="green"/>
</svg>
`

const tree = parse(xml)
```

### Configuration File

```typescript
const xml = `
<?xml version="1.0"?>
<configuration>
  <appSettings>
    <add key="ApiUrl" value="https://api.example.com"/>
    <add key="Timeout" value="30"/>
    <add key="EnableLogging" value="true"/>
  </appSettings>
  <connectionStrings>
    <add name="DefaultConnection" connectionString="Server=localhost;Database=mydb;"/>
  </connectionStrings>
</configuration>
`

const tree = parse(xml)
```

### SOAP Message

```typescript
const xml = `
<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <auth:Authentication xmlns:auth="http://example.com/auth">
      <auth:Username>user123</auth:Username>
      <auth:Password>pass456</auth:Password>
    </auth:Authentication>
  </soap:Header>
  <soap:Body>
    <m:GetUserInfo xmlns:m="http://example.com/user">
      <m:UserId>123</m:UserId>
    </m:GetUserInfo>
  </soap:Body>
</soap:Envelope>
`

const tree = parse(xml)
```

### Sitemap

```typescript
const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`

const tree = parse(xml)
```

### Maven POM

```typescript
const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0.0</version>
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.13.2</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
`

const tree = parse(xml)
```

### CDATA Sections

```typescript
const xml = `
<script>
  <![CDATA[
    function compare(a, b) {
      return a < 5 && b > 10;
    }
  ]]>
</script>
`

const tree = parse(xml)
```

### Comments

```typescript
const xml = `
<root>
  <!-- This is a comment -->
  <child>Content</child>
  <!--
    This is a
    multiline comment
  -->
</root>
`

const tree = parse(xml)
```

## Performance

Leverages fast-xml-parser's proven performance:
- Extremely fast parsing (up to 10x faster than alternatives)
- Low memory footprint
- Support for large XML files
- Efficient streaming support

## Development Philosophy

This package uses a **strategic dependency** approach:

- **Third-party parser:** fast-xml-parser (battle-tested, high-performance)
- **Our conversion layer:** fast-xml-parser output → Synth universal AST
- **Our value:** Universal format, cross-language tools, plugin system

### Why fast-xml-parser?

- ❌ Writing XML parser: 100+ hours, complex spec, edge cases
- ✅ Using fast-xml-parser: Battle-tested, high-performance, actively maintained
- **Our focus:** Universal AST format, transformations, cross-language operations

## Use Cases

- **Configuration parsing:** Parse XML config files
- **RSS/Atom feeds:** Parse and analyze feeds
- **SVG manipulation:** Parse and transform SVG files
- **SOAP services:** Parse SOAP messages
- **Build systems:** Parse Maven POM, Ant, MSBuild files
- **Android development:** Parse Android manifests
- **Document analysis:** Extract content from XML documents
- **Cross-language tools:** Analyze XML + JavaScript + Python together

## Options Reference

```typescript
interface XMLParseOptions {
  // Ignore all attributes
  ignoreAttributes?: boolean

  // Remove namespace prefix from tag names
  removeNSPrefix?: boolean

  // Parse attribute values as numbers/booleans
  parseAttributeValue?: boolean

  // Parse tag values as numbers/booleans
  parseTagValue?: boolean

  // Trim whitespace from values
  trimValues?: boolean

  // Plugin system
  plugins?: Plugin[]
}
```

## License

MIT

---

**Note:** This package uses fast-xml-parser for parsing. See [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) for parser details.
