# @sylphx/synth-md-mermaid

Mermaid diagram support for Synth Markdown parser.

## Installation

```bash
npm install @sylphx/synth @sylphx/synth-md @sylphx/synth-md-mermaid
```

## Usage

```typescript
import { UltraOptimizedMarkdownParser } from '@sylphx/synth-md'
import { mermaidPlugin } from '@sylphx/synth-md-mermaid'

const parser = new UltraOptimizedMarkdownParser()

const markdown = `
# My Diagram

\`\`\`mermaid
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Do Something]
  B -->|No| D[Do Nothing]
  C --> E[End]
  D --> E
\`\`\`
`

const tree = parser.parse(markdown, {
  plugins: [mermaidPlugin()]
})
```

## Options

```typescript
interface MermaidPluginOptions {
  validate?: boolean    // Validate Mermaid syntax (default: false)
  prerender?: boolean   // Pre-render to SVG (default: false)
  theme?: 'default' | 'dark' | 'forest' | 'neutral'
}
```

## Features

- Detects code blocks with `mermaid` language
- Transforms them into specialized Mermaid AST nodes
- Optional syntax validation
- Optional pre-rendering to SVG
- Theme support

## Supported Diagrams

- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity Relationship diagrams
- Gantt charts
- Pie charts
- Git graphs
