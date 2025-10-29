# 🔍 Cocos Creator 资源下载失败诊断指南

## 📊 问题分析

您遇到的情况：
```
总资源: 114个
成功: 5个
失败: 109个
成功率: 4.4%
```

这说明**资源抓取是成功的**，但**下载环节有问题**。

---

## 🔎 诊断步骤

### 步骤 1：查看控制台日志

1. **打开终端/控制台**
   - 查看运行 `npm run electron:dev` 的窗口
   
2. **查找错误信息**
   ```
   🚀 开始下载 114 个资源...
   
   📦 批次 1/38
   📥 正在下载: https://...
   📊 响应状态: 403 - https://...
   ❌ HTTP 403 - https://...
   
   ❌ 错误详情:
   1. HTTP 403 - https://example.com/assets/xxx.png
   2. 网络错误: getaddrinfo ENOTFOUND - https://...
   ```

3. **常见错误类型**

| 错误 | 含义 | 解决方案 |
|------|------|---------|
| `HTTP 403` | 禁止访问（防盗链） | 需要正确的Referer/Cookie |
| `HTTP 404` | 资源不存在 | URL可能失效或相对路径 |
| `HTTP 401` | 需要认证 | 需要登录cookie |
| `ENOTFOUND` | 域名解析失败 | URL可能不完整 |
| `ECONNREFUSED` | 连接被拒绝 | 服务器拒绝连接 |
| `无效的URL` | URL格式错误 | 抓取的URL不完整 |

---

### 步骤 2：检查抓取的URL

1. **在资源列表中右键点击资源**
2. **点击 📋 复制链接**
3. **在浏览器中尝试打开**

**可能的问题**：

#### 问题A：相对路径URL
```
❌ 错误: /assets/images/bg.png
✅ 正确: https://game.com/assets/images/bg.png
```

**原因**：抓取到的是相对路径，缺少域名部分

#### 问题B：特殊协议
```
❌ blob:https://game.com/xxx-xxx-xxx
❌ data:image/png;base64,iVBORw0KG...
```

**原因**：这些资源是动态生成的，无法直接下载

#### 问题C：查询参数过长
```
https://cdn.com/asset.png?token=xxxxx&expire=xxxxx
```

**原因**：token可能已过期

---

### 步骤 3：使用新增的调试功能

**v1.4.2 更新**已经添加了详细的调试日志：

1. **重启应用**
   ```bash
   npm run electron:dev
   ```

2. **重新抓取并下载**
   - 观察控制台输出
   
3. **查看详细错误**
   ```
   ❌ 错误详情:
   1. HTTP 403 - https://...
   2. 网络错误: ENOTFOUND - https://...
   3. 无效的URL: /relative/path.png
   ```

---

## 🛠️ 解决方案

### 方案 1：针对 HTTP 403/401 错误

**原因**：服务器检查 Referer 或需要 Cookie

**已实现的修复**：
- ✅ 自动添加完整的请求头
- ✅ 自动传递 session cookies
- ✅ 添加 Origin 和 Referer

**无需额外操作**，v1.4.2 已自动处理。

---

### 方案 2：针对相对路径URL

如果控制台显示 `无效的URL: /xxx/xxx`，说明抓取到了相对路径。

**临时解决方案**：手动拼接URL

1. **记录游戏的基础URL**
   - 例如：`https://game.example.com`

2. **修改代码**（可选）
   在 `electron/main.cjs` 的 `start-scraping` 中添加：
   ```javascript
   const baseUrl = url // 保存基础URL
   ```

**更好的方案**：使用 Electron DevTools 抓取

---

### 方案 3：使用 Electron 下载API

**更可靠的下载方式**：使用 Electron 的内置下载功能

我将为您实现一个备选方案...

<function_calls>
<invoke name="create_file">
<parameter name="content"># 🔧 v1.4.2 更新日志

## 下载功能改进

### 🆕 新功能

1. **详细错误日志**
   - ✅ 每个资源的下载状态
   - ✅ HTTP 状态码
   - ✅ 详细错误原因
   - ✅ 最多显示前20个错误

2. **Cookie 自动传递**
   - ✅ 自动获取抓取窗口的 cookies
   - ✅ 在下载请求中包含 cookies
   - ✅ 支持需要登录的资源

3. **完整请求头**
   ```javascript
   'User-Agent': Chrome 120
   'Accept': */*
   'Accept-Encoding': gzip, deflate, br
   'Accept-Language': zh-CN,zh;q=0.9
   'Referer': 游戏页面URL
   'Origin': 游戏域名
   'Cookie': session cookies
   ```

