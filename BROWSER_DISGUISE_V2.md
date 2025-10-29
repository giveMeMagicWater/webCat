# 🎭 深度浏览器指纹伪装 v2.0

## 🚀 版本更新

**v2.0** 实现了深度浏览器指纹伪装，完全隐藏 Electron 特征，使应用看起来像真实的 Chrome 浏览器。

## 📋 伪装层级

### 第 1 层：命令行参数级别

在应用启动时设置：

```javascript
// WebGL 和 GPU 加速
app.commandLine.appendSwitch('enable-webgl')
app.commandLine.appendSwitch('enable-accelerated-2d-canvas')
app.commandLine.appendSwitch('enable-webgl2-compute-context')
app.commandLine.appendSwitch('ignore-gpu-blacklist')
app.commandLine.appendSwitch('enable-gpu-rasterization')

// 隐藏自动化特征
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-web-security')
```

**作用**：底层启用 WebGL/GPU，隐藏 Chromium 自动化检测标志。

---

### 第 2 层：应用级 User-Agent

```javascript
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
```

**作用**：所有网络请求都带上 Chrome 120 的 User-Agent。

---

### 第 3 层：窗口配置

```javascript
webPreferences: {
  webgl: true,
  acceleratedGraphics: true,
  enableWebSQL: true,
  allowRunningInsecureContent: true,
  webSecurity: false
}
```

**作用**：确保窗口支持 WebGL 和现代 Web API。

---

### 第 4 层：JavaScript 注入深度伪装 ⭐ 新增

页面加载完成后，自动注入伪装脚本：

#### 4.1 删除 Electron 特征

```javascript
delete window.electron
delete window.electronAPI
delete window.process
delete window.require
delete window.module
delete window.global
```

#### 4.2 覆盖 Navigator 属性

```javascript
Object.defineProperty(navigator, 'userAgent', {
  get: () => 'Chrome 120 UA String',
  configurable: false
})

Object.defineProperty(navigator, 'vendor', {
  get: () => 'Google Inc.',
  configurable: false
})

Object.defineProperty(navigator, 'platform', {
  get: () => 'Win32',
  configurable: false
})

Object.defineProperty(navigator, 'webdriver', {
  get: () => false,  // 关键：隐藏自动化特征
  configurable: false
})
```

#### 4.3 WebGL 指纹伪装

```javascript
// 覆盖 WebGL 参数获取方法
WebGLRenderingContext.prototype.getParameter = function(parameter) {
  if (parameter === 37445) {  // UNMASKED_VENDOR_WEBGL
    return 'Google Inc. (NVIDIA)'
  }
  if (parameter === 37446) {  // UNMASKED_RENDERER_WEBGL
    return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11)'
  }
  return originalGetParameter.call(this, parameter)
}
```

**作用**：伪装 GPU 信息，看起来像真实的 NVIDIA 显卡。

#### 4.4 Chrome 对象伪装

```javascript
window.chrome = {
  runtime: {},
  app: {},
  csi: () => ({ startE: Date.now(), ... }),
  loadTimes: () => ({
    requestTime: Date.now() / 1000,
    navigationType: 'Other',
    npnNegotiatedProtocol: 'h2',
    connectionInfo: 'h2',
    ...
  })
}
```

**作用**：添加 Chrome 特有的 API，使网站检测认为在运行真实 Chrome。

#### 4.5 插件信息伪装

```javascript
Object.defineProperty(navigator, 'plugins', {
  get: () => [
    { name: 'Chrome PDF Plugin', ... },
    { name: 'Chrome PDF Viewer', ... },
    { name: 'Native Client', ... }
  ]
})
```

**作用**：提供真实 Chrome 的插件列表。

---

## 🧪 测试工具

### WebGL 检测页面

**位置**：`public/test-webgl.html`

**使用方法**：

1. 启动应用：
```bash
npm run electron:dev
```

2. 在抓取窗口中输入以下 URL：
```
file:///C:/Users/ASUS/Desktop/webCat/public/test-webgl.html
```

