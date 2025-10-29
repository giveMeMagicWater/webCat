# 🚀 解决"不支持 WebGL"问题 - 快速指南

## 问题描述

访问游戏网站时出现：
```
Dear Player,
We detected that your browser does not support WebGL 
or WebGL had been disabled.
```

## ✅ 解决方案（v1.3.0）

已实现 **4 层深度浏览器伪装**，完全隐藏 Electron 特征。

---

## 🔧 使用步骤

### 1. 重启应用（重要！）

```bash
# 完全关闭当前应用
# 然后重新启动
npm run electron:dev
```

⚠️ **必须重启**才能加载新的伪装代码！

---

### 2. 验证伪装是否生效

#### 方法 A：使用内置测试页面

1. 启动应用后，在 URL 输入框输入：
```
file:///C:/Users/ASUS/Desktop/webCat/public/test-webgl.html
```
（根据你的实际路径调整）

2. 点击"🚀 开始抓取"

3. 查看检测结果：
   - ✅ WebGL 1.0/2.0: 支持
   - ✅ User-Agent: Chrome 120
   - ✅ Vendor: Google Inc.
   - ✅ Electron 特征: **未检测到**（关键）
   - ✅ Chrome 对象: 存在
   - ✅ WebDriver: false

#### 方法 B：查看控制台日志

在抓取窗口中，打开开发者工具（F12），应该看到：
```
🎭 浏览器伪装已激活 - 现在看起来像真实的 Chrome 浏览器
```

---

### 3. 访问游戏网站

1. 在 URL 输入框输入游戏地址
2. 点击"🚀 开始抓取"
3. 游戏应该正常加载，不再提示 WebGL 错误

---

## 🔍 如果仍然失败

### 检查清单

#### ✅ 1. 确认代码已更新

打开 `electron/main.cjs`，检查是否包含：

```javascript
// 应该在文件顶部看到这些
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')

// 应该在 scrapingWindow 创建后看到这个
scrapingWindow.webContents.on('did-finish-load', () => {
  scrapingWindow.webContents.executeJavaScript(`
    (function() {
      delete window.electron;
      delete window.electronAPI;
      // ... 更多伪装代码
    })();
  `);
});
```

#### ✅ 2. 使用测试页面验证

访问 `test-webgl.html`，检查：

| 检测项 | 期望结果 |
|--------|----------|
| Electron 特征 | ❌ 未检测到 |
| Chrome 对象 | ✅ 存在 |
| WebDriver | false |
| WebGL 支持 | ✅ 支持 |

如果任何一项不符合，说明伪装未生效。

#### ✅ 3. 在控制台手动测试

在抓取窗口的控制台（F12）执行：

```javascript
// 测试 1: Electron 特征应该不存在
console.log('Electron:', !!window.electron);  // 应该显示 false

// 测试 2: Chrome 对象应该存在
console.log('Chrome:', !!window.chrome);  // 应该显示 true

// 测试 3: WebDriver 应该为 false
console.log('WebDriver:', navigator.webdriver);  // 应该显示 false

// 测试 4: Vendor 应该是 Google Inc.
console.log('Vendor:', navigator.vendor);  // 应该显示 "Google Inc."

// 测试 5: WebGL 应该可用
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log('WebGL:', !!gl);  // 应该显示 true
```

---

## 🐛 常见问题

### Q1: 控制台没有看到"浏览器伪装已激活"消息

**原因**: 脚本注入失败

**解决**:
1. 检查是否完全重启了应用
2. 确认 `electron/main.cjs` 已更新
3. 尝试清除缓存后重启

### Q2: 测试页面显示"检测到 Electron 特征"

**原因**: 伪装脚本在检测前未执行

**解决**:
1. 刷新页面（Ctrl+R）
2. 等待页面完全加载后再检测
3. 检查控制台是否有 JavaScript 错误

### Q3: 游戏黑屏或加载失败

**原因**: GPU 初始化问题

**解决**:
1. 等待 10-15 秒
2. 更新显卡驱动
3. 检查是否启用了硬件加速

### Q4: 特定网站仍然检测为 Electron

**可能原因**:
- 网站使用了更高级的检测技术
- 可能检测 Canvas/Audio 指纹
- 可能检测网络时序特征

**下一步**:
1. 使用浏览器指纹检测网站测试：
   - https://browserleaks.com/webgl
   - https://amiunique.org/
2. 反馈具体网站 URL，我们可以进一步增强伪装

---

## 📊 伪装层级说明

### 第 1 层：命令行参数
- 启用 WebGL/GPU 加速
- 隐藏自动化特征

### 第 2 层：User-Agent
- 伪装成 Chrome 120

### 第 3 层：窗口配置
- 启用 WebGL、硬件加速

### 第 4 层：JavaScript 注入（核心）
- 删除 Electron 特征
- 覆盖 navigator 属性
- WebGL 指纹伪装
- Chrome 对象模拟

**只有第 4 层才能真正隐藏 Electron 身份！**

---

## 🎯 测试网站推荐

### 基础测试
- https://get.webgl.org/ - WebGL 可用性
- https://webglreport.com/ - WebGL 详细报告

### 指纹检测
- https://browserleaks.com/webgl - WebGL 指纹
- https://amiunique.org/ - 浏览器唯一性
- https://coveryourtracks.eff.org/ - 追踪保护

**预期**: 所有网站都应识别为 Chrome 120。

---

## 📞 还是不行？

请提供以下信息：

1. **测试页面截图** (`test-webgl.html`)
2. **游戏网站 URL**
3. **控制台日志**（F12 → Console 标签）
4. **是否看到"浏览器伪装已激活"消息**

---

## ✨ 成功标志

当伪装完全成功时，你会看到：

```
✅ WebGL 1.0: 支持
✅ WebGL 2.0: 支持
✅ Electron 特征: 未检测到
✅ Chrome 对象: 存在
✅ WebDriver: false
✅ 游戏正常加载，可以操作
```

🎉 **恭喜！现在可以开始抓取游戏资源了！**

---

## 📚 相关文档

- **深度伪装详解**: `BROWSER_DISGUISE_V2.md`
- **更新日志**: `CHANGELOG.md` (v1.3.0)
- **用户指南**: `USER_GUIDE.md`
- **故障排除**: `TROUBLESHOOTING.md`
