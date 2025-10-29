# 🚀 快速启动指南

## 📋 目录

1. [系统要求](#系统要求)
2. [安装步骤](#安装步骤)
3. [启动应用](#启动应用)
4. [验证安装](#验证安装)
5. [常见问题](#常见问题)

---

## 系统要求

### 必需软件

- ✅ **Windows 10/11** (推荐) 或 macOS/Linux
- ✅ **Node.js** >= 16.0.0
  - 检查版本: `node --version`
  - 下载地址: https://nodejs.org/
- ✅ **Chrome** 或 **Edge** 浏览器
  - 用于 Puppeteer 资源抓取

### 硬件要求

- **内存**: 最少 4GB RAM (推荐 8GB+)
- **磁盘**: 至少 500MB 可用空间
- **网络**: 稳定的互联网连接

---

## 安装步骤

### 步骤 1: 打开终端

在项目目录 `c:\Users\ASUS\Desktop\webCat` 下打开 PowerShell。

**方法 1**: 在文件夹内按住 Shift + 右键，选择"在此处打开 PowerShell 窗口"

**方法 2**: 
```powershell
cd c:\Users\ASUS\Desktop\webCat
```

### 步骤 2: 检查 Node.js 版本

```powershell
node --version
npm --version
```

如果显示版本号，说明安装正确。如果没有，请先安装 Node.js。

### 步骤 3: 安装项目依赖

```powershell
npm install
```

**如果速度慢，使用国内镜像：**

```powershell
npm install --registry=https://registry.npmmirror.com
```

这个过程可能需要 3-5 分钟，请耐心等待。

### 步骤 4: 等待安装完成

成功后会显示类似信息：
```
added XXX packages in XXs
```

---

## 启动应用

### 开发模式（推荐）

在项目目录下运行：

```powershell
npm run electron:dev
```

**预期效果：**
1. ✅ 终端显示 "Vite dev server running at http://localhost:5173"
2. ✅ 自动打开 Electron 应用窗口
3. ✅ 可以看到 WebCat 的用户界面

### 仅运行前端（调试界面）

```powershell
npm run dev
```

然后在浏览器中访问 http://localhost:5173

---

## 验证安装

### ✅ 检查清单

- [ ] Node.js 版本正确 (>= 16.0.0)
- [ ] npm install 成功完成
- [ ] npm run electron:dev 能启动应用
- [ ] 应用窗口正常显示
- [ ] 可以在输入框输入文字
- [ ] Chrome/Edge 已安装

### 🎉 成功标志

如果你看到类似这样的界面，说明安装成功：

```
┌─────────────────────────────────────┐
│  🐱 WebCat                           │
│  Cocos Creator 资源抓取工具          │
├─────────────────────────────────────┤
│                                     │
│  🌐 目标网址                         │
│  ┌─────────────────────────────┐   │
│  │ 请输入网页 URL...            │   │
│  └─────────────────────────────┘   │
│  [开始抓取]                         │
│                                     │
└─────────────────────────────────────┘
```

---

## 常见问题

### Q1: npm install 失败

**错误信息**: `npm ERR! code ECONNRESET`

**解决方法**:
```powershell
# 清除 npm 缓存
npm cache clean --force

# 使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### Q2: 端口 5173 被占用

**错误信息**: `Port 5173 is in use`

**解决方法**:
1. 关闭其他可能占用端口的程序
2. 或修改 `vite.config.js` 中的端口号：

```javascript
server: {
  port: 5174  // 改成其他端口
}
```

### Q3: Electron 窗口打不开

**可能原因**:
- Node.js 版本过低
- 依赖未完全安装

**解决方法**:
```powershell
# 删除 node_modules 重新安装
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Q4: 找不到 Chrome 浏览器

**错误信息**: `未找到 Chrome 或 Edge 浏览器`

**解决方法**:
1. 安装 Chrome: https://www.google.com/chrome/
2. 或安装 Edge: https://www.microsoft.com/edge
3. 浏览器会自动被检测到

### Q5: 权限错误

**错误信息**: `EPERM: operation not permitted`

**解决方法**:
```powershell
# 以管理员身份运行 PowerShell
# 然后重新执行命令
```

---

## 🎯 下一步

安装成功后，你可以：

1. **阅读用户指南**: 查看 [USER_GUIDE.md](USER_GUIDE.md)
2. **尝试抓取**: 输入一个网页 URL 测试功能
3. **查看开发文档**: 阅读 [DEVELOPMENT.md](DEVELOPMENT.md) 了解代码结构
4. **提交反馈**: 如果遇到问题，请在 GitHub 提交 Issue

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **查看完整错误日志**: 将终端的完整错误信息复制下来
2. **检查环境**: 运行 `node --version` 和 `npm --version` 确认版本
3. **提交 Issue**: 到 GitHub 项目页面提交问题，附上：
   - 操作系统版本
   - Node.js 版本
   - 完整的错误信息
   - 已尝试的解决方法

---

## ✨ 使用提示

### 首次使用建议

1. **测试网址**: 先用简单的网页测试抓取功能
2. **少量下载**: 第一次不要选择太多资源下载
3. **检查保存**: 确认文件正确保存到指定目录
4. **查看日志**: 在终端查看抓取和下载的日志信息

### 性能优化

- 关闭不必要的后台程序
- 确保有足够的磁盘空间
- 使用稳定的网络连接
- 不要同时抓取多个网站

---

**祝你使用愉快！🎉**

如果一切正常，你现在应该可以开始使用 WebCat 了！