### 检测项目

测试页面会全面检测：

| 检测项 | 期望结果 | 说明 |
|--------|----------|------|
| **WebGL 1.0** | ✅ 支持 | 基础 3D 渲染 |
| **WebGL 2.0** | ✅ 支持 | 高级 3D 特性 |
| **三角形渲染** | ✅ 显示蓝色三角形 | WebGL 功能测试 |
| **User-Agent** | Chrome/120.0.0.0 | 浏览器标识 |
| **Vendor** | Google Inc. | 浏览器厂商 |
| **Platform** | Win32 | 操作系统 |
| **WebGL Vendor** | Google Inc. (NVIDIA) | GPU 厂商 |
| **WebGL Renderer** | ANGLE (NVIDIA...) | GPU 渲染器 |
| **Electron 特征** | ❌ 未检测到 | 隐藏成功 |
| **Chrome 对象** | ✅ 存在 | Chrome API |
| **WebDriver** | ❌ false | 非自动化 |
| **Plugins** | 3 个 | Chrome 插件 |

---

## 🔍 验证方法

### 方法 1：使用内置测试页面

1. 启动应用
2. 访问 `test-webgl.html`
3. 检查所有项目是否符合预期

### 方法 2：访问游戏网站

1. 在 URL 输入框输入游戏地址
2. 点击"🚀 开始抓取"
3. 观察游戏是否正常加载
4. 如果出现 WebGL 错误，检查控制台日志

### 方法 3：使用在线检测工具

访问以下网站测试浏览器指纹：

- **WebGL 检测**：https://get.webgl.org/
- **浏览器指纹**：https://browserleaks.com/webgl
- **唯一性检测**：https://amiunique.org/
- **追踪保护**：https://coveryourtracks.eff.org/

**预期**：所有网站都应该识别为 Chrome 120 浏览器。

---

## 🎮 游戏兼容性

### ✅ 已支持的引擎/框架

| 技术 | 状态 | 说明 |
|------|------|------|
| **Cocos Creator** | ✅ | H5 游戏引擎 |
| **Unity WebGL** | ✅ | Unity 导出 |
| **Phaser** | ✅ | HTML5 游戏框架 |
| **PixiJS** | ✅ | 2D 渲染 |
| **Three.js** | ✅ | 3D 库 |
| **Babylon.js** | ✅ | 3D 游戏引擎 |
| **Egret** | ✅ | 白鹭引擎 |
| **Laya** | ✅ | LayaAir 引擎 |

### 测试游戏示例

可以尝试以下类型的网页游戏：

1. **Cocos Creator 游戏**（主要目标）
2. **WebGL 在线 Demo**
3. **Canvas 2D 游戏**
4. **HTML5 小游戏**

---

## 🐛 故障排除

### 问题 1：仍然提示"不支持 WebGL"

**解决步骤**：

1. **完全重启应用**（关闭所有窗口后重新运行）
   ```bash
   npm run electron:dev
   ```

2. **检查控制台日志**
   - 查找 "🎭 浏览器伪装已激活" 消息
   - 如果没有，说明脚本注入失败

3. **使用测试页面验证**
   - 访问 `test-webgl.html`
   - 检查 Electron 特征是否为"未检测到"

### 问题 2：游戏加载缓慢

**原因**：GPU 加速可能需要初始化时间

**解决**：等待 5-10 秒，让 WebGL 上下文完全初始化

### 问题 3：黑屏或渲染错误

**可能原因**：
- 显卡驱动过旧
- GPU 黑名单限制

**解决**：
1. 更新显卡驱动
2. 检查是否启用了 `ignore-gpu-blacklist` 参数

### 问题 4：检测工具仍识别为 Electron

**检查项**：

```javascript
// 在控制台执行以下检测
console.log(!!window.electron)        // 应该是 false
console.log(!!window.chrome)          // 应该是 true
console.log(navigator.webdriver)      // 应该是 false
console.log(navigator.vendor)         // 应该是 "Google Inc."
```

