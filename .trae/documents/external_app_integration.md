# 外部应用集成Portal登录认证指南

## 概述

其他系统可以通过 OAuth2.0 授权码模式调用 Portal 系统的登录页面，获取用户认证 Token。整个流程如下：

```
用户访问外部应用 → 重定向到Portal登录页 → 用户登录 → 获取授权码 → 换取Token → 获取用户信息
```

---

## 一、前提条件

### 1.1 注册OAuth客户端

首先需要在 Portal 系统中注册 OAuth 客户端：

1. **管理员登录**：使用管理员账号登录 Portal 系统
2. **进入管理页面**：点击侧边栏「OAuth客户端管理」
3. **创建客户端**：
   - **名称**：你的应用名称（如：订单管理系统）
   - **回调地址**：授权成功后重定向的地址（支持多个，每行一个）
   - **权限范围**：默认 `openid profile email`，如需其他权限可自定义

4. **获取凭证**：创建成功后会获得：
   - **Client ID**：客户端标识符（公开）
   - **Client Secret**：客户端密钥（保密，不要暴露在前端）

### 1.2 回调地址要求

回调地址必须与注册时填写的地址完全一致，包括协议（http/https）、域名、端口和路径。

---

## 二、完整集成流程

### 2.1 流程时序图

```
┌──────────────┐     1.访问应用      ┌──────────────┐
│   用户浏览器   │ ─────────────────→ │   外部应用    │
│              │                     │              │
│              │     2.重定向授权    │              │
│              │ ←───────────────── │              │
│              │                     │              │
│              │     3.访问授权页     │              │
│              │ ─────────────────→ │              │
│              │                     │              │
│              │                     │              │
│              │     4.登录页面      │              │
│              │ ←───────────────── │   Portal系统  │
│              │                     │              │
│              │     5.提交登录      │              │
│              │ ─────────────────→ │              │
│              │                     │              │
│              │     6.返回授权码     │              │
│              │ ←───────────────── │              │
│              │                     │              │
│              │     7.重定向回调     │              │
│              │ ─────────────────→ │   外部应用    │
│              │                     │              │
│              │                     │              │
│              │     8.换取Token     │              │
│              │                     │ ──────────────→ │
│              │                     │              │
│              │                     │     9.返回Token │
│              │                     │ ←───────────── │
│              │                     │              │
│              │                     │              │
│              │                     │   10.获取用户信息 │
│              │                     │ ──────────────→ │
│              │                     │              │
│              │                     │   11.建立本地会话 │
│              │ ←───────────────── │              │
└──────────────┘                     └──────────────┘
```

### 2.2 详细步骤

#### 步骤1：构建授权URL

外部应用需要将用户重定向到 Portal 的授权页面：

```javascript
const portalUrl = 'http://localhost:3000'
const clientId = '你的client_id'
const redirectUri = 'https://your-app.com/callback'

const authUrl = `${portalUrl}/api/oauth/authorize?` + new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',      // 固定值：code
  scope: 'openid profile email',
  state: '随机字符串'          // 用于防止CSRF攻击，建议使用UUID
})

window.location.href = authUrl
```

**参数说明：**

| 参数 | 必填 | 说明 |
|------|------|------|
| client_id | 是 | 注册时获取的客户端ID |
| redirect_uri | 是 | 回调地址，必须与注册时一致 |
| response_type | 是 | 固定为 `code` |
| scope | 否 | 权限范围，默认 `openid profile email` |
| state | 否 | 状态参数，用于防止CSRF攻击 |

#### 步骤2：用户登录

用户被重定向到 Portal 登录页面：
- 如果用户已登录，直接跳转到授权确认页面（可选）
- 如果用户未登录，显示登录表单
- 用户输入邮箱和密码后提交

#### 步骤3：获取授权码

登录成功后，Portal 会生成授权码并跳转到回调地址：

```
https://your-app.com/callback?code=abc123xyz&state=随机字符串
```

**注意事项：**
- 授权码是一次性使用的，有效期为10分钟
- 授权码使用后立即失效

#### 步骤4：换取Token

外部应用收到授权码后，在**后端**调用 Token 接口换取访问令牌：

```javascript
// 后端代码（Node.js示例）
const tokenResponse = await fetch('http://localhost:3000/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: '你的client_id',
    client_secret: '你的client_secret',
    code: 'abc123xyz',              // 步骤3获取的授权码
    grant_type: 'authorization_code',
    redirect_uri: 'https://your-app.com/callback'  // 必须与步骤1一致
  })
})

const tokenData = await tokenResponse.json()
// 返回示例：
// {
//   "accessToken": "long-random-string",
//   "refreshToken": "another-long-string",
//   "tokenType": "Bearer",
//   "expiresIn": 3600,
//   "scope": "openid profile email"
// }
```