4. **重试机制**
   - ✅ 网络错误自动重试最多3次
   - ✅ 递增延迟（1秒、2秒、3秒）
   - ✅ 只对临时错误重试

5. **URL 处理改进**
   - ✅ URL 解码（支持中文文件名）
   - ✅ 相对路径重定向处理
   - ✅ 检测无效 URL

6. **性能优化**
   - ✅ 并发数降至3（避免服务器限制）
   - ✅ 批次间延迟500ms
   - ✅ 超时时间延长至60秒

7. **日志输出**
   - ✅ 每个文件的下载进度
   - ✅ 实际下载的字节数
   - ✅ 批次进度显示
   - ✅ 错误汇总

---

## 使用方法

### 查看详细日志

1. **启动应用**
   ```bash
   npm run electron:dev
   ```

2. **开始下载**
   - 选择资源并点击下载

3. **观察控制台**
   ```
   🚀 开始下载 114 个资源...

   📦 批次 1/38
   📥 正在下载: https://cdn.game.com/assets/bg.png
   📊 响应状态: 200 - https://cdn.game.com/assets/bg.png
   ✅ 下载成功: assets/bg.png (45678 bytes)
   
   📥 正在下载: https://cdn.game.com/audio/bgm.mp3
   📊 响应状态: 403 - https://cdn.game.com/audio/bgm.mp3
   ❌ HTTP 403 - https://cdn.game.com/audio/bgm.mp3
   ```

### 诊断失败原因

根据控制台输出判断：

**情况1：HTTP 403/401**
```
❌ HTTP 403 - https://...
```
→ 防盗链或需要认证
→ 检查是否已登录游戏
→ 可能需要在抓取窗口中操作

**情况2：无效URL**
```
❌ 无效的URL: /assets/xxx.png
```
→ 抓取到相对路径
→ 需要手动拼接base URL

**情况3：网络错误**
```
❌ 网络错误: ENOTFOUND - https://...
```
→ 域名无法解析
→ URL可能不正确

**情况4：超时**
```
❌ 请求超时 (60s) - https://...
```
→ 网络太慢或文件太大
→ 检查网络连接

---

## 最佳实践

### 提高下载成功率

1. **保持抓取窗口打开**
   - 在下载时不要关闭抓取窗口
   - cookies 需要从抓取窗口获取

2. **确保已登录**
   - 如果游戏需要登录，先在抓取窗口登录
   - 登录后再停止抓取并下载

3. **分批下载**
   - 先筛选重要资源（Cocos、Spine）
   - 分批下载，避免一次性下载太多

4. **检查网络**
   - 确保网络稳定
   - 关闭代理和VPN（如果有）

---

## 仍然失败？

如果按照以上步骤仍然大量失败，请提供：

1. **控制台完整日志**
   - 从"🚀 开始下载"到"✨ 下载完成"的所有输出

2. **失败资源的URL**
   - 复制几个失败的资源URL
   - 尝试在浏览器中直接打开

3. **游戏网站URL**
   - 提供游戏的完整URL
   - 说明是否需要登录

---

## 下一步计划

如果当前方案仍不够好，我可以实现：

### 备选方案 A：Electron 内置下载

```javascript
// 使用 session.downloadURL
scrapingWindow.webContents.session.downloadURL(resource.url)
```

**优点**：
- ✅ 自动处理 cookies 和认证
- ✅ 自动处理重定向
- ✅ 更稳定

**缺点**：
- ⚠️ 无法自定义保存路径
- ⚠️ 需要监听下载事件

### 备选方案 B：直接使用浏览器下载

```javascript
// 在抓取窗口中触发下载
scrapingWindow.webContents.executeJavaScript(`
  fetch('${resource.url}')
    .then(r => r.blob())
    .then(blob => {
      // 保存 blob
    })
`)
```

**优点**：
- ✅ 100% 使用浏览器环境
- ✅ 自动包含所有认证信息

**缺点**：
- ⚠️ 需要抓取窗口保持打开
- ⚠️ 跨域限制

### 备选方案 C：抓取+保存合一

在抓取时就直接保存文件，而不是先抓取URL再下载。

**优点**：
- ✅ 避免URL失效
- ✅ 避免认证问题

**缺点**：
- ⚠️ 无法筛选
- ⚠️ 占用更多磁盘空间

---

请先尝试 v1.4.2 的改进，查看控制台日志，然后告诉我具体的错误信息！
