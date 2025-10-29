const { contextBridge } = require('electron')

// 在页面加载前就进行深度伪装
// 这个脚本会在任何页面脚本执行前运行

// 删除 Electron 特征
delete window.electron
delete window.electronAPI
delete window.process
delete window.require
delete window.module
delete window.global

// 覆盖 navigator 属性
const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

Object.defineProperty(navigator, 'userAgent', {
  get: () => chromeUserAgent,
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
  get: () => false,
  configurable: false
})

Object.defineProperty(navigator, 'hardwareConcurrency', {
  get: () => 8,
  configurable: false
})

Object.defineProperty(navigator, 'deviceMemory', {
  get: () => 8,
  configurable: false
})

Object.defineProperty(navigator, 'maxTouchPoints', {
  get: () => 0,
  configurable: false
})

// 伪装插件
Object.defineProperty(navigator, 'plugins', {
  get: () => [
    {
      name: 'Chrome PDF Plugin',
      filename: 'internal-pdf-viewer',
      description: 'Portable Document Format',
      length: 1
    },
    {
      name: 'Chrome PDF Viewer',
      filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
      description: '',
      length: 1
    },
    {
      name: 'Native Client',
      filename: 'internal-nacl-plugin',
      description: '',
      length: 2
    }
  ],
  configurable: false
})

// 在 WebGL 上下文创建前就劫持
const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
  // 确保 WebGL 上下文可以创建
  if (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') {
    const context = originalGetContext.call(this, contextType, contextAttributes)
    
    if (context) {
      // 劫持 getParameter 方法
      const originalGetParameter = context.getParameter
      context.getParameter = function(parameter) {
        // UNMASKED_VENDOR_WEBGL
        if (parameter === 37445) {
          return 'Google Inc. (NVIDIA)'
        }
        // UNMASKED_RENDERER_WEBGL
        if (parameter === 37446) {
          return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)'
        }
        return originalGetParameter.call(this, parameter)
      }
      
      // 劫持 getExtension 方法，确保返回必要的扩展
      const originalGetExtension = context.getExtension
      context.getExtension = function(name) {
        const ext = originalGetExtension.call(this, name)
        // 如果扩展不存在但是游戏需要，返回一个模拟对象
        if (!ext && name === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_VENDOR_WEBGL: 37445,
            UNMASKED_RENDERER_WEBGL: 37446
          }
        }
        return ext
      }
    }
    
    return context
  }
  
  return originalGetContext.call(this, contextType, contextAttributes)
}

// 确保 chrome 对象存在
if (typeof chrome === 'undefined') {
  window.chrome = {}
}

window.chrome.runtime = window.chrome.runtime || {
  id: undefined,
  connect: function() {},
  sendMessage: function() {}
}

window.chrome.csi = window.chrome.csi || function() {
  return {
    startE: Date.now(),
    onloadT: Date.now(),
    pageT: Date.now(),
    tran: 15
  }
}

window.chrome.loadTimes = window.chrome.loadTimes || function() {
  return {
    requestTime: Date.now() / 1000,
    startLoadTime: Date.now() / 1000,
    commitLoadTime: Date.now() / 1000,
    finishDocumentLoadTime: Date.now() / 1000,
    finishLoadTime: Date.now() / 1000,
    firstPaintTime: Date.now() / 1000,
    firstPaintAfterLoadTime: 0,
    navigationType: 'Other',
    wasFetchedViaSpdy: false,
    wasNpnNegotiated: true,
    npnNegotiatedProtocol: 'h2',
    wasAlternateProtocolAvailable: false,
    connectionInfo: 'h2'
  }
}

window.chrome.app = window.chrome.app || {}

// 覆盖权限 API
if (navigator.permissions && navigator.permissions.query) {
  const originalQuery = navigator.permissions.query
  navigator.permissions.query = function(parameters) {
    if (parameters.name === 'notifications') {
      return Promise.resolve({ state: 'default' })
    }
    return originalQuery.call(navigator.permissions, parameters)
  }
}

// 确保 WebGL 在页面中可用
window.addEventListener('DOMContentLoaded', () => {
  console.log('🎭 浏览器伪装已激活（Preload 阶段）')
  console.log('📊 检测信息：')
  console.log('  - Electron 特征:', !!window.electron ? '❌ 检测到' : '✅ 未检测到')
  console.log('  - Chrome 对象:', !!window.chrome ? '✅ 存在' : '❌ 不存在')
  console.log('  - WebDriver:', navigator.webdriver ? '❌ true' : '✅ false')
  console.log('  - Vendor:', navigator.vendor)
  
  // 测试 WebGL
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  console.log('  - WebGL 上下文:', gl ? '✅ 可用' : '❌ 不可用')
  
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      console.log('  - GPU Vendor:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
      console.log('  - GPU Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    }
  }
})

console.log('✅ Scraping Preload Script Loaded')
