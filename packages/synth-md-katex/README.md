# @sylphx/synth-md-katex

KaTeX math rendering support for Synth Markdown parser.

## Installation

```bash
npm install @sylphx/synth @sylphx/synth-md @sylphx/synth-md-katex
```

## Usage

```typescript
import { UltraOptimizedMarkdownParser } from '@sylphx/synth-md'
import { katexPlugin } from '@sylphx/synth-md-katex'

const parser = new UltraOptimizedMarkdownParser()

const markdown = `
# Math Examples

Inline math: The equation $E = mc^2$ is famous.

Block math:

$$
\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
$$
`

const tree = parser.parse(markdown, {
  plugins: [katexPlugin()]
})
```

## Options

```typescript
interface KatexPluginOptions {
  inlineMath?: boolean   // Enable inline $...$ (default: true)
  blockMath?: boolean    // Enable block $$...$$ (default: true)
  throwOnError?: boolean // Throw on invalid LaTeX (default: false)
  prerender?: boolean    // Render to HTML (default: false)
}
```

## Features

- Inline math with `$...$` delimiters
- Block math with `$$...$$` delimiters
- LaTeX expression detection and extraction
- Optional pre-rendering to HTML
- Error handling options

## Examples

### Inline Math

```markdown
The Pythagorean theorem is $a^2 + b^2 = c^2$.
```

### Block Math

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### Mixed

```markdown
Given $f(x) = x^2$, we can compute:

$$
\int_0^1 f(x) dx = \frac{1}{3}
$$
```
