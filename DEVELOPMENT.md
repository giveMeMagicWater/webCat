# 开发指南

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

如果安装速度慢，可以使用国内镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

### 2. 启动开发环境

```bash
npm run electron:dev
```

这将同时启动：
- Vite 开发服务器 (http://localhost:5173)
- Electron 应用窗口

### 3. 构建生产版本

```bash
npm run electron:build
```

构建完成后，安装包会在 `dist-electron` 目录中。

## 📁 项目结构详解

```
webCat/
├── electron/                    # Electron 主进程代码
│   ├── main.js                 # 主进程入口，窗口管理
│   ├── preload.js              # 预加载脚本，安全的 API 桥接
│   ├── scraper.js              # Puppeteer 资源抓取模块
│   └── downloader.js           # 资源下载模块
│
├── src/                        # Vue 前端代码
│   ├── components/             # Vue 组件
│   │   ├── UrlInput.vue       # URL 输入组件
│   │   ├── FilterPanel.vue    # 资源筛选面板
│   │   ├── ResourceList.vue   # 资源列表显示
│   │   ├── DownloadPanel.vue  # 下载管理面板
│   │   └── StatusBar.vue      # 状态栏组件
│   ├── App.vue                 # 根组件
│   ├── main.js                 # 前端入口
│   └── style.css               # 全局样式
│
├── public/                     # 静态资源
├── index.html                  # HTML 模板
├── package.json                # 项目配置
├── vite.config.js              # Vite 配置
└── README.md                   # 项目说明
```

## 🔧 技术架构

### Electron 主进程 (electron/main.js)
- 负责窗口管理
- 处理 IPC 通信
- 管理应用生命周期

### 渲染进程 (src/)
- Vue 3 + Vite 构建
- 负责 UI 界面
- 通过 IPC 与主进程通信

### 资源抓取 (electron/scraper.js)
- 使用 Puppeteer 控制浏览器
- 拦截网络请求
- 分类和收集资源

### 资源下载 (electron/downloader.js)
- 使用 Axios 下载文件
- 按类型分类保存
- 进度追踪

## 🎨 开发技巧

### 调试主进程
在 `electron/main.js` 中添加：
```javascript
mainWindow.webContents.openDevTools()
```

### 调试渲染进程
按 `F12` 或在应用中右键选择"检查元素"

### 热重载
- 修改 Vue 代码会自动热重载
- 修改 Electron 主进程代码需要重启应用

### IPC 通信示例

**渲染进程调用主进程：**
```javascript
// 在 Vue 组件中
const result = await window.electronAPI.startScraping(url)
```

**主进程响应：**
```javascript
// 在 electron/main.js 中
ipcMain.handle('start-scraping', async (event, url) => {
  // 处理逻辑
  return result
})
```

**主进程主动发送消息：**
```javascript
// 在 electron/main.js 中
mainWindow.webContents.send('scraping-progress', data)
```

**渲染进程监听：**
```javascript
// 在 Vue 组件中
window.electronAPI.onScrapingProgress((data) => {
  console.log(data)
})
```

## 📦 添加新功能

### 1. 添加新的 IPC 处理器

在 `electron/preload.js` 中暴露 API：
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  newFunction: (params) => ipcRenderer.invoke('new-function', params)
})
```

在 `electron/main.js` 中处理：
```javascript
ipcMain.handle('new-function', async (event, params) => {
  // 实现逻辑
  return result
})
```

### 2. 添加新的 Vue 组件

在 `src/components/` 创建新组件，然后在 `App.vue` 中导入使用。

## 🐛 常见问题

### Q: Puppeteer 无法启动浏览器
**A:** 确保系统已安装 Chrome 或 Edge 浏览器。代码会自动查找以下路径：
- C:\Program Files\Google\Chrome\Application\chrome.exe
- C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
- C:\Program Files\Microsoft\Edge\Application\msedge.exe

### Q: 端口 5173 被占用
**A:** 修改 `vite.config.js` 中的端口号，同时也要修改 `electron/main.js` 中的 URL。

### Q: 构建失败
**A:** 检查 Node.js 版本是否 >= 16，清除缓存：
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## 🔐 安全注意事项

1. **Context Isolation**: 已启用，渲染进程无法直接访问 Node.js API
2. **Node Integration**: 已禁用，防止 XSS 攻击
3. **Preload Script**: 只暴露必要的 API 给渲染进程
4. **CSP**: 考虑在生产环境添加 Content Security Policy

## 📝 待开发功能

- [ ] 完善 Puppeteer 集成
- [ ] 实现下载进度条
- [ ] 添加资源预览功能
- [ ] Cocos Creator 项目结构解析
- [ ] 资源去重功能
- [ ] 下载历史记录
- [ ] 设置页面（代理、超时等）
- [ ] 错误重试机制

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

开发流程：
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License - 仅供学习研究使用