**响应字段：**

| 字段 | 说明 |
|------|------|
| accessToken | 访问令牌，用于访问用户信息接口 |
| refreshToken | 刷新令牌，用于获取新的accessToken |
| tokenType | 令牌类型，固定为 `Bearer` |
| expiresIn | 过期时间（秒），默认3600秒（1小时） |
| scope | 授权的权限范围 |

#### 步骤5：获取用户信息

使用 accessToken 调用用户信息接口：

```javascript
const userResponse = await fetch('http://localhost:3000/api/oauth/userinfo', {
  headers: {
    Authorization: `Bearer ${tokenData.accessToken}`
  }
})

const userInfo = await userResponse.json()
// 返回示例：
// {
//   "sub": "用户UUID",
//   "email": "user@example.com",
//   "name": "用户名",
//   "role": "USER"
// }
```

**用户信息字段：**

| 字段 | 说明 |
|------|------|
| sub | 用户唯一标识（UUID） |
| email | 用户邮箱 |
| name | 用户姓名 |
| role | 用户角色（USER/ADMIN） |

#### 步骤6：刷新Token

当 accessToken 过期时，使用 refreshToken 获取新的令牌：

```javascript
const refreshResponse = await fetch('http://localhost:3000/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: '你的client_id',
    client_secret: '你的client_secret',
    refresh_token: tokenData.refreshToken,
    grant_type: 'refresh_token'
  })
})

const newTokenData = await refreshResponse.json()
```

---

## 三、前端集成示例

### 3.1 React/Vue 应用示例

```javascript
// authService.js
const PORTAL_URL = 'http://localhost:3000'
const CLIENT_ID = 'your-client-id'
const REDIRECT_URI = 'http://localhost:8080/callback'

export function login() {
  const state = crypto.randomUUID()
  localStorage.setItem('oauth_state', state)
  
  const authUrl = `${PORTAL_URL}/api/oauth/authorize?` + new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    state
  })
  
  window.location.href = authUrl
}

export async function handleCallback(code, state) {
  const storedState = localStorage.getItem('oauth_state')
  localStorage.removeItem('oauth_state')
  
  if (state !== storedState) {
    throw new Error('CSRF攻击检测')
  }
  
  const tokenResponse = await fetch('/api/backend/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
  
  const { accessToken, userInfo } = await tokenResponse.json()
  
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('user', JSON.stringify(userInfo))
  
  return userInfo
}

export async function getUserInfo() {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  
  const response = await fetch('/api/backend/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!response.ok) {
    localStorage.removeItem('access_token')
    return null
  }
  
  return response.json()
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  window.location.href = `${PORTAL_URL}/api/auth/logout`
}
```

### 3.2 回调页面示例（React）

```jsx
// CallbackPage.jsx
import { useEffect } from 'react'
import { useRouter } from 'react-router-dom'
import { handleCallback } from '../services/authService'

export default function CallbackPage() {
  const router = useRouter()
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    
    if (!code) {
      router.push('/login')
      return
    }
    
    handleCallback(code, state)
      .then(() => router.push('/'))
      .catch(() => router.push('/login'))
  }, [])
  
  return <div>正在登录...</div>
}
```

---

## 四、后端集成示例

### 4.1 Node.js/Express 示例

```javascript
// auth.controller.js
const PORTAL_URL = 'http://localhost:3000'
const CLIENT_ID = process.env.OAUTH_CLIENT_ID
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI

async function exchangeCode(code) {
  const response = await fetch(`${PORTAL_URL}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    })
  })
  
  if (!response.ok) {
    throw new Error('获取Token失败')
  }
  
  return response.json()
}

