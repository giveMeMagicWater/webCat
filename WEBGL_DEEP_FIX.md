# 🔧 WebGL 问题深度修复方案

## 🚨 问题分析

您看到的"不支持 WebGL"错误说明：

### ❌ 之前的方案为什么不够

1. **脚本注入太晚**：在 `did-finish-load` 后注入，此时游戏可能已经检测过了
2. **没有 Preload 脚本**：抓取窗口缺少在页面加载前执行的伪装代码
3. **WebGL 上下文劫持不够早**：需要在 `getContext` 被调用前就劫持

### ✅ 新方案的改进

现在实现了 **在页面代码执行前就完成伪装**：

```
页面加载时间线：
1. ⭐ Preload 脚本执行 ← 我们在这里伪装（最早）
2. 页面 HTML 加载
3. 页面 JavaScript 执行 ← 游戏在这里检测
4. did-finish-load 事件 ← 旧方案在这里伪装（太晚）
```

---

## 🆕 v1.4.0 新功能

### 1. 专用 Preload 脚本

**文件**: `electron/scraping-preload.cjs`

**关键技术**：
- ✅ 在任何页面代码前删除 Electron 特征
- ✅ 劫持 `HTMLCanvasElement.prototype.getContext` 方法
- ✅ 在 WebGL 上下文创建时就伪装 GPU 信息
- ✅ 提供 Chrome 特有对象和 API

### 2. 更强大的命令行参数

```javascript
// 新增的关键参数
app.commandLine.appendSwitch('enable-unsafe-webgpu')
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WebGL2ComputeContext')
app.commandLine.appendSwitch('use-gl', 'desktop')  // 使用桌面 OpenGL
app.commandLine.appendSwitch('enable-zero-copy')
```

**作用**：强制使用真实的桌面 OpenGL，而不是软件模拟。

### 3. 双重保险机制

- **Preload 阶段**：最早的伪装（在页面脚本前）
- **did-finish-load 阶段**：补充伪装（防止页面覆盖）

---

## 🚀 立即测试

### 步骤 1：完全重启

```powershell
# 1. 关闭所有 Electron 窗口
# 2. 重新启动
npm run electron:dev
```

⚠️ **必须完全重启才能加载新的 preload 脚本！**

---

### 步骤 2：使用简化测试页面

在应用中输入：
```
file:///C:/Users/ASUS/Desktop/webCat/public/webgl-simple-test.html
```

**期望看到**：
```
✅ 未检测到 Electron 特征 - 伪装成功！
✅ Chrome 对象存在
✅ WebDriver: false (正常)
✅ User-Agent: Chrome (正常)
✅ Vendor: Google Inc.
✅ WebGL 1.0: 可用
✅ WebGL 2.0: 可用
📊 GL Vendor: Google Inc. (ANGLE)
📊 GL Renderer: ANGLE (...)
🎮 GPU Vendor: Google Inc. (NVIDIA)
🎮 GPU Renderer: ANGLE (NVIDIA, ...)
✅ WebGL 渲染测试: 成功（应该看到绿色三角形）
🎉 所有检测通过！
```

**如果看到绿色三角形 + 所有 ✅**，说明伪装成功！

---

### 步骤 3：查看控制台日志

打开开发者工具（F12），应该看到：

```
✅ Scraping Preload Script Loaded
🎭 浏览器伪装已激活（Preload 阶段）
📊 检测信息：
  - Electron 特征: ✅ 未检测到
  - Chrome 对象: ✅ 存在
  - WebDriver: ✅ false
  - Vendor: Google Inc.
  - WebGL 上下文: ✅ 可用
  - GPU Vendor: Google Inc. (NVIDIA)
  - GPU Renderer: ANGLE (NVIDIA, ...)
```

---

### 步骤 4：访问真实游戏

如果测试页面一切正常，现在访问你的游戏网站。

**成功标志**：
- ❌ 不再出现 "不支持 WebGL" 错误
- ✅ 游戏正常加载
- ✅ 可以看到游戏画面

---

## 🔍 如果仍然失败

### 情况 A：测试页面显示 WebGL 不可用

**这说明**：系统层面的 WebGL 有问题

**解决方案**：

1. **检查显卡驱动**
   ```powershell
   # 打开设备管理器
   devmgmt.msc
   ```
   更新"显示适配器"驱动

2. **检查 GPU 是否被禁用**
   在控制台执行：
   ```javascript
   navigator.gpu  // 应该有值
   ```

3. **尝试在真实 Chrome 中测试**
   - 打开 Chrome 浏览器
   - 访问 `chrome://gpu`
   - 查看 WebGL 是否启用

### 情况 B：测试页面成功，但游戏网站仍失败

