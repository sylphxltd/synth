# 點解用 Acorn？

## TL;DR

**Acorn = 戰鬥力測試過嘅 JavaScript Parser**

```typescript
import * as acorn from 'acorn'

// 就咁簡單！
const ast = acorn.parse('const x = 42;')

// 完成！唔使自己寫 parser
```

## 乜係 Acorn？

### 基本資料

- **作者**: Marijn Haverbeke (CodeMirror 作者)
- **開源**: MIT License
- **用家**: 3560 萬個項目
- **大小**: ~40KB
- **語言**: 純 JavaScript
- **標準**: ESTree (JavaScript AST 標準)

### 做咩用？

```
JavaScript 字串  →  [Acorn]  →  ESTree AST
```

**Example:**
```javascript
'const x = 42;'
      ↓
{
  type: 'Program',
  body: [{
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [...]
  }]
}
```

## 點解唔自己寫 Parser？

### 自己寫 JS Parser 要處理：

❌ **Lexical Analysis (詞法分析)**
```
'const x = 42;'
   ↓
['const', 'x', '=', '42', ';']
```

❌ **Syntax Analysis (語法分析)**
```
Tokens → Parse Tree → AST
```

❌ **ECMAScript Spec (1000+ 頁)**
- Variable declarations (var, let, const)
- Functions (regular, arrow, async, generator)
- Classes (extends, super, static, private fields)
- Destructuring (objects, arrays, nested)
- Spread/rest operators
- Template literals
- Async/await
- Modules (import/export)
- ... 同埋幾百個其他 features

❌ **Edge Cases**
```javascript
// Automatic Semicolon Insertion
return
{
  value: 42
}  // Returns undefined, not { value: 42 }!

// Label statements vs object literals
label: { break label; }

// Arrow functions vs comparisons
(x) => x  // Arrow function
(x) > x   // Comparison

// Regex vs division
/regex/ / 2  // Division
/regex/g     // Regex with flag
```

❌ **TypeScript Support**
```typescript
interface User<T> {
  id: T;
  name?: string;
}
```

❌ **JSX Support**
```jsx
const element = <div className="app">Hello</div>;
```

