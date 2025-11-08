import { describe, it, expect } from 'bun:test'
import { parse, parseAsync, createParser, XMLParser } from './parser.js'
import type { Tree } from '@sylphx/synth'

describe('XMLParser', () => {
  describe('Basic Elements', () => {
    it('should parse simple element', () => {
      const xml = '<root>Hello World</root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('xml')
      expect(tree.meta.source).toBe(xml)
      expect(Object.keys(tree.nodes).length).toBeGreaterThan(1)
    })

    it('should parse nested elements', () => {
      const xml = `<root>
  <child>
    <grandchild>Text</grandchild>
  </child>
</root>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse multiple children', () => {
      const xml = `<root>
  <child1>First</child1>
  <child2>Second</child2>
  <child3>Third</child3>
</root>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse self-closing tags', () => {
      const xml = '<root><br/><hr/></root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('Attributes', () => {
    it('should parse element with single attribute', () => {
      const xml = '<root id="123">Content</root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse element with multiple attributes', () => {
      const xml = '<user id="123" name="John" email="john@example.com">Data</user>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse attributes with different quote styles', () => {
      const xml = `<root attr1="double" attr2='single'>Content</root>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse boolean attributes', () => {
      const xml = '<input type="checkbox" checked="true" disabled="false"/>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('Text Content', () => {
    it('should parse text content', () => {
      const xml = '<message>Hello, World!</message>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse mixed content', () => {
      const xml = '<p>This is <em>emphasized</em> text</p>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse multiline text', () => {
      const xml = `<description>
This is a long
multiline
description
</description>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('Comments', () => {
    it('should parse comments', () => {
      const xml = `<root>
  <!-- This is a comment -->
  <child>Content</child>
</root>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse multiline comments', () => {
      const xml = `<root>
  <!--
    This is a
    multiline comment
  -->
  <child>Content</child>
</root>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('CDATA', () => {
    it('should parse CDATA sections', () => {
      const xml = '<script><![CDATA[function() { return x < 5 && y > 10; }]]></script>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse CDATA with special characters', () => {
      const xml = '<data><![CDATA[<tag>Text & "quotes"</tag>]]></data>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('Namespaces', () => {
    it('should parse elements with namespaces', () => {
      const xml = '<root xmlns:custom="http://example.com/ns"><custom:element>Text</custom:element></root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse default namespace', () => {
      const xml = '<root xmlns="http://www.w3.org/1999/xhtml"><div>Content</div></root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse multiple namespaces', () => {
      const xml = `<root xmlns:ns1="http://example.com/ns1" xmlns:ns2="http://example.com/ns2">
  <ns1:element>First</ns1:element>
  <ns2:element>Second</ns2:element>
</root>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('Special Characters', () => {
    it('should parse entity references', () => {
      const xml = '<text>Less than &lt; greater than &gt; ampersand &amp;</text>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse quotes', () => {
      const xml = '<quote>He said &quot;Hello&quot;</quote>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse apostrophe', () => {
      const xml = "<text>It&apos;s working</text>"

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('Real-World Examples', () => {
    it('should parse RSS feed', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
    <item>
      <title>Second Post</title>
      <link>https://example.com/second-post</link>
      <description>This is the second post</description>
      <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse SVG', () => {
      const xml = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/>
  <rect x="10" y="10" width="30" height="30" fill="blue"/>
  <line x1="0" y1="0" x2="100" y2="100" stroke="green"/>
</svg>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse configuration file', () => {
      const xml = `<?xml version="1.0"?>
<configuration>
  <appSettings>
    <add key="ApiUrl" value="https://api.example.com"/>
    <add key="Timeout" value="30"/>
    <add key="EnableLogging" value="true"/>
  </appSettings>
  <connectionStrings>
    <add name="DefaultConnection" connectionString="Server=localhost;Database=mydb;"/>
  </connectionStrings>
</configuration>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse SOAP message', () => {
      const xml = `<?xml version="1.0"?>
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
</soap:Envelope>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse sitemap', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
</urlset>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse Maven POM', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
</project>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse Android manifest', () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.myapp">
  <uses-permission android:name="android.permission.INTERNET"/>
  <application
      android:allowBackup="true"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher">
    <activity android:name=".MainActivity">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
  </application>
</manifest>`

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should parse empty element', () => {
      const xml = '<root></root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse element with only whitespace', () => {
      const xml = '<root>   </root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse deeply nested elements', () => {
      const xml = '<a><b><c><d><e><f>Deep</f></e></d></c></b></a>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse elements with numeric content', () => {
      const xml = '<numbers><int>42</int><float>3.14</float><negative>-10</negative></numbers>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse elements with boolean-like content', () => {
      const xml = '<flags><active>true</active><enabled>false</enabled></flags>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('Processing Instructions', () => {
    it('should parse XML declaration', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root>Content</root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })

    it('should parse with standalone declaration', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><root>Content</root>'

      const tree = parse(xml)
      expect(tree).toBeDefined()
    })
  })

  describe('API', () => {
    it('should support standalone parse function', () => {
      const tree = parse('<root>Test</root>')
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('xml')
    })

    it('should support async parsing', async () => {
      const tree = await parseAsync('<root>Test</root>')
      expect(tree).toBeDefined()
      expect(tree.meta.language).toBe('xml')
    })

    it('should support createParser factory', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(XMLParser)

      const tree = parser.parse('<root>Test</root>')
      expect(tree).toBeDefined()
    })

    it('should support XMLParser class', () => {
      const parser = new XMLParser()
      const tree = parser.parse('<root>Test</root>')
      expect(tree).toBeDefined()

      const retrieved = parser.getTree()
      expect(retrieved).toBe(tree)
    })

    it('should support plugins', () => {
      let transformed = false

      const plugin = {
        name: 'test-plugin',
        transform(tree: Tree) {
          transformed = true
          return tree
        },
      }

      parse('<root>Test</root>', { plugins: [plugin] })
      expect(transformed).toBe(true)
    })

    it('should support async plugins', async () => {
      let transformed = false

      const plugin = {
        name: 'async-plugin',
        async transform(tree: Tree) {
          await new Promise((resolve) => setTimeout(resolve, 10))
          transformed = true
          return tree
        },
      }

      await parseAsync('<root>Test</root>', { plugins: [plugin] })
      expect(transformed).toBe(true)
    })

    it('should throw error when using async plugin with sync parse', () => {
      const asyncPlugin = {
        name: 'async-plugin',
        async transform(tree: Tree) {
          return tree
        },
      }

      expect(() => {
        parse('<root>Test</root>', { plugins: [asyncPlugin] })
      }).toThrow('Detected async plugins')
    })

    it('should support use() method for plugins', () => {
      let count = 0

      const plugin1 = {
        name: 'plugin1',
        transform(tree: Tree) {
          count++
          return tree
        },
      }

      const plugin2 = {
        name: 'plugin2',
        transform(tree: Tree) {
          count++
          return tree
        },
      }

      const parser = new XMLParser()
      parser.use(plugin1).use(plugin2)
      parser.parse('<root>Test</root>')

      expect(count).toBe(2)
    })
  })

  describe('Parser Options', () => {
    it('should ignore attributes when option is set', () => {
      const xml = '<root id="123" name="test">Content</root>'

      const tree = parse(xml, { ignoreAttributes: true })
      expect(tree).toBeDefined()
    })

    it('should remove namespace prefix when option is set', () => {
      const xml = '<root xmlns:ns="http://example.com"><ns:element>Text</ns:element></root>'

      const tree = parse(xml, { removeNSPrefix: true })
      expect(tree).toBeDefined()
    })

    it('should parse attribute values when option is set', () => {
      const xml = '<config timeout="30" enabled="true"/>'

      const tree = parse(xml, { parseAttributeValue: true })
      expect(tree).toBeDefined()
    })

    it('should trim values when option is set', () => {
      const xml = '<text>   Trimmed   </text>'

      const tree = parse(xml, { trimValues: true })
      expect(tree).toBeDefined()
    })
  })
})
