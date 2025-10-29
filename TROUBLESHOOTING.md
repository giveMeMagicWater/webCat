# 🔧 故障排除指南

## 已解决的问题

### ✅ 问题 1: Vue 组件重复 defineProps

**错误信息**:
```
[@vue/compiler-sfc] duplicate defineProps() call
```

**原因**: `UrlInput.vue` 中重复定义了 `defineProps`

**解决方案**: 已修复，只保留一个 `defineProps` 定义

---

### ✅ 问题 2: Electron ESM 模块错误

**错误信息**:
```
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```

**原因**: Electron 主进程不支持 ESM 模块语法

**解决方案**: 
- 将 `electron/main.js` 转换为 `electron/main.cjs` (CommonJS)
- 将 `electron/preload.js` 转换为 `electron/preload.cjs`
- 更新 `package.json` 中的 `main` 字段

---

### ⚠️ 问题 3: GPU 进程错误（可忽略）

**错误信息**:
```
GPU process exited unexpectedly: exit_code=-1073740791
```

**原因**: 显卡驱动兼容性问题（常见于虚拟机或某些显卡）

**影响**: 不影响应用功能，只是性能可能略有下降

**解决方案（可选）**:
在 `electron/main.cjs` 中添加启动参数禁用 GPU 加速：

```javascript
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
```

或者更新显卡驱动程序。

---

### ⚠️ 问题 4: npm 依赖警告

**警告信息**:
```
npm warn deprecated inflight@1.0.6
npm warn deprecated glob@7.2.3
8 vulnerabilities (4 moderate, 4 high)
```

**原因**: 某些依赖包已过时

**影响**: 不影响开发，仅是警告

**解决方案（可选）**:
```powershell
npm audit fix
# 或强制修复（可能有破坏性改动）
npm audit fix --force
```

---

## 常见启动问题

### 端口被占用

**症状**: 
```
Port 5173 is in use, trying another one...
Port 5174 is in use...
```

**解决方案**:

**方法 1**: 关闭占用端口的程序
```powershell
# 查找占用端口的进程
netstat -ano | findstr :5174
# 结束进程（将 PID 替换为实际进程 ID）
taskkill /PID <PID> /F
```

**方法 2**: 修改 Vite 端口
编辑 `vite.config.js`:
```javascript
server: {
  port: 5175  // 改成其他端口
}
```

同时更新 `electron/main.cjs`:
```javascript
mainWindow.loadURL('http://localhost:5175')
```

---

### 应用启动后白屏

**可能原因**:
1. Vite 服务器未启动
2. 端口配置不匹配
3. 前端代码编译错误

**检查步骤**:

1. **查看终端输出**，确认看到：
   ```
   VITE v5.x.x ready in xxx ms
   Local: http://localhost:5174/
   ```

2. **检查端口匹配**:
   - `vite.config.js` 中的端口
   - `electron/main.cjs` 中的 URL

3. **打开开发者工具**（F12）查看控制台错误

4. **手动访问** http://localhost:5174/ 测试前端

---

### Electron 窗口无法打开

**症状**: 只有终端输出，没有窗口

**检查**:
```javascript
// 在 electron/main.cjs 中添加日志
function createWindow() {
  console.log('Creating window...')
  mainWindow = new BrowserWindow({
    // ...
  })
  console.log('Window created')
}
```

**可能原因**:
- 系统权限问题
- 显示器配置问题
- Electron 安装不完整

**解决**:
```powershell
# 重新安装 Electron
npm uninstall electron
npm install electron --save-dev
```

---

### 前端资源 404 错误

**症状**: 控制台显示 404 Not Found

**检查**:
1. `index.html` 中的资源路径
2. `vite.config.js` 中的 `base` 配置
3. 文件是否存在于 `src/` 目录

---

## 开发环境问题

### Node.js 版本不兼容

**要求**: Node.js >= 16.0.0

**检查**:
```powershell
node --version
```

**升级**:
访问 https://nodejs.org/ 下载最新 LTS 版本

---

### npm install 失败

**常见错误**:

**错误 1**: 网络超时
```powershell
# 使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install
```

**错误 2**: 权限问题
```powershell
# 以管理员身份运行 PowerShell
# 或清理 npm 缓存
npm cache clean --force
```

**错误 3**: node-gyp 编译错误
```powershell
# Windows 需要安装构建工具
npm install --global windows-build-tools
```

---

## 功能问题

### 资源抓取不工作

**当前状态**: 返回测试数据

**原因**: Puppeteer 集成尚未完成

**临时方案**: 
- 应用会返回模拟数据用于测试界面
- 实际抓取功能需要进一步开发

**后续开发**:
1. 安装 Puppeteer: `npm install puppeteer-core`
2. 完善 `electron/scraper.js` 模块
3. 处理 Chrome 浏览器路径检测

---

### 下载功能不工作

**当前状态**: 模拟下载成功

**原因**: 下载模块已实现但需要真实资源数据

**验证方法**:
1. 选择保存目录
2. 点击下载
3. 应该提示"下载完成"（虽然实际未下载文件）

---

## 调试技巧

### 启用详细日志

在 `electron/main.cjs` 开头添加：
```javascript
process.env.ELECTRON_ENABLE_LOGGING = true
```

### Vue Devtools

安装 Vue Devtools 浏览器扩展，或在代码中添加：
```javascript
// src/main.js
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode')
}
```

### 网络请求调试

在浏览器开发者工具的 Network 标签中查看所有请求

---

## 性能优化

### 减少内存占用

```javascript
// 在 electron/main.cjs 中
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096')
```

### 禁用不需要的功能

```javascript
webPreferences: {
  webSecurity: false,  // 开发环境可禁用
  devTools: true,
  nodeIntegration: false,
  contextIsolation: true
}
```

---

## 获取帮助

如果以上方法都无法解决问题：

1. **查看完整错误日志**: 复制终端的全部输出
2. **记录复现步骤**: 详细描述问题出现的过程
3. **环境信息**: 
   ```powershell
   node --version
   npm --version
   Get-ComputerInfo | Select-Object WindowsVersion
   ```
4. **提交 Issue**: 包含以上所有信息

---

## 快速重置

如果一切都乱了，从头开始：

```powershell
# 1. 删除依赖
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 2. 清理缓存
npm cache clean --force

# 3. 重新安装
npm install

# 4. 重新启动
npm run electron:dev
```

---

**最后更新**: 2025-10-17
