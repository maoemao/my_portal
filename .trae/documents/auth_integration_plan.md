# Portal系统 - 外部应用认证集成方案

## 一、需求分析

### 1.1 用户需求
其他应用（子系统）希望使用Portal系统作为统一认证中心，实现：
- 用户在Portal登录后，子系统自动获取登录状态
- 子系统能够验证用户身份
- 子系统能够获取用户基本信息

### 1.2 现有能力
当前系统已实现：
- JWT Token生成和验证
- Token验证API (`POST /api/tokens/validate`)
- 子系统Token生成 (`GET /api/tokens/{systemCode}`)
- Token刷新 (`POST /api/tokens/refresh`)

### 1.3 缺失能力
需要补充实现：
- OAuth2.0授权码模式（标准SSO协议）
- 客户端注册和管理
- 授权回调端点
- 用户信息端点（UserInfo）
- 登出回调通知

## 二、技术方案

### 2.1 认证架构

```
┌─────────────────┐     OAuth2.0    ┌─────────────────┐
│   外部应用A      │◄───────────────►│                 │
│   外部应用B      │                 │   Portal系统    │
│   外部应用C      │                 │  (认证中心)      │
└─────────────────┘                 └─────────────────┘
         │                                    │
         │    获取Token验证用户                 │    用户管理
         │                                    │
         ▼                                    ▼
    子系统后端                          PostgreSQL数据库
```

### 2.2 认证流程

#### 流程一：OAuth2.0 授权码模式（推荐）

```
1. 用户访问子系统 → 子系统重定向到Portal登录页
   GET /oauth/authorize?client_id=xxx&redirect_uri=xxx&response_type=code

2. 用户登录后 → Portal生成授权码 → 重定向回子系统
   GET {redirect_uri}?code=xxx

3. 子系统用授权码换取Token
   POST /oauth/token
   { client_id, client_secret, code, grant_type: authorization_code }

4. Portal返回Token
   { access_token, refresh_token, expires_in }

5. 子系统使用access_token调用用户信息接口
   GET /oauth/userinfo?access_token=xxx

6. 子系统验证用户身份后建立本地会话
```

#### 流程二：Token直传模式（简单场景）

```
1. 用户在Portal登录 → 获取Portal Session

2. 用户访问子系统 → 子系统通过iframe/全局状态获取Portal Token

3. 子系统调用Token验证接口
   POST /api/tokens/validate
   { token: xxx }

4. Portal返回用户信息
   { userId, email, name, role }

5. 子系统建立本地会话
```

### 2.3 数据库模型扩展

在 `prisma/schema.prisma` 中新增 `OAuthClient` 模型：

```prisma
model OAuthClient {
  id           String    @id @default(uuid())
  clientId     String    @unique
  clientSecret String
  name         String
  redirectUris String[]
  scopes       String[]  @default(["openid", "profile", "email"])
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model OAuthCode {
  id         String   @id @default(uuid())
  code       String   @unique
  clientId   String
  userId     String
  redirectUri String
  expiresAt  DateTime
  used       Boolean  @default(false)
  
  client     OAuthClient @relation(fields: [clientId], references: [id])
  user       User        @relation(fields: [userId], references: [id])
}

model OAuthToken {
  id           String   @id @default(uuid())
  accessToken  String   @unique
  refreshToken String   @unique
  clientId     String
  userId       String
  expiresAt    DateTime
  revoked      Boolean  @default(false)
  
  client       OAuthClient @relation(fields: [clientId], references: [id])
  user         User        @relation(fields: [userId], references: [id])
}
```

### 2.4 API接口设计

| 接口 | 方法 | 说明 |
|------|------|------|
| `/oauth/authorize` | GET | 授权请求入口 |
| `/oauth/token` | POST | 获取Token |
| `/oauth/userinfo` | GET | 获取用户信息 |
| `/oauth/logout` | POST | 登出 |
| `/api/oauth/clients` | GET/POST | 客户端管理（管理员） |
| `/api/oauth/clients/{id}` | GET/PUT/DELETE | 客户端CRUD（管理员） |

#### 2.4.1 授权请求

```
GET /oauth/authorize
参数：
- client_id: 客户端ID（必填）
- redirect_uri: 回调地址（必填）
- response_type: 响应类型（必填，固定为code）
- scope: 权限范围（可选，默认openid profile email）
- state: 状态参数（可选，用于防止CSRF）
```

#### 2.4.2 获取Token

```
POST /oauth/token
Content-Type: application/json

{
  "client_id": "xxx",
  "client_secret": "xxx",
  "code": "授权码",
  "grant_type": "authorization_code",
  "redirect_uri": "回调地址"
}

响应：
{
  "access_token": "xxx",
  "refresh_token": "xxx",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

#### 2.4.3 获取用户信息

```
GET /oauth/userinfo
Headers:
Authorization: Bearer {access_token}

响应：
{
  "sub": "用户ID",
  "email": "user@example.com",
  "name": "用户名",
  "role": "USER"
}
```

#### 2.4.4 登出

```
POST /oauth/logout
Headers:
Authorization: Bearer {access_token}

