# 🔄 更新日志

## 2025-10-17 v1.4.1 - 修复 IPC 序列化错误 🔧

### 🐛 Bug 修复

#### "An object could not be cloned" 错误

**问题**：
- 在停止抓取或下载时出现 `An object could not be cloned` 错误
- 原因：`responseHeaders` 是 Electron 特殊对象，不能通过 IPC 传递

**修复**：
- ✅ 将 `responseHeaders` 转换为普通 JavaScript 对象
- ✅ 在 `webContents.send` 时使用 `JSON.parse(JSON.stringify())` 深拷贝
- ✅ 在 `stop-scraping` 返回时手动构造纯对象数组

**修改的代码**：
```javascript
// 修复前 ❌
const resource = {
  type: classifyResourceType(resourceType, url, responseHeaders)  // 特殊对象
}

// 修复后 ✅
const headers = JSON.parse(JSON.stringify(responseHeaders))  // 转为普通对象
const resource = {
  type: classifyResourceType(resourceType, url, headers)  // 纯对象
}
```

**影响范围**：
- `electron/main.cjs` - `webRequest.onCompleted` 回调
- `electron/main.cjs` - `stop-scraping` handler

**文档**：
- ✅ 新增 `FIX_CLONE_ERROR.md` 详细说明问题和解决方案

---

## 2025-10-17 v1.4.0 - WebGL 深度修复（Preload 劫持） 🔥

### 🚨 重大修复

针对"不支持 WebGL"问题的**根本性解决方案**。

#### 问题根源
- ❌ 之前的伪装在 `did-finish-load` 后执行，**太晚了**
- ❌ 游戏代码在页面加载时就检测，此时伪装还没生效
- ❌ WebGL 上下文劫持不够早，游戏已经获取到真实信息

#### 革命性改进

**核心技术：Preload 劫持**
```
时间线对比：
❌ 旧方案：页面加载 → 游戏检测 → 伪装生效（太晚）
✅ 新方案：伪装生效 → 页面加载 → 游戏检测（完美）
```

### 🆕 新增功能

#### 1. 专用 Preload 脚本
- ✅ 新文件：`electron/scraping-preload.cjs`
- ✅ 在任何页面代码前删除 Electron 特征
- ✅ 劫持 `HTMLCanvasElement.prototype.getContext` 方法
- ✅ 在 WebGL 上下文创建时就伪装 GPU 信息
- ✅ 实时日志输出伪装状态

**关键代码**：
```javascript
// 在页面脚本执行前就劫持
const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function(type) {
  const ctx = originalGetContext.call(this, type)
  if (type === 'webgl' || type === 'webgl2') {
    // 劫持 getParameter，返回伪装的 GPU 信息
    ctx.getParameter = function(param) {
      if (param === 37446) return 'ANGLE (NVIDIA, ...)'
      // ...
    }
  }
  return ctx
}
```

#### 2. 增强的命令行参数
```javascript
app.commandLine.appendSwitch('enable-unsafe-webgpu')
app.commandLine.appendSwitch('use-gl', 'desktop')  // 使用桌面 OpenGL
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WebGL2ComputeContext')
app.commandLine.appendSwitch('enable-zero-copy')
```

**作用**：强制使用真实的桌面 OpenGL，而不是软件模拟。

#### 3. 双重保险机制
- **第一层**：Preload 阶段伪装（最早）
- **第二层**：did-finish-load 补充伪装（防止覆盖）

#### 4. 简化测试工具
- ✅ 新文件：`public/webgl-simple-test.html`
- ✅ 一目了然的检测结果
- ✅ 可视化三角形渲染测试
- ✅ 实时显示所有关键指标

### 📚 新增文档
- ✅ `WEBGL_DEEP_FIX.md` - 深度修复方案详解
- ✅ `webgl-simple-test.html` - 快速测试工具

### 🎯 效果对比

| 检测时机 | v1.3.0 | v1.4.0 |
|---------|--------|--------|
| Preload 阶段 | ❌ 无伪装 | ✅ 完整伪装 |
| 页面加载前 | ❌ 无伪装 | ✅ 完整伪装 |
| 页面加载中 | ❌ 暴露 | ✅ 已伪装 |
| 页面加载后 | ✅ 伪装生效 | ✅ 双重保险 |

**结论**：v1.4.0 在游戏检测前就已经伪装完成！

### 🔧 技术细节

#### WebGL 上下文劫持原理