如果任何一项不符合预期，说明脚本注入失败。

---

## 📊 伪装效果对比

### 修改前

```javascript
// navigator.userAgent
"Mozilla/5.0 ... Electron/27.1.0 ..."  // ❌ 暴露 Electron

// window.electron
{ electronAPI: {...} }  // ❌ 特有属性存在

// navigator.webdriver
true  // ❌ 自动化标志

// WebGL Renderer
"SwiftShader"  // ❌ 软件渲染器
```

### 修改后 ✅

```javascript
// navigator.userAgent
"Mozilla/5.0 ... Chrome/120.0.0.0 ..."  // ✅ 完整 Chrome UA

// window.electron
undefined  // ✅ 已删除

// navigator.webdriver
false  // ✅ 隐藏自动化

// WebGL Renderer
"ANGLE (NVIDIA, GeForce GTX 1660 Ti ...)"  // ✅ 真实 GPU
```

---

## 🔒 安全性说明

### 伪装的目的

**仅用于学习和研究**：此功能用于访问和学习网页游戏的资源结构，不用于：
- ❌ 绕过付费内容
- ❌ 破解游戏机制
- ❌ 作弊或外挂
- ❌ 侵犯版权

### 禁用 webSecurity 的影响

```javascript
webSecurity: false
```

- 允许跨域请求（方便抓取资源）
- 仅在抓取窗口中禁用
- 主窗口保持安全设置

**建议**：研究完成后立即删除下载的资源。

---

## 🔧 高级自定义

### 修改伪装的 GPU 型号

在 `electron/main.cjs` 中找到：

```javascript
if (parameter === 37446) {  // UNMASKED_RENDERER_WEBGL
  return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti ...)'
}
```

可以修改为其他 GPU 型号：

```javascript
// AMD 显卡
return 'ANGLE (AMD, Radeon RX 6800 XT ...)'

// Intel 显卡
return 'ANGLE (Intel, Intel(R) UHD Graphics 630 ...)'
```

### 修改 Chrome 版本

找到：

```javascript
const chromeUserAgent = 'Mozilla/5.0 ... Chrome/120.0.0.0 ...'
```

修改版本号（建议使用最新稳定版）。

---

## 📝 更新日志

### v2.0（当前版本）

- ✅ JavaScript 注入深度伪装
- ✅ 删除所有 Electron 特征
- ✅ WebGL 指纹伪装
- ✅ Chrome 对象完整模拟
- ✅ 插件信息伪装
- ✅ 隐藏 webdriver 标志
- ✅ 测试页面（test-webgl.html）

### v1.0

- ✅ 基础 User-Agent 伪装
- ✅ WebGL 启用
- ✅ GPU 加速

---

## 🤝 反馈

如果在使用过程中遇到仍然无法访问的网站：

1. **收集信息**：
   - 网站 URL
   - 错误提示截图
   - 控制台日志

2. **排查步骤**：
   - 使用 `test-webgl.html` 验证伪装
   - 检查控制台是否有"浏览器伪装已激活"
   - 尝试在真实 Chrome 中访问（对比）

3. **可能需要进一步增强**：
   - Canvas 指纹伪装
   - AudioContext 指纹伪装
   - 字体指纹伪装
   - WebRTC 指纹伪装

---

## ✨ 总结

通过 4 层深度伪装，本工具现在可以：

- ✅ 完全隐藏 Electron 身份
- ✅ 模拟真实 Chrome 120 浏览器
- ✅ 支持 WebGL 1.0/2.0
- ✅ 伪装 GPU 硬件信息
- ✅ 提供 Chrome 特有 API
- ✅ 绕过大多数浏览器检测

**下次更新预告**：
- 📱 移动端 User-Agent 切换
- 🎨 Canvas 指纹随机化
- 🔊 AudioContext 指纹伪装
- 🌐 时区和语言伪装