**这说明**：游戏网站有更高级的检测

**可能的检测点**：

1. **Canvas 指纹检测**
   - 游戏可能检测 Canvas 渲染的像素差异
   - 需要添加 Canvas 指纹伪装

2. **Audio 指纹检测**
   - 检测 AudioContext 特征
   - 需要添加 Audio 指纹伪装

3. **WebRTC 泄露**
   - 通过 WebRTC 获取真实 IP/设备信息
   - 需要禁用或伪装 WebRTC

4. **时序攻击**
   - 检测函数执行时间差异
   - Electron 的某些 API 比原生慢

**下一步方案**：

请告诉我：
- 测试页面的完整截图
- 游戏网站的 URL
- 控制台的完整日志

我可以针对性地增强伪装。

---

## 🎯 技术原理

### Preload 脚本的优势

```javascript
// 传统方案（太晚）
page.onload = function() {
  delete window.electron  // ❌ 游戏已经检测过了
}

// Preload 方案（够早）
// 在 Preload 中：
delete window.electron  // ✅ 在游戏代码执行前就删除
```

### WebGL 上下文劫持

```javascript
// 劫持 getContext 方法
const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function(type) {
  const ctx = originalGetContext.call(this, type)
  
  if (type === 'webgl') {
    // 劫持 getParameter，返回伪装的 GPU 信息
    const originalGetParameter = ctx.getParameter
    ctx.getParameter = function(param) {
      if (param === 37446) return 'NVIDIA GPU'  // 伪装
      return originalGetParameter.call(this, param)
    }
  }
  
  return ctx
}
```

**关键**：必须在游戏调用 `canvas.getContext('webgl')` **之前**劫持！

---

## 📊 方案对比

| 特性 | v1.2.0 | v1.3.0 | v1.4.0 (当前) |
|------|--------|--------|---------------|
| User-Agent 伪装 | ✅ | ✅ | ✅ |
| 删除 Electron 特征 | ❌ | ✅ (晚) | ✅ (早) |
| WebGL 启用 | ✅ | ✅ | ✅ 增强 |
| Preload 脚本 | ❌ | ❌ | ✅ |
| WebGL 上下文劫持 | ❌ | ⚠️ (晚) | ✅ (早) |
| 桌面 OpenGL | ❌ | ❌ | ✅ |
| 双重保险 | ❌ | ❌ | ✅ |
| 检测工具 | ❌ | ✅ | ✅ 简化版 |

---

## 💡 为什么这次应该能成功

1. **时机最早**：Preload 在所有页面代码前执行
2. **劫持最深**：在 API 调用层面劫持，不是事后修改
3. **GPU 真实**：使用桌面 OpenGL，不是软件模拟
4. **检测完善**：提供了简单的测试工具验证

---

## 🤔 仍然担心？

### 最坏情况分析

**如果这个方案还不行**，可能的原因：

1. **硬件限制**
   - 显卡不支持 OpenGL
   - 驱动版本太旧
   - 虚拟机环境

2. **Electron 本身的限制**
   - Chromium 版本太旧
   - 某些 GPU 功能被 Electron 禁用
   - 系统安全策略限制

3. **网站检测过于严格**
   - 使用了机器学习识别浏览器
   - 检测了更深层的系统调用
   - 使用了服务端检测

### 备选方案

如果 Electron 真的不行：

1. **使用 Puppeteer + Chrome**
   - 控制真实的 Chrome 浏览器
   - 100% Chrome 特征
   - 缺点：更重，更慢

2. **使用 Selenium + ChromeDriver**
   - 类似 Puppeteer
   - 但需要隐藏 WebDriver 特征

3. **浏览器扩展方案**
   - 在真实 Chrome 中安装扩展
   - 直接拦截网络请求
   - 无需伪装

**但先试试这个方案**！我相信现在的深度伪装应该足够了。

---

## 📞 反馈信息模板

如果还不行，请提供：

```
【系统环境】
- 操作系统: Windows 10/11
- 显卡型号: NVIDIA/AMD/Intel
- 显卡驱动版本: 

【测试结果】
- 测试页面截图: [附件]
- 控制台日志: [粘贴文本]
- WebGL 可用?: 是/否

【游戏网站】
- URL: 
- 错误信息截图: [附件]
- 控制台错误: [粘贴文本]
```

---

## ✨ 总结

**v1.4.0 的核心创新**：

> 不再是"加载后修改"，而是"加载前劫持"

这是质的飞跃！🚀

**立即测试步骤**：
1. 重启应用
2. 访问 `webgl-simple-test.html`
3. 看到所有 ✅
4. 访问游戏网站
5. 🎉 成功！
