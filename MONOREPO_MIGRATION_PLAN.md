# Monorepo Migration Plan

## 🎯 目標

將當前單一 package 架構遷移到 monorepo，支持無限擴展語言 parsers。

## 📊 當前狀態

**現有架構**:
- 單一 package: `@sylphx/synth`
- 所有代碼在 `src/` 目錄
- Markdown parser 完整實現
- 188 tests passing
- 26-42x performance vs remark

**問題**:
- 無法獨立發布不同語言的 parsers
- Bundle size 隨著語言增加而膨脹
- 版本管理困難（所有語言統一版本）
- 社區貢獻困難

## 🏗️ 目標架構

```
ast/  (monorepo root)
├── packages/
│   ├── core/                    # @sylphx/ast-core
│   ├── optimizations/           # @sylphx/ast-optimizations
│   ├── plugin-system/           # @sylphx/ast-plugin-system
│   ├── markdown/                # @sylphx/ast-markdown
│   └── plugins/
│       ├── remark-heading-id/   # @sylphx/remark-heading-id
│       ├── remark-toc/          # @sylphx/remark-toc
│       └── ...
├── examples/
├── docs/
└── pnpm-workspace.yaml
```

## 📦 Package 劃分

### 1. @sylphx/ast-core (核心包)

**職責**: 語言無關的 AST 基礎設施

**文件遷移**:
```
src/types/ → packages/core/src/
  ├── tree.ts
  ├── node.ts
  └── index.ts

src/core/ → packages/core/src/
  ├── query-index.ts
  └── incremental.ts
```

**Dependencies**: 無

**Size**: ~50KB

### 2. @sylphx/ast-optimizations (優化包)

**職責**: 共享性能優化組件

**文件遷移**:
```
src/parsers/markdown/ → packages/optimizations/src/
  ├── batch-tokenizer.ts → batch-processor.ts (泛型化)
  ├── node-pool.ts → object-pool.ts (泛型化)
  └── 新增 streaming-processor.ts
```

**Dependencies**: `@sylphx/ast-core`

**Size**: ~30KB

### 3. @sylphx/ast-plugin-system (插件系統)

**職責**: 通用插件架構

**文件遷移**:
```
src/parsers/markdown/ → packages/plugin-system/src/
  ├── plugin.ts (泛型化)
  └── visitor.ts (新增)
```

**Dependencies**: `@sylphx/ast-core`

**Size**: ~20KB

### 4. @sylphx/ast-markdown (Markdown Parser)

**職責**: Markdown 專用 parser

**文件遷移**:
```
src/parsers/markdown/ → packages/markdown/src/
  ├── ultra-optimized-parser.ts → parser.ts
  ├── ultra-optimized-tokenizer.ts → tokenizer.ts
  ├── ultra-optimized-inline-tokenizer.ts → inline-tokenizer.ts
  ├── gfm-tokenizer.ts
  ├── incremental-parser.ts
  ├── streaming-parser.ts
  └── tokens.ts

benchmarks/ → packages/markdown/benchmarks/
tests/ → packages/markdown/tests/
```

**Dependencies**:
- `@sylphx/ast-core`
- `@sylphx/ast-optimizations`
- `@sylphx/ast-plugin-system`

**Size**: ~200KB

### 5. @sylphx/remark-* (插件包)

**職責**: 官方 Markdown 插件

**文件遷移**:
```
src/parsers/markdown/plugins/ → packages/plugins/
  ├── remark-heading-id/
  ├── remark-toc/
  ├── remark-uppercase-headings/
  └── ...
```

**Dependencies**: `@sylphx/ast-core`, `@sylphx/ast-markdown`

**Size**: ~10-20KB each

## 🔄 遷移步驟

### Phase 1: 準備階段 (1-2 hours)

1. **創建 workspace 配置**
   ```bash
   # Create pnpm-workspace.yaml
   # Create turbo.json
   # Update root package.json
   ```

2. **創建目錄結構**
   ```bash
   mkdir -p packages/{core,optimizations,plugin-system,markdown,plugins}
   ```

3. **設置共享配置**
   ```bash
   # tsconfig.base.json
   # vitest.config.base.ts
   # .eslintrc.base.js
   ```

### Phase 2: Core 包遷移 (2-3 hours)

1. **創建 @sylphx/ast-core**
   - 移動 `src/types/*` → `packages/core/src/`
   - 移動 `src/core/*` → `packages/core/src/`
   - 創建 `packages/core/package.json`
   - 創建 `packages/core/tsconfig.json`
   - 創建 `packages/core/README.md`

2. **測試獨立構建**
   ```bash
   cd packages/core
   pnpm build
   pnpm test
   ```

### Phase 3: Optimizations 包遷移 (2-3 hours)

1. **泛型化優化組件**
   - `batch-tokenizer.ts` → `batch-processor.ts`
   - `node-pool.ts` → `object-pool.ts`
   - 移除 Markdown 特定代碼

2. **創建 @sylphx/ast-optimizations**
   - 創建 package.json
   - 添加對 `@sylphx/ast-core` 的依賴
   - 測試構建

### Phase 4: Plugin System 包遷移 (2-3 hours)

1. **提取插件系統**
   - 泛型化 `plugin.ts`
   - 創建 visitor pattern
   - 創建 transform utilities

2. **創建 @sylphx/ast-plugin-system**
   - 創建 package.json
   - 添加依賴
   - 測試構建

### Phase 5: Markdown 包遷移 (4-6 hours)

1. **重組 Markdown parser**
   - 移動所有 Markdown 特定代碼
   - 更新 imports (指向新的 packages)
   - 移動 tests 和 benchmarks