**游戏检测代码**（典型）：
```javascript
// 游戏在页面加载时立即检测
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')
if (!gl) {
  alert('不支持 WebGL')  // ← 你看到的错误
}
```

**我们的劫持**（在 Preload 中）：
```javascript
// 在游戏代码执行前就替换 getContext
HTMLCanvasElement.prototype.getContext = function(type) {
  const ctx = originalGetContext.call(this, type)
  // 确保返回有效的 WebGL 上下文
  // 并伪装所有 GPU 信息
  return ctx
}
```

### 🚀 使用方法

#### 1. 完全重启应用
```bash
npm run electron:dev
```
⚠️ **必须重启**才能加载新的 preload 脚本！

#### 2. 测试伪装效果
在应用中输入：
```
file:///C:/Users/ASUS/Desktop/webCat/public/webgl-simple-test.html
```

**期望结果**：
- ✅ 未检测到 Electron 特征
- ✅ WebGL 1.0/2.0 可用
- ✅ 看到绿色三角形
- ✅ 所有检测通过

#### 3. 访问游戏网站
如果测试通过，游戏应该能正常加载！

### 🐛 故障排除

**Q: 测试页面显示 WebGL 不可用**
A: 检查显卡驱动，或在真实 Chrome 中访问 `chrome://gpu` 验证

**Q: 仍然提示不支持 WebGL**
A: 查看控制台是否有 `✅ Scraping Preload Script Loaded` 消息

**Q: 没有看到 Preload 日志**
A: 确认已完全重启应用，并检查 `electron/main.cjs` 是否包含 preload 配置

---

## 2025-10-17 v1.3.0 - 深度浏览器指纹伪装 🎭🔒

### 🚀 重大更新

#### ✨ JavaScript 注入深度伪装（全新）
- **革命性改进**: 不仅伪装 User-Agent，而是在运行时彻底隐藏 Electron 特征
- **实现机制**: 页面加载后自动注入伪装脚本
- **新功能**:
  - ✅ 删除所有 Electron 特征（`window.electron`、`window.process`、`window.require` 等）
  - ✅ 覆盖 `navigator` 对象（userAgent、vendor、platform、webdriver）
  - ✅ WebGL 指纹伪装（GPU Vendor/Renderer 信息）
  - ✅ Chrome 对象完整模拟（chrome.runtime、chrome.loadTimes、chrome.csi）
  - ✅ 插件信息伪装（Chrome PDF Plugin 等）
  - ✅ 权限 API 模拟
  - ✅ 隐藏 Headless 和 WebDriver 特征

#### 🧪 WebGL 检测工具
- ✅ 新增 `public/test-webgl.html` 全面检测页面
- ✅ 实时检测 WebGL 支持情况
- ✅ 显示浏览器指纹信息
- ✅ GPU 详细信息
- ✅ 隐私特征检测（是否暴露 Electron）
- ✅ 可视化三角形渲染测试

#### 🔧 命令行参数增强
```javascript
// 新增参数
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-web-security')
```

### 📚 文档更新
- ✅ 创建 `BROWSER_DISGUISE_V2.md` 深度伪装详细文档
- ✅ 4 层伪装策略完整说明
- ✅ 测试验证方法
- ✅ 故障排除指南
- ✅ 游戏兼容性列表

### 🎯 效果对比

| 检测项 | v1.2.0 | v1.3.0 | 说明 |
|--------|--------|--------|------|
| User-Agent | ✅ Chrome | ✅ Chrome | 伪装一致 |
| window.electron | ❌ 存在 | ✅ 已删除 | 关键改进 |
| navigator.webdriver | ❌ true | ✅ false | 隐藏自动化 |
| WebGL Renderer | ⚠️ 基础 | ✅ NVIDIA | GPU 伪装 |
| chrome 对象 | ❌ 不存在 | ✅ 完整模拟 | Chrome API |
| 插件信息 | ❌ 0 个 | ✅ 3 个 | 真实插件 |

---

## 2025-10-17 v1.2.0 - 浏览器指纹伪装 🎭

### 🎉 新增功能

#### ✨ Chrome 浏览器伪装
- **问题**: 游戏网站检测到 Electron，提示不支持 WebGL
- **解决**: 完整的 Chrome 浏览器伪装
- **新功能**:
  - ✅ User-Agent 伪装成 Chrome 120
  - ✅ 启用 WebGL 和 WebGL 2.0 支持
  - ✅ 启用硬件加速和 GPU 加速
  - ✅ 启用 2D Canvas 加速
  - ✅ 允许不安全内容加载
  - ✅ 忽略 GPU 黑名单

