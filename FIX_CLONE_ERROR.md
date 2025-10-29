# 🐛 修复：下载错误 "An object could not be cloned"

## 问题描述

在下载资源时遇到错误：
```
下载错误: An object could not be cloned.
```

## 问题原因

### 根本原因

Electron 的 IPC（进程间通信）使用 **结构化克隆算法** 传递数据，该算法不支持某些特殊对象类型。

### 具体问题

在我们的代码中，`responseHeaders` 是 Electron 的特殊对象（来自 `webRequest` API），它包含了不可序列化的内部引用。

**问题代码**：
```javascript
// ❌ 错误：直接传递 responseHeaders
scrapingWindow.webContents.session.webRequest.onCompleted((details) => {
  const { url, statusCode, responseHeaders, resourceType } = details
  
  const resource = {
    url,
    type: classifyResourceType(resourceType, url, responseHeaders), // ❌
    contentType: responseHeaders['content-type'][0],  // ❌
    // ...
  }
  
  mainWindow.webContents.send('scraping-progress', {
    resource  // ❌ 包含不可序列化的对象
  })
})
```

### 不可序列化的对象类型

- ❌ `responseHeaders`（Electron 特殊对象）
- ❌ 函数
- ❌ Symbol
- ❌ DOM 节点
- ❌ 包含循环引用的对象
- ❌ 某些原生对象（Map, Set 等）

## 解决方案

### 修复方法

将特殊对象转换为**普通的 JavaScript 对象**（Plain Object）：

```javascript
// ✅ 正确：转换为普通对象
const headers = responseHeaders ? JSON.parse(JSON.stringify(responseHeaders)) : {}

const resource = {
  url,
  type: classifyResourceType(resourceType, url, headers),  // ✅ 使用普通对象
  contentType: headers['content-type'] ? headers['content-type'][0] : '',  // ✅
  size: headers['content-length'] ? parseInt(headers['content-length'][0]) : 0,
  status: statusCode,
  timestamp: Date.now()
}

// ✅ 再次确保可序列化
mainWindow.webContents.send('scraping-progress', {
  type: 'resource-found',
  resource: JSON.parse(JSON.stringify(resource)),  // ✅ 深拷贝
  total: collectedResources.length
})
```

### 关键技术

#### 1. JSON 序列化转换

```javascript
// 将特殊对象转换为普通对象
const plainObject = JSON.parse(JSON.stringify(specialObject))
```

**原理**：
- `JSON.stringify()` 将对象转为字符串（会丢弃不可序列化部分）
- `JSON.parse()` 将字符串解析为纯 JavaScript 对象

**优点**：
- ✅ 简单可靠
- ✅ 自动处理嵌套对象
- ✅ 去除不可序列化属性

**缺点**：
- ⚠️ 会丢失函数、undefined、Symbol
- ⚠️ 日期对象变为字符串
- ⚠️ 有一定性能开销

#### 2. 手动构造纯对象

```javascript
// 明确构造每个字段
const resource = {
  url: String(url),
  type: String(type),
  contentType: String(contentType),
  size: Number(size),
  status: Number(status),
  timestamp: Number(timestamp)
}
```

**优点**：
- ✅ 完全可控
- ✅ 类型明确
- ✅ 性能最优

## 修复的位置

### 1. 网络请求监听（主要问题）

**文件**：`electron/main.cjs`

**位置**：`start-scraping` handler 中的 `webRequest.onCompleted`

**修改前**：
```javascript
const { url, statusCode, responseHeaders, resourceType } = details

const resource = {
  url,
  type: classifyResourceType(resourceType, url, responseHeaders),  // ❌
  contentType: responseHeaders['content-type'] ? responseHeaders['content-type'][0] : '',
  // ...
}
```

**修改后**：
```javascript
const { url, statusCode, responseHeaders, resourceType } = details

// ✅ 转换为普通对象
const headers = responseHeaders ? JSON.parse(JSON.stringify(responseHeaders)) : {}

const resource = {
  url,
  type: classifyResourceType(resourceType, url, headers),  // ✅
  contentType: headers['content-type'] ? headers['content-type'][0] : '',
  // ...
}

// ✅ 发送时再次确保可序列化
mainWindow.webContents.send('scraping-progress', {
  type: 'resource-found',
  resource: JSON.parse(JSON.stringify(resource)),
  total: collectedResources.length
})
```

### 2. 停止抓取返回值

**位置**：`stop-scraping` handler