async function getUserInfo(accessToken) {
  const response = await fetch(`${PORTAL_URL}/api/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  
  if (!response.ok) {
    throw new Error('获取用户信息失败')
  }
  
  return response.json()
}

async function verifyToken(token) {
  const response = await fetch(`${PORTAL_URL}/api/tokens/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  
  return response.ok
}

module.exports = {
  exchangeCode,
  getUserInfo,
  verifyToken
}
```

```javascript
// routes/auth.js
const express = require('express')
const router = express.Router()
const { exchangeCode, getUserInfo } = require('../controllers/auth.controller')

router.post('/oauth/token', async (req, res) => {
  try {
    const { code } = req.body
    const tokenData = await exchangeCode(code)
    const userInfo = await getUserInfo(tokenData.accessToken)
    
    res.json({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      userInfo
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/userinfo', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: '未授权' })
  }
  
  const token = authHeader.split(' ')[1]
  try {
    const userInfo = await getUserInfo(token)
    res.json(userInfo)
  } catch (error) {
    res.status(401).json({ error: 'Token无效' })
  }
})

module.exports = router
```

### 4.2 Python/Flask 示例

```python
# auth.py
import os
import requests

PORTAL_URL = 'http://localhost:3000'
CLIENT_ID = os.environ['OAUTH_CLIENT_ID']
CLIENT_SECRET = os.environ['OAUTH_CLIENT_SECRET']
REDIRECT_URI = os.environ['OAUTH_REDIRECT_URI']

def exchange_code(code):
    response = requests.post(
        f'{PORTAL_URL}/api/oauth/token',
        json={
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': REDIRECT_URI
        }
    )
    response.raise_for_status()
    return response.json()

def get_user_info(access_token):
    response = requests.get(
        f'{PORTAL_URL}/api/oauth/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    response.raise_for_status()
    return response.json()

def verify_token(token):
    response = requests.post(
        f'{PORTAL_URL}/api/tokens/validate',
        json={'token': token}
    )
    return response.ok
```

### 4.3 Java/Spring Boot 示例

```java
// OAuthService.java
@Service
public class OAuthService {
    
    @Value("${portal.url}")
    private String portalUrl;
    
    @Value("${oauth.client-id}")
    private String clientId;
    
    @Value("${oauth.client-secret}")
    private String clientSecret;
    
    @Value("${oauth.redirect-uri}")
    private String redirectUri;
    
    @Autowired
    private RestTemplate restTemplate;
    
    public TokenResponse exchangeCode(String code) {
        Map<String, String> params = new HashMap<>();
        params.put("client_id", clientId);
        params.put("client_secret", clientSecret);
        params.put("code", code);
        params.put("grant_type", "authorization_code");
        params.put("redirect_uri", redirectUri);
        
        return restTemplate.postForObject(
            portalUrl + "/api/oauth/token",
            params,
            TokenResponse.class
        );
    }
    
    public UserInfo getUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        return restTemplate.exchange(
            portalUrl + "/api/oauth/userinfo",
            HttpMethod.GET,
            entity,
            UserInfo.class
        ).getBody();
    }
}
```

---

## 五、Token验证中间件

### 5.1 Express中间件

```javascript
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: '未授权' })
  }
  
  try {
    const userInfo = await getUserInfo(token)
    req.user = userInfo
    next()
  } catch {
    res.status(401).json({ error: 'Token无效' })
  }
}

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: '受保护资源', user: req.user })
})
```

### 5.2 Flask中间件

```python
from functools import wraps
from flask import request, jsonify

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': '未授权'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            user_info = get_user_info(token)
            request.user = user_info
        except:
            return jsonify({'error': 'Token无效'}), 401
        
        return f(*args, **kwargs)
    return decorated

@app.route('/api/protected')
@token_required
def protected():
    return jsonify({'message': '受保护资源', 'user': request.user})
```

---

## 六、常见问题

### Q1: 回调地址必须是HTTPS吗？

**开发环境**：可以使用HTTP
**生产环境**：必须使用HTTPS，否则Cookie无法安全传输

### Q2: 授权码可以使用多次吗？

不可以，授权码是一次性的，使用后立即失效。

### Q3: Token过期怎么办？

使用 refreshToken 获取新的 accessToken：

```javascript
POST /api/oauth/token
{
  "client_id": "xxx",
  "client_secret": "xxx",
  "refresh_token": "xxx",
  "grant_type": "refresh_token"
}
```

### Q4: 如何处理跨域问题？

在 Portal 系统的 CORS 配置中添加外部应用的域名白名单。

### Q5: 可以跳过用户确认吗？

当前实现中，如果用户已登录，会直接生成授权码并跳转，无需用户确认。如果需要用户确认步骤，可以在授权接口中添加确认页面。

### Q6: 如何安全存储Client Secret？

- 绝对不要在前端代码中暴露 Client Secret
- 将 Client Secret 存储在环境变量或配置中心
- 换取Token的请求必须在后端发起

---

## 七、安全最佳实践

1. **使用HTTPS**：生产环境强制使用HTTPS
2. **验证state参数**：防止CSRF攻击
3. **存储refreshToken安全**：使用HttpOnly Cookie存储refreshToken
4. **Token过期处理**：设置合理的过期时间（建议1小时）
5. **权限最小化**：只请求必要的权限范围
6. **日志记录**：记录关键操作日志，便于审计
7. **定期轮换密钥**：定期更换Client Secret