❌ **持續更新**
- ES2015 (ES6): Classes, arrow functions, let/const
- ES2016: Exponentiation operator (**)
- ES2017: Async/await
- ES2018: Rest/spread properties
- ES2019: Optional catch binding
- ES2020: Optional chaining (?.), nullish coalescing (??)
- ES2021: Logical assignment (&&=, ||=, ??=)
- ES2022: Private fields (#field), top-level await
- ES2023: Array findLast(), hashbang (#!)
- ES2024: ...
- **每年都有新語法！**

### 用 Acorn：

✅ **一行代碼搞掂**
```typescript
const ast = acorn.parse(code, { ecmaVersion: 'latest' })
```

✅ **自動更新**
```bash
bun update acorn  # 新語法自動支援
```

✅ **戰鬥力證明**
- **3560萬個項目**用緊
- Webpack, ESLint, Rollup, Prettier 都用
- 10+ 年開發經驗

## 其他 Parser 對比

### Acorn vs Babel

```
Acorn:
  - Size: 40KB
  - Speed: ⚡⚡⚡ 快
  - 用途: Parse only
  - 輸出: ESTree AST

Babel:
  - Size: 500KB (12x 大)
  - Speed: ⚡ 慢
  - 用途: Parse + Transform + Generate
  - 輸出: Babel AST (similar to ESTree)
```

**點解唔用 Babel？**
- 我哋只需要 **parse**，唔需要 transform
- Babel 太重、太慢
- Acorn 夠晒用

### Acorn vs Esprima

```
Acorn:
  - 支援: ES3 - ES2024+
  - 活躍: ✅ 持續更新
  - Plugins: ✅ TypeScript, JSX

Esprima:
  - 支援: ES3 - ES2017
  - 活躍: ⚠️ 少更新 (last update 2019)
  - Plugins: ❌ 無
```

**點解唔用 Esprima？**
- 太舊，唔支援新語法
- 無 TypeScript support

### Acorn vs SWC

```
Acorn:
  - 語言: JavaScript
  - 整合: ✅ 簡單
  - Speed: ⚡⚡⚡ 快

SWC:
  - 語言: Rust
  - 整合: ⚠️ 需要 native bindings
  - Speed: ⚡⚡⚡⚡⚡ 超快
```

**點解唔用 SWC？**
- Rust 寫，難整合到純 JS 項目
- Native dependencies 麻煩
- Acorn 已經夠快

### Acorn vs 手寫 Parser

```
Acorn:
  - 開發時間: 0 小時 (npm install)
  - 維護成本: 0 (自動更新)
  - Bug 風險: 低 (3560萬項目驗證)
  - ES 支援: 自動跟進

手寫 Parser:
  - 開發時間: 100+ 小時
  - 維護成本: 高 (每年跟 ES spec)
  - Bug 風險: 高 (自己負責)
  - ES 支援: 自己實現
```

## Acorn 喺 Synth 嘅角色

### 架構分層

```
┌─────────────────────────────────────┐
│   Your Code (JavaScript/TypeScript)  │
└─────────────────┬───────────────────┘
                  │
                  ↓
┌─────────────────────────────────────┐
│          Acorn Parser                │  ← 我哋用 Acorn 做呢層
│  - Lexing (tokenization)             │
│  - Parsing (syntax analysis)         │
│  - ESTree AST generation             │
└─────────────────┬───────────────────┘
                  │
                  ↓ ESTree AST
┌─────────────────────────────────────┐
│      Synth Converter                 │  ← 我哋寫呢層
│  - ESTree → Synth BaseNode           │
│  - Universal AST format              │
│  - Plugin system                     │
└─────────────────┬───────────────────┘
                  │
                  ↓ Synth Universal AST
┌─────────────────────────────────────┐
│         Synth Tools                  │  ← 我哋寫呢層
│  - Formatter (Prettier-like)         │
│  - Minifier (Terser-like)            │
│  - Linter (ESLint-like)              │
│  - Code analysis                     │
└─────────────────────────────────────┘
```

### 責任分工

**Acorn 負責：**
- ✅ Parse JavaScript → ESTree AST
- ✅ 支援所有 ECMAScript 版本
- ✅ 處理 syntax errors
- ✅ Position tracking (line, column)
- ✅ TypeScript support (via plugin)

**Synth 負責：**
- ✅ ESTree → Universal AST 轉換
- ✅ Cross-language AST 格式
- ✅ Plugin system
- ✅ Formatter, Minifier, 等工具
- ✅ Language-agnostic transformations

### 點解呢樣分工好？

**1. 專注喺 Value**
```typescript
// 我哋唔使寫呢啲
function parseVariableDeclaration() { ... }  ❌
function parseArrowFunction() { ... }        ❌
function parseClassDeclaration() { ... }     ❌

// 專注喺呢啲
function convertToUniversalAST() { ... }     ✅
function formatCode() { ... }                ✅
function minifyCode() { ... }                ✅
```

**2. 利用現有工具**
```
站喺巨人肩膀上：
- Acorn: 10+ 年開發
- 3560 萬項目驗證
- 126 個貢獻者
```

**3. 自動更新支援**
```bash
# JavaScript 新版本出？
bun update acorn

# Done! 自動支援新語法
```

**4. 保持簡單**
```typescript
// 全部 parsing logic 封裝喺一個調用
const estreeAST = acorn.parse(code, options)

// 我哋只需要轉換格式
const synthAST = convertESTreeToSynth(estreeAST)
```

## 實際例子

### Example 1: 基本使用

```typescript
import * as acorn from 'acorn'
import { convertToSynth } from '@sylphx/synth-js'

// Acorn: Parse JS → ESTree
const estree = acorn.parse('const x = 42;', {
  ecmaVersion: 'latest'
})

// Synth: ESTree → Universal AST
const synth = convertToSynth(estree)

// 現在可以用 Synth tools
format(synth)   // Format code
minify(synth)   // Minify code
analyze(synth)  // Analyze code
```

### Example 2: TypeScript

```typescript
import * as acorn from 'acorn'
import tsPlugin from 'acorn-typescript'

const acornTS = acorn.Parser.extend(tsPlugin())

// Acorn + Plugin: Parse TS → ESTree (with TS nodes)
const estree = acornTS.parse(`
  interface User {
    name: string;
  }
`, { ecmaVersion: 'latest' })

// Synth: 轉換成 universal format
const synth = convertToSynth(estree)

// TypeScript nodes 都保留喺 Synth AST
```

### Example 3: Error Handling

```typescript
try {
  // Acorn 處理 syntax errors
  acorn.parse('const x = ;', { ecmaVersion: 'latest' })
} catch (error) {
  // Acorn 提供清晰 error message
  console.log(error.message)  // "Unexpected token"
  console.log(error.pos)      // 10
  console.log(error.loc)      // { line: 1, column: 10 }
}

// 我哋只需要 wrap 成 SynthError
throw new SynthError(`Parse error: ${error.message}`, 'PARSE_ERROR')
```

## 總結

### 用 Acorn 嘅原因

1. **戰鬥力測試** - 3560萬項目證明
2. **自動更新** - 跟住 ECMAScript 最新版本
3. **Plugin 系統** - TypeScript, JSX support
4. **輕量快速** - 40KB, 純 JS
5. **標準格式** - ESTree AST (業界標準)
6. **專注 Value** - 我哋寫 tools，唔使寫 parser

### Acorn 喺 Synth 嘅定位

```
Acorn:  JavaScript 專家  (Parse JS → ESTree)
Synth:  AST 通用層      (Universal format + Tools)
```

### 如果冇 Acorn

我哋需要：
- ❌ 寫完整 JS parser (100+ 小時)
- ❌ 每年跟 ES spec 更新
- ❌ 自己處理所有 edge cases
- ❌ 自己加 TypeScript support
- ❌ 自己加 JSX support
- ❌ 持續修 bugs

### 用咗 Acorn

我哋可以：
- ✅ 一行代碼搞掂 parsing
- ✅ 專注喺 universal AST 設計
- ✅ 專注喺 formatter/minifier
- ✅ 專注喺 cross-language features
- ✅ 自動支援新 JS 語法

---

**結論：Acorn 係正確選擇！** 🌰✨
