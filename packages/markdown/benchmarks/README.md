# Flux AST Benchmarks

性能基准测试，对比 Flux AST 与竞品性能。

## 运行基准测试

```bash
# 运行所有基准测试
npm run bench

# 只运行特定文件
npx vitest bench benchmarks/unified.bench.ts
npx vitest bench benchmarks/comparison.bench.ts
```

## 测试文件

### `unified.bench.ts`
对比 Flux AST 与 unified/remark 的性能：
- 解析性能
- 编译性能
- 转换性能
- 遍历性能
- 内存效率

### `comparison.bench.ts`
Flux AST 内部各种操作的性能测试：
- 核心操作
- 树操作
- 转换操作
- 编译性能
- 压力测试

### `test-data.ts`
测试数据定义：
- Small (1KB)
- Medium (3KB)
- Large (10KB)
- XL / XXL / XXXL (可生成)

## 测试维度

1. **解析速度** - 从源代码到 AST
2. **编译速度** - 从 AST 到源代码
3. **转换速度** - AST 修改操作
4. **遍历速度** - 树遍历和查询
5. **内存效率** - 内存占用和 GC 压力

## 预期结果

### 目标性能
- 纯 TypeScript 版本：比 unified **3-10x 更快**
- 未来 WASM 版本：比 unified **50-100x 更快**

### 关键优势
- ✅ Arena-based 内存布局
- ✅ NodeId 系统（避免指针追踪）
- ✅ 扁平数组存储（缓存友好）
- ✅ String interning（减少内存）

## 阅读基准结果

```
✓ benchmarks/unified.bench.ts (20 tests) 5000ms
  ✓ Parse Performance (6 tests)
    · flux: parse small (1KB)          1.23 ms/iter
    · unified: parse small (1KB)       4.56 ms/iter  ← 3.7x slower
    · flux: parse medium (3KB)         3.45 ms/iter
    · unified: parse medium (3KB)      15.2 ms/iter  ← 4.4x slower
```

数字越小越好！

## 性能优化检查清单

- [ ] 热路径识别
- [ ] 内存分配优化
- [ ] 算法复杂度分析
- [ ] 缓存策略
- [ ] 批量操作优化
- [ ] 对象池
- [ ] 惰性求值

## 未来优化方向

1. **Short-term (TS)**
   - Object pooling
   - Lazy evaluation
   - Better caching

2. **Mid-term (TS)**
   - SIMD-like operations
   - Parallel processing
   - Memory optimization

3. **Long-term (WASM)**
   - Rust core engine
   - True SIMD
   - Multi-threading
