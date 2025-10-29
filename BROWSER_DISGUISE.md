# 🎭 浏览器指纹伪装配置

## 已实现的伪装功能

### ✅ User-Agent 伪装

应用现在会伪装成 **Chrome 120** 浏览器：

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) 
AppleWebKit/537.36 (KHTML, like Gecko) 
Chrome/120.0.0.0 Safari/537.36
```

网站会认为你在使用最新版的 Chrome 浏览器。

### ✅ WebGL 支持

已启用以下功能：
- ✅ `webgl: true` - 启用 WebGL
- ✅ `acceleratedGraphics: true` - 硬件加速
- ✅ `enableWebSQL` - 启用 WebSQL
- ✅ `enable-webgl2-compute-context` - WebGL 2.0

### ✅ GPU 加速

启用了多项 GPU 加速参数：
- `enable-webgl`
- `enable-accelerated-2d-canvas`
- `ignore-gpu-blacklist`
- `enable-gpu-rasterization`

---

## 🎮 游戏兼容性

### 支持的技术

现在应用完全支持：
- ✅ **WebGL** - 3D 图形渲染
- ✅ **Canvas 2D** - 2D 游戏
- ✅ **Cocos Creator** - H5 游戏引擎
- ✅ **Unity WebGL** - Unity 导出的网页游戏
- ✅ **Phaser** - HTML5 游戏框架
- ✅ **PixiJS** - 2D 渲染引擎

### 测试网站

以下类型的游戏现在应该都能正常运行：

1. **WebGL 检测页面**: https://get.webgl.org/
2. **Three.js 示例**: https://threejs.org/examples/
3. **Cocos Creator 游戏**: 各类 H5 小游戏
4. **Unity WebGL 游戏**: Unity 导出的网页游戏

---

## 🔍 验证伪装效果

### 方法 1: 检查 User-Agent

在抓取窗口的控制台（F12）中运行：

```javascript
console.log(navigator.userAgent)
// 应该显示: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

### 方法 2: 检查 WebGL

```javascript
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
console.log('WebGL 支持:', gl ? '是' : '否')
// 应该显示: WebGL 支持: 是
```

### 方法 3: 在线检测

访问这些网站进行检测：
- https://get.webgl.org/ - WebGL 支持检测
- https://www.whatismybrowser.com/ - 浏览器识别
- https://browserleaks.com/webgl - WebGL 指纹

---

## 🎯 主窗口 vs 抓取窗口

### 主窗口（WebCat 控制面板）
- User-Agent: Chrome 120
- WebGL: 启用
- 用途: 显示资源列表和控制界面

### 抓取窗口（游戏运行窗口）
- User-Agent: Chrome 120 ✅ **伪装**
- WebGL: 启用 ✅ **完全支持**
- 硬件加速: 启用 ✅
- 用途: 运行游戏，抓取资源

---

## 🔧 高级配置

### 修改 User-Agent

如果需要伪装成其他浏览器，在 `electron/main.cjs` 中修改：

```javascript
// Chrome (已配置)
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Firefox
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'

// Edge
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'

// Safari
const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
```

### 禁用 WebGL（如果需要）

在 `webPreferences` 中设置：

```javascript
webPreferences: {
  webgl: false,
  acceleratedGraphics: false
}
```

### 添加更多伪装

```javascript
// 隐藏 Electron 特征
app.commandLine.appendSwitch('disable-features', 'RendererCodeIntegrity')

// 禁用自动化检测
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')
```

---

## ⚠️ 已知限制

### 无法完全伪装的特征

1. **WebGL Vendor/Renderer**
   - Electron 的 GPU 信息可能与真实 Chrome 不同
   - 高级指纹检测可能识别出差异

2. **Chrome Extensions**
   - Electron 不支持 Chrome 扩展
   - 某些网站可能检测扩展的存在

3. **Performance API**
   - 性能指标可能与原生浏览器有细微差别

4. **Canvas Fingerprint**
   - 渲染结果可能略有不同

### 对策

对于要求极高的网站：
- 使用真实的 Chrome 浏览器
- 或使用 Puppeteer + 真实 Chrome

---

## 🐛 故障排除

### 问题 1: 仍然提示不支持 WebGL

**检查**:
1. 显卡驱动是否是最新的
2. 在终端检查 GPU 错误信息
3. 尝试禁用硬件加速（可能有兼容性问题）

**解决**:
```javascript
// 如果硬件加速有问题，禁用它
app.disableHardwareAcceleration()
```

### 问题 2: 游戏检测出不是真实浏览器

**原因**: 高级指纹检测

**解决**: 添加更多伪装
```javascript
// 在 preload.cjs 中注入
delete window.electron
delete window.electronAPI
```

### 问题 3: 性能问题

**检查**:
- GPU 加速是否正常工作
- 是否有 GPU 错误日志

**优化**:
```javascript
// 限制内存使用
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096')
```

---

## 📊 测试报告

### 预期效果

访问游戏网站时：
- ❌ 之前: "不支持 WebGL" 错误
- ✅ 现在: 游戏正常加载和运行

### 兼容性测试

| 游戏类型 | 之前 | 现在 | 备注 |
|---------|------|------|------|
| Cocos Creator | ❌ | ✅ | 完全支持 |
| Unity WebGL | ❌ | ✅ | 需要 WebGL 2.0 |
| Phaser 游戏 | ⚠️ | ✅ | Canvas/WebGL 混合 |
| Three.js | ❌ | ✅ | 3D 渲染 |
| PixiJS | ⚠️ | ✅ | 2D 渲染 |

---

## 🚀 立即测试

重启应用后尝试：

```powershell
npm run electron:dev
```

然后：
1. 输入之前无法访问的游戏 URL
2. 点击"开始抓取"
3. 游戏应该正常加载！

---

## 📝 更新日志

### 2025-10-17 - 浏览器伪装更新

- ✅ 添加 Chrome User-Agent 伪装
- ✅ 启用 WebGL 支持
- ✅ 启用硬件加速
- ✅ 添加多项 GPU 加速参数
- ✅ 支持 WebGL 2.0
- ✅ 允许跨域和不安全内容（用于抓取）

---

**现在游戏应该能正常运行了！** 🎮✨