响应：
{
  "success": true
}
```

## 三、实施步骤

### 3.1 步骤一：扩展数据库模型

修改 `prisma/schema.prisma`，添加 `OAuthClient`、`OAuthCode`、`OAuthToken` 模型。

### 3.2 步骤二：创建OAuth工具函数

创建 `lib/oauth.ts`，包含：
- 生成客户端ID和密钥
- 生成授权码
- 验证授权码
- 生成Token
- 验证Token
- 刷新Token

### 3.3 步骤三：创建OAuth API路由

创建以下API路由：
- `app/api/oauth/authorize/route.ts` - 授权请求
- `app/api/oauth/token/route.ts` - 获取Token
- `app/api/oauth/userinfo/route.ts` - 用户信息
- `app/api/oauth/logout/route.ts` - 登出
- `app/api/oauth/clients/route.ts` - 客户端管理
- `app/api/oauth/clients/[id]/route.ts` - 客户端CRUD

### 3.4 步骤四：创建客户端管理页面

在管理后台添加OAuth客户端管理功能，包括：
- 客户端列表
- 创建客户端
- 编辑客户端
- 删除客户端

### 3.5 步骤五：更新文档

更新 `README.md`，添加外部应用认证集成指南。

## 四、外部应用集成指南

### 4.1 注册客户端

1. 管理员登录Portal
2. 进入「OAuth客户端管理」页面
3. 点击「创建」按钮
4. 填写客户端信息：
   - 名称：应用名称
   - 回调地址：授权成功后重定向的地址
   - 权限范围：需要的用户信息权限

### 4.2 实现认证流程

#### 方式一：使用OAuth2.0授权码模式（推荐）

```javascript
// 1. 重定向到Portal授权页
const authUrl = `${portalUrl}/oauth/authorize?` + new URLSearchParams({
  client_id: 'your-client-id',
  redirect_uri: 'https://your-app.com/callback',
  response_type: 'code',
  scope: 'openid profile email',
  state: 'random-state-value'
})
window.location.href = authUrl

// 2. 在回调地址处理授权码
// https://your-app.com/callback?code=xxx&state=xxx

// 3. 换取Token
const tokenResponse = await fetch(`${portalUrl}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    code: '授权码',
    grant_type: 'authorization_code',
    redirect_uri: 'https://your-app.com/callback'
  })
})
const { access_token } = await tokenResponse.json()

// 4. 获取用户信息
const userResponse = await fetch(`${portalUrl}/oauth/userinfo`, {
  headers: { Authorization: `Bearer ${access_token}` }
})
const userInfo = await userResponse.json()

// 5. 建立本地会话
sessionStorage.setItem('user', JSON.stringify(userInfo))
```

#### 方式二：使用Token验证API（简单场景）

```javascript
// 1. 通过qiankun props获取Token
// 在mount生命周期中
export async function mount(props) {
  const { token, userInfo } = props
  
  // 直接使用用户信息
  console.log('用户信息:', userInfo)
}

// 2. 或手动验证Token
const validateResponse = await fetch(`${portalUrl}/api/tokens/validate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'xxx' })
})
const userInfo = await validateResponse.json()
```

### 4.3 示例：使用Express中间件验证Token

```javascript
// 创建验证中间件
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: '未授权' })
  }
  
  const response = await fetch(`${portalUrl}/api/tokens/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  
  if (!response.ok) {
    return res.status(401).json({ error: 'Token无效' })
  }
  
  const userInfo = await response.json()
  req.user = userInfo
  next()
}

// 使用中间件
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: '受保护资源', user: req.user })
})
```

## 五、安全注意事项

1. **HTTPS强制**：生产环境必须使用HTTPS，防止Token泄露
2. **Token有效期**：access_token设置较短有效期（建议1小时），refresh_token用于刷新
3. **客户端密钥保密**：client_secret必须妥善保管，不应暴露在前端
4. **CSRF防护**：使用state参数防止CSRF攻击
5. **回调地址验证**：严格验证redirect_uri是否在注册的地址列表中
6. **权限最小化**：只请求必要的权限范围

## 六、项目文件变更

### 新增文件

| 文件路径 | 说明 |
|----------|------|
| `lib/oauth.ts` | OAuth工具函数 |
| `app/api/oauth/authorize/route.ts` | 授权请求接口 |
| `app/api/oauth/token/route.ts` | Token获取接口 |
| `app/api/oauth/userinfo/route.ts` | 用户信息接口 |
| `app/api/oauth/logout/route.ts` | 登出接口 |
| `app/api/oauth/clients/route.ts` | 客户端管理接口 |
| `app/api/oauth/clients/[id]/route.ts` | 客户端CRUD接口 |
| `app/(dashboard)/oauth-clients/page.tsx` | 客户端管理页面 |

### 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `prisma/schema.prisma` | 添加OAuth相关模型 |
| `README.md` | 添加外部应用集成指南 |

## 七、风险评估

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| OAuth协议实现复杂 | 开发周期长 | 参考标准实现，添加完整测试 |
| Token泄露 | 安全风险 | HTTPS + 短有效期 + 刷新机制 |
| 跨域问题 | 集成困难 | 配置CORS白名单 |
| 数据库迁移 | 数据丢失风险 | 备份数据库 + 测试环境验证 |

## 八、验证方案

### 8.1 功能验证

1. 注册OAuth客户端
2. 使用授权码模式获取Token
3. 验证Token有效性
4. 获取用户信息
5. 登出并验证Token失效

### 8.2 安全验证

1. 验证未授权请求被拒绝
2. 验证过期Token被拒绝
3. 验证错误的客户端密钥被拒绝
4. 验证非法回调地址被拒绝