2. **創建 @sylphx/ast-markdown**
   - 創建 package.json
   - 添加對 core, optimizations, plugin-system 的依賴
   - 更新所有 import 路徑
   - 測試所有 tests (188 tests 應全部通過)
   - 測試所有 benchmarks

### Phase 6: Plugins 包遷移 (2-3 hours)

1. **提取官方插件**
   - 為每個插件創建獨立 package
   - 更新依賴
   - 測試構建

### Phase 7: 驗證與文檔 (2-3 hours)

1. **集成測試**
   - 所有 packages 獨立構建成功
   - 所有 tests 通過
   - 所有 benchmarks 性能無降低

2. **更新文檔**
   - README.md (每個 package)
   - CONTRIBUTING.md
   - 遷移指南

3. **示例代碼**
   - 創建 `examples/` 目錄
   - 基礎使用範例
   - 多語言使用範例
   - 插件使用範例

## ⏱️ 時間估算

| 階段 | 時間 | 說明 |
|------|------|------|
| Phase 1 | 1-2h | 準備工作 |
| Phase 2 | 2-3h | Core 包 |
| Phase 3 | 2-3h | Optimizations 包 |
| Phase 4 | 2-3h | Plugin System 包 |
| Phase 5 | 4-6h | Markdown 包 (最複雜) |
| Phase 6 | 2-3h | Plugins 包 |
| Phase 7 | 2-3h | 驗證與文檔 |
| **總計** | **15-23h** | |

## ✅ 驗證清單

### 構建驗證
- [ ] 所有 packages 獨立構建成功
- [ ] 類型檢查通過 (tsc --noEmit)
- [ ] 無循環依賴

### 測試驗證
- [ ] 188 tests 全部通過
- [ ] 測試覆蓋率無降低
- [ ] 新的 package 結構測試通過

### 性能驗證
- [ ] Benchmark 性能無降低
- [ ] 26-42x vs remark 性能保持
- [ ] Bundle size 符合預期
  - @sylphx/ast-core: ~50KB
  - @sylphx/ast-optimizations: ~30KB
  - @sylphx/ast-plugin-system: ~20KB
  - @sylphx/ast-markdown: ~200KB

### 文檔驗證
- [ ] 每個 package 有 README
- [ ] API 文檔完整
- [ ] 遷移指南清晰
- [ ] Examples 可運行

## 🚨 風險與緩解

### 風險 1: Import 路徑錯誤
**緩解**:
- 使用 TypeScript path mapping 驗證
- 漸進式遷移，每個 package 單獨測試

### 風險 2: 性能降低
**緩解**:
- 每個階段運行 benchmarks
- 對比遷移前後性能

### 風險 3: Breaking Changes
**緩解**:
- 保持向後兼容的 exports
- 提供遷移指南
- 版本號 bump to 2.0.0

### 風險 4: 測試失敗
**緩解**:
- 每個階段驗證測試
- 保留原始測試結構
- Git branch 保護

## 📝 Git 策略

### Branch 策略
```bash
main (當前)
  ↓
  monorepo-migration (新分支)
    ↓ (完成後)
  main (merge)
```

### Commit 策略
- Phase 1: `chore: setup monorepo workspace`
- Phase 2: `refactor(core): extract core package`
- Phase 3: `refactor(optimizations): extract optimizations package`
- Phase 4: `refactor(plugin-system): extract plugin system`
- Phase 5: `refactor(markdown): migrate markdown parser to package`
- Phase 6: `refactor(plugins): extract official plugins`
- Phase 7: `docs: update documentation for monorepo`

## 🎯 成功標準

1. ✅ 所有 188 tests 通過
2. ✅ 性能保持 26-42x vs remark
3. ✅ 所有 packages 可獨立發布
4. ✅ Bundle size 符合預期
5. ✅ 向後兼容 (或提供遷移路徑)
6. ✅ 文檔完整

## 🚀 遷移後的優勢

1. **用戶側**:
   - 只安裝需要的 parsers (減少 bundle size)
   - 獨立版本選擇
   - 更快的安裝速度

2. **開發側**:
   - 獨立發布 (不同 parser 不同版本)
   - 並行開發 (多個 parsers)
   - 社區貢獻更容易

3. **性能**:
   - Tree-shaking 優化
   - 按需加載
   - 共享優化組件

## 📅 建議執行時機

**選項 1: 立即執行** (如果時間充裕)
- 在當前 momentum 下完成
- 一次性完成遷移

**選項 2: 下個 milestone** (推薦)
- 當前功能已足夠完整 (188 tests, 26-42x performance)
- 創建 milestone "v2.0.0 - Monorepo Migration"
- 專注完成遷移，確保質量

**選項 3: 漸進式遷移**
- 先保持當前架構發布 v1.0.0
- 同時在分支上進行遷移
- v2.0.0 發布 monorepo 版本

## 💡 建議

基於當前狀態，我建議：

1. **先發布 v1.0.0**
   - 當前功能完整
   - 性能優異
   - 測試充分
   - 可以立即使用

2. **並行進行 monorepo 遷移**
   - 在新分支上進行
   - 充分測試
   - 作為 v2.0.0 發布

3. **提供遷移指南**
   - 從 v1.x 到 v2.x 的遷移路徑
   - Code mods (如果需要)
   - 向後兼容選項

這樣可以：
- ✅ 立即提供可用的 parser
- ✅ 充分測試 monorepo 架構
- ✅ 避免倉促遷移導致的問題
- ✅ 給用戶選擇權

---

**下一步**: 請確認遷移策略，然後我們開始執行。