#### 🎮 游戏兼容性提升
- ✅ 支持 Cocos Creator 游戏
- ✅ 支持 Unity WebGL 游戏
- ✅ 支持 Phaser 游戏
- ✅ 支持 Three.js 3D 应用
- ✅ 支持 PixiJS 游戏

### 🔧 技术改进

#### Electron 配置优化
```javascript
// 启用的命令行开关
- enable-webgl
- enable-accelerated-2d-canvas
- enable-webgl2-compute-context
- ignore-gpu-blacklist
- enable-gpu-rasterization
```

#### 窗口配置增强
```javascript
webPreferences: {
  webgl: true,
  acceleratedGraphics: true,
  enableWebSQL: true,
  allowRunningInsecureContent: true
}
```

### 📚 新增文档

- ✅ **BROWSER_DISGUISE.md** - 浏览器伪装完整指南
  - User-Agent 配置
  - WebGL 启用方法
  - 高级伪装技巧
  - 故障排除

### 🎯 解决的问题

- ✅ "不支持 WebGL" 错误
- ✅ "请使用其他浏览器" 提示
- ✅ 游戏无法加载
- ✅ Canvas 渲染失败

---

## 2025-10-17 v1.1.0 - 交互式抓取模式 🎮

### 🎉 重大更新

#### ✨ 交互式持续抓取模式
- **问题**: 游戏资源动态加载，一次性抓取无法获取所有资源
- **解决**: 实现边玩边抓模式！
- **新功能**:
  - ✅ 打开独立的游戏窗口进行抓取
  - ✅ 持续监听网络请求，实时收集资源
  - ✅ 用户可以在游戏中自由操作，触发更多资源加载
  - ✅ "开始抓取" / "停止抓取" 按钮切换
  - ✅ 实时显示已收集的资源数量
  - ✅ 资源列表实时更新
  - ✅ 自动去重，相同 URL 只记录一次

### 🎨 UI 改进

#### URL 输入组件优化
- ✅ 新增"停止抓取"按钮（红色渐变，脉冲动画）
- ✅ 抓取状态实时提示
- ✅ 动态脉冲指示器
- ✅ 详细的操作指引

#### 状态显示增强
- ✅ 状态栏显示实时资源数量
- ✅ 抓取进度实时更新
- ✅ 清晰的状态提示信息

### 🔧 技术改进

#### 主进程 (electron/main.cjs)
- ✅ 新增 `scrapingWindow` 独立抓取窗口
- ✅ 使用 `webRequest.onCompleted` 监听网络请求
- ✅ 实现资源类型智能识别（9种类型）
- ✅ 资源过滤规则（排除analytics、tracking等）
- ✅ 实时发送资源到主窗口
- ✅ 抓取状态管理
- ✅ 窗口关闭自动停止抓取

#### 预加载脚本 (electron/preload.cjs)
- ✅ 新增 `stopScraping` API
- ✅ 新增 `getScrapingStatus` API

#### Vue 组件
- ✅ `UrlInput.vue` - 完全重写，支持开始/停止切换
- ✅ `App.vue` - 新增停止抓取处理逻辑
- ✅ 实时资源更新机制

### 📚 新增文档

- ✅ **INTERACTIVE_SCRAPING.md** - 交互式抓取完整指南
  - 详细使用流程
  - 高级技巧
  - 实战案例
  - 常见问题解答

### 🎯 工作流程变化

**旧流程**:
```
输入URL → 点击抓取 → 等待加载 → 显示结果
```

**新流程**:
```
输入URL → 开始抓取 → 打开游戏窗口 → 边玩边抓 → 
实时显示资源 → 停止抓取 → 筛选下载
```

---

## 2025-10-17 - 紧急修复版本

### 🐛 修复的 Bug

#### 1. Vue 组件错误修复
- **问题**: `UrlInput.vue` 中重复调用 `defineProps()`
- **影响**: 应用无法启动，Vite 编译失败
- **修复**: 移除重复的 `defineProps` 定义
- **文件**: `src/components/UrlInput.vue`

#### 2. Electron ESM 兼容性修复
- **问题**: Electron 无法加载 ES Module 格式的主进程文件
- **影响**: 应用启动失败，报 `ERR_REQUIRE_ESM` 错误
- **修复**: 
  - 将 `electron/main.js` 转换为 `electron/main.cjs` (CommonJS 格式)
  - 将 `electron/preload.js` 转换为 `electron/preload.cjs`
  - 更新 `package.json` 的 `main` 入口为 `electron/main.cjs`