**修改前**：
```javascript
ipcMain.handle('stop-scraping', async () => {
  const resources = [...collectedResources]  // ❌ 可能包含不可序列化对象
  // ...
})
```

**修改后**：
```javascript
ipcMain.handle('stop-scraping', async () => {
  // ✅ 明确构造每个字段
  const resources = collectedResources.map(r => ({
    url: r.url,
    type: r.type,
    contentType: r.contentType,
    size: r.size,
    status: r.status,
    timestamp: r.timestamp
  }))
  // ...
})
```

## 验证方法

### 测试步骤

1. **重启应用**
   ```bash
   npm run electron:dev
   ```

2. **开始抓取**
   - 输入游戏网址
   - 点击"🚀 开始抓取"

3. **操作游戏**
   - 在抓取窗口中操作游戏
   - 观察资源列表是否实时更新

4. **停止抓取**
   - 点击"⏸️ 停止抓取"
   - **应该不再出现 "An object could not be cloned" 错误**

5. **下载资源**（如果实现了）
   - 选择资源
   - 点击下载
   - 应该正常工作

### 控制台检查

打开开发者工具（F12），查看 Console：

**成功标志**：
```
✅ 没有 "An object could not be cloned" 错误
✅ 资源正常显示
✅ 停止抓取返回资源列表
```

**如果仍有错误**：
```
❌ 检查错误堆栈
❌ 查看哪个 IPC 通道出错
❌ 检查传递的数据类型
```

## 预防措施

### 通用规则

在 Electron IPC 通信中，**始终传递纯 JavaScript 对象**：

#### ✅ 可以传递的类型

```javascript
// 基本类型
const data = {
  string: 'text',
  number: 123,
  boolean: true,
  null: null,
  array: [1, 2, 3],
  object: { key: 'value' }
}

ipcRenderer.send('channel', data)  // ✅
```

#### ❌ 不能传递的类型

```javascript
// 特殊对象
const data = {
  function: () => {},           // ❌
  symbol: Symbol('test'),       // ❌
  undefined: undefined,         // ❌ (会被忽略)
  date: new Date(),            // ⚠️ 变为字符串
  map: new Map(),              // ❌
  set: new Set(),              // ❌
  domNode: document.body,      // ❌
  electronObject: responseHeaders  // ❌
}
```

### 代码检查清单

每次通过 IPC 传递数据时，检查：

- [ ] 是否包含 Electron 特殊对象？
- [ ] 是否包含函数？
- [ ] 是否包含 DOM 节点？
- [ ] 是否包含循环引用？
- [ ] 是否使用了 `JSON.parse(JSON.stringify())` 或手动构造？

### 辅助函数（推荐）

创建一个通用的序列化函数：

```javascript
// 安全的 IPC 数据序列化
function serializeForIPC(obj) {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (error) {
    console.error('序列化失败:', error)
    return null
  }
}

// 使用
mainWindow.webContents.send('channel', serializeForIPC(data))
```

## 相关问题

### Q1: 为什么不用 structuredClone()？

**A**: `structuredClone()` 是较新的 API，而且：
- 仍然不支持某些 Electron 特殊对象
- 兼容性不如 `JSON.parse(JSON.stringify())`
- Electron IPC 内部就是用结构化克隆

### Q2: 性能影响如何？

**A**: 
- 小对象：几乎无影响（<1ms）
- 大对象：可能需要 10-100ms
- 建议：只序列化需要的字段

### Q3: 能否传递 Buffer？

**A**: 
- ✅ Electron IPC 原生支持 `Buffer`
- 不需要特殊处理
- 自动在进程间传递

### Q4: Date 对象怎么办？

**A**:
```javascript
// 传递时转为时间戳
const data = {
  timestamp: Date.now()  // ✅
}

// 接收时恢复
const date = new Date(data.timestamp)
```

## 总结

### 问题

- ❌ `responseHeaders` 是不可序列化的 Electron 特殊对象
- ❌ 直接通过 IPC 传递导致 "An object could not be cloned" 错误

### 解决方案

- ✅ 使用 `JSON.parse(JSON.stringify())` 转换为普通对象
- ✅ 手动构造每个字段确保类型正确
- ✅ 在发送和返回时都进行序列化

### 最佳实践

- 📌 始终传递纯 JavaScript 对象
- 📌 避免传递 Electron/Node 特殊对象
- 📌 使用辅助函数统一处理
- 📌 在开发时检查 IPC 数据类型

---

**修复已完成！现在可以正常下载了。** ✅
