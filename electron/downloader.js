import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { pipeline } from 'stream'

const streamPipeline = promisify(pipeline)

/**
 * 下载资源文件
 */
export async function downloadResources(resources, saveDirectory, onProgress) {
  const results = {
    success: true,
    total: resources.length,
    downloaded: 0,
    failed: 0,
    errors: []
  }

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i]
    
    try {
      // 发送进度
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: resources.length,
          resource: resource.url,
          percent: Math.round((i / resources.length) * 100)
        })
      }

      // 下载文件
      await downloadFile(resource, saveDirectory)
      results.downloaded++
    } catch (error) {
      console.error(`下载失败: ${resource.url}`, error)
      results.failed++
      results.errors.push({
        url: resource.url,
        error: error.message
      })
    }
  }

  // 最终进度
  if (onProgress) {
    onProgress({
      current: resources.length,
      total: resources.length,
      percent: 100,
      completed: true
    })
  }

  return results
}

/**
 * 下载单个文件
 */
async function downloadFile(resource, saveDirectory) {
  const { url, type } = resource

  // 创建类型目录
  const typeDir = path.join(saveDirectory, type)
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true })
  }

  // 获取文件名
  const fileName = getFileNameFromUrl(url)
  const filePath = path.join(typeDir, fileName)

  // 下载文件
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  // 保存文件
  const writer = fs.createWriteStream(filePath)
  await streamPipeline(response.data, writer)

  return filePath
}

/**
 * 从 URL 获取文件名
 */
function getFileNameFromUrl(url) {
  try {
    const urlObj = new URL(url)
    let pathname = urlObj.pathname
    
    // 移除查询参数
    const parts = pathname.split('/')
    let fileName = parts[parts.length - 1]
    
    // 如果没有文件名,生成一个
    if (!fileName || fileName === '') {
      fileName = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 清理文件名中的非法字符
    fileName = fileName.replace(/[<>:"/\\|?*]/g, '_')
    
    // 确保文件名不超过255个字符
    if (fileName.length > 255) {
      const ext = path.extname(fileName)
      const name = path.basename(fileName, ext)
      fileName = name.substring(0, 255 - ext.length) + ext
    }

    return fileName
  } catch (error) {
    // 如果URL解析失败,生成随机文件名
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}