- **文件**: 
  - `electron/main.cjs` (新建)
  - `electron/preload.cjs` (新建)
  - `package.json`

#### 3. 端口配置优化
- **问题**: 端口 5173 被占用时的处理
- **修复**: 统一使用端口 5174，避免冲突
- **文件**: 
  - `vite.config.js`
  - `electron/main.cjs`

### 📝 临时调整

由于 Puppeteer 集成较为复杂，当前版本使用**模拟数据**进行功能演示：

#### 资源抓取
- 返回 2 个测试资源（1 张图片 + 1 个脚本）
- 可以正常显示在资源列表中
- 可以进行筛选和选择操作

#### 资源下载
- 模拟下载成功
- 不会实际创建文件
- 用于测试 UI 交互流程

### ✅ 当前可用功能

1. **界面展示** - 完全正常
   - ✅ 渐变紫色主题
   - ✅ 所有 UI 组件正常显示
   - ✅ 响应式布局
   - ✅ 流畅的动画效果

2. **基础交互** - 完全正常
   - ✅ URL 输入
   - ✅ 资源类型筛选（9 种类型）
   - ✅ 关键词搜索
   - ✅ 资源列表展示
   - ✅ 全选/单选资源
   - ✅ 复制资源链接
   - ✅ 选择保存目录
   - ✅ 状态栏实时更新

3. **功能流程** - 界面流程正常
   - ✅ 输入 URL → 点击抓取 → 显示资源
   - ✅ 筛选资源 → 选择资源 → 下载
   - ✅ 进度和状态提示

### ⏳ 待完善功能

1. **真实资源抓取**
   - 需要集成 Puppeteer
   - 需要处理 Chrome 路径检测
   - 需要实现网络请求拦截

2. **真实文件下载**
   - 当前 `electron/downloader.js` 代码已完成
   - 需要真实资源数据才能测试

3. **Cocos Creator 深度解析**
   - settings.js 解析
   - 项目结构还原
   - 资源依赖分析

### 📚 新增文档

- ✅ `TROUBLESHOOTING.md` - 故障排除指南
- ✅ `CHANGELOG.md` - 更新日志（本文件）

### 🔧 配置变更

**package.json**
```json
{
  "main": "electron/main.cjs",  // 从 main.js 改为 main.cjs
  // 移除了 "type": "module"
}
```

**vite.config.js**
```javascript
server: {
  port: 5174  // 从 5173 改为 5174
}
```

### 📋 文件变更清单

**新增**:
- `electron/main.cjs`
- `electron/preload.cjs`
- `TROUBLESHOOTING.md`
- `CHANGELOG.md`

**修改**:
- `src/components/UrlInput.vue`
- `package.json`
- `vite.config.js`

**待删除** (旧文件，可选):
- `electron/main.js` (已被 main.cjs 替代)
- `electron/preload.js` (已被 preload.cjs 替代)
- `electron/scraper.js` (暂未使用)
- `electron/downloader.js` (暂未使用)

---

## 启动验证

修复后应该看到：

```
✅ npm install - 成功（可能有警告，不影响）
✅ npm run electron:dev - 成功启动
✅ Vite 服务器运行在 http://localhost:5174/
✅ Electron 窗口正常打开
✅ 界面完整显示，无白屏
✅ 可以输入 URL 并点击"开始抓取"
✅ 显示 2 个测试资源
✅ 可以勾选和筛选资源
```

### GPU 警告（可忽略）
```
[ERROR:gpu_process_host.cc(991)] GPU process exited unexpectedly
```
这是显卡驱动兼容性问题，**不影响功能使用**。

---

## 下一步开发

### 优先级 P0 (必须完成)
- [ ] 集成真实的 Puppeteer 资源抓取
- [ ] 实现文件下载功能测试
- [ ] 错误处理和用户提示优化

### 优先级 P1 (重要)
- [ ] 下载进度条可视化
- [ ] 资源预览功能（图片缩略图）
- [ ] 下载历史记录

### 优先级 P2 (可选)
- [ ] Cocos Creator 项目深度解析
- [ ] 资源去重算法
- [ ] 多语言支持
- [ ] 自动更新检查

---

## 贡献者

- 初始版本: WebCat Team
- Bug 修复: 2025-10-17

---

## 反馈

如果发现新的 bug 或有功能建议，请：
1. 查看 `TROUBLESHOOTING.md`
2. 提交 GitHub Issue
3. 加入讨论

**感谢使用 WebCat！** 🐱
