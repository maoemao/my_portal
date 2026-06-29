# Portal系统

统一认证与子系统管理门户，基于 Next.js 15 + Ant Design 5 + qiankun 微前端架构。

## 功能特性

- **用户认证**：注册、登录、登出、JWT Token认证
- **子系统管理**：子系统CRUD、独立部署、启用/禁用
- **Token服务**：为子系统生成专属Token、刷新、验证
- **微前端集成**：qiankun框架，子系统独立部署
- **API文档**：Swagger UI自动生成接口文档
- **Docker部署**：一键部署，自动初始化数据库和管理员账号

## 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 15.x |
| UI | Ant Design | 5.x |
| 微前端 | qiankun | 2.x |
| 数据库 | PostgreSQL | 16.x |
| ORM | Prisma | 5.x |
| 状态管理 | TanStack React Query | 5.x |
| 认证 | JWT | - |
| API文档 | Swagger UI | - |

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.x（或使用Docker）

### 本地开发

#### 1. 安装依赖

```bash
npm install
```

#### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

修改 `DATABASE_URL` 为你的PostgreSQL连接地址：

```
DATABASE_URL="postgresql://user:password@localhost:5432/portal?schema=public"
```

#### 3. 数据库迁移

```bash
npx prisma migrate dev --name init
```

#### 4. 创建管理员账号

```bash
npx tsx scripts/init-admin.ts
```

默认管理员账号：
- 邮箱：`admin@qq.com`
- 密码：`1234qwer`

#### 5. 启动开发服务器

```bash
npm run dev
```

访问地址：http://localhost:3000

### Docker部署

#### 1. 使用Docker Compose（推荐）

```bash
docker-compose up -d
```

该命令会：
- 启动PostgreSQL 16数据库
- 构建并启动Portal应用
- 自动运行数据库迁移

#### 2. 访问应用

- 应用地址：http://localhost:3000
- API文档：http://localhost:3000/docs

#### 3. 查看日志

```bash
docker-compose logs -f app
```

#### 4. 停止服务

```bash
docker-compose down
```

#### 5. 完全清理（包括数据卷）

```bash
docker-compose down -v
```

### 构建生产版本

```bash
npm run build
npm run start
```

## 项目结构

```
my_portal/
├── app/                    # Next.js应用目录
│   ├── api/               # API路由
│   │   ├── auth/          # 认证相关API
│   │   ├── systems/       # 子系统API
│   │   ├── tokens/        # Token API
│   │   └── users/         # 用户API
│   ├── (auth)/            # 认证页面（登录/注册）
│   ├── (dashboard)/       # 主应用页面
│   │   ├── app/[systemCode]/  # 微应用容器
│   │   ├── profile/       # 个人中心
│   │   └── systems/       # 子系统管理
│   ├── docs/              # Swagger文档页面
│   ├── layout.tsx         # 根布局
│   └── providers.tsx      # React Query Provider
├── lib/                   # 核心库
│   ├── auth.ts            # 认证工具
│   ├── prisma.ts          # Prisma客户端
│   ├── jwt.ts             # JWT工具
│   ├── qiankun.ts         # qiankun配置
│   └── swagger.ts         # Swagger配置
├── prisma/                # Prisma配置
│   └── schema.prisma      # 数据库模型
├── scripts/               # 脚本
│   ├── init-admin.ts      # 初始化管理员账号（开发环境）
│   ├── init-admin.js      # 初始化管理员账号（Docker环境）
│   └── start.sh           # Docker启动脚本
├── middleware.ts          # 路由中间件
├── Dockerfile             # Docker镜像构建文件
├── docker-compose.yml     # Docker Compose配置
├── .dockerignore          # Docker忽略文件
├── .env.example           # 环境变量模板
└── package.json           # 项目配置
```

## API文档

访问地址：http://localhost:3000/docs

## 路由说明

| 路径 | 说明 | 权限 |
|------|------|------|
| `/login` | 登录页面 | 公开 |
| `/register` | 注册页面 | 公开 |
| `/` | 首页 | 登录用户 |
| `/app/:systemCode` | 子系统微应用 | 登录用户 |
| `/profile` | 个人中心 | 登录用户 |
| `/systems` | 子系统管理 | ADMIN |
| `/oauth-clients` | OAuth客户端管理 | ADMIN |
| `/docs` | API文档 | 公开 |

## 外部应用认证集成

Portal系统提供两种认证集成方式：OAuth2.0授权码模式（推荐）和Token直传模式（简单场景）。

### OAuth2.0 授权码模式（推荐）

#### 1. 注册OAuth客户端

1. 管理员登录Portal
2. 进入「OAuth客户端管理」页面
3. 点击「创建」按钮
4. 填写客户端信息：
   - **名称**：应用名称
   - **回调地址**：授权成功后重定向的地址（支持多个）
   - **权限范围**：需要的用户信息权限（默认 openid profile email）

创建成功后会获得：
- **Client ID**：客户端标识符
- **Client Secret**：客户端密钥（请妥善保管）

#### 2. 认证流程

```javascript
// 1. 重定向到Portal授权页
const authUrl = `${portalUrl}/api/oauth/authorize?` + new URLSearchParams({
  client_id: 'your-client-id',
  redirect_uri: 'https://your-app.com/callback',
  response_type: 'code',
  scope: 'openid profile email',
  state: 'random-state-value' // 用于防止CSRF攻击
})
window.location.href = authUrl

// 2. 在回调地址处理授权码
// https://your-app.com/callback?code=xxx&state=xxx

// 3. 换取Token
const tokenResponse = await fetch(`${portalUrl}/api/oauth/token`, {
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
const { access_token, refresh_token, expires_in } = await tokenResponse.json()

// 4. 获取用户信息
const userResponse = await fetch(`${portalUrl}/api/oauth/userinfo`, {
  headers: { Authorization: `Bearer ${access_token}` }
})
const userInfo = await userResponse.json()

// 5. 建立本地会话
sessionStorage.setItem('user', JSON.stringify(userInfo))

// 6. 刷新Token（当access_token过期时）
const refreshResponse = await fetch(`${portalUrl}/api/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    refresh_token: refresh_token,
    grant_type: 'refresh_token'
  })
})
```

#### 3. OAuth接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/oauth/authorize` | GET | 授权请求入口 |
| `/api/oauth/token` | POST | 获取/刷新Token |
| `/api/oauth/userinfo` | GET | 获取用户信息 |
| `/api/oauth/logout` | POST | 登出 |

### Token直传模式（简单场景）

适用于通过qiankun微前端集成的子系统。

#### 1. 通过qiankun props获取

```javascript
export async function mount(props) {
  const { token, userInfo } = props
  
  // 直接使用用户信息
  console.log('用户信息:', userInfo)
  
  // 使用Token调用Portal API
  const response = await fetch(`${portalUrl}/api/tokens/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
}
```

#### 2. 通过全局状态订阅

```javascript
import { initGlobalState } from 'qiankun'

const actions = initGlobalState({
  token: '',
  userInfo: null
})

actions.onGlobalStateChange((state) => {
  console.log('全局状态变化:', state)
  // 更新本地状态
})
```

### 示例：Express中间件验证Token

```javascript
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

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: '受保护资源', user: req.user })
})
```

## 子系统接入指南

### 1. 创建子系统

通过管理员账号登录，进入「子系统管理」页面，点击「创建」按钮：

- **名称**：子系统显示名称
- **编码**：子系统唯一标识（英文）
- **URL**：子系统部署地址

### 2. 子系统开发

子系统需要支持 qiankun 微前端协议，实现以下生命周期钩子：

```javascript
export async function bootstrap() {
  console.log('子系统启动')
}

export async function mount(props) {
  console.log('子系统挂载', props)
}

export async function unmount() {
  console.log('子系统卸载')
}
```

### 3. 获取Token

子系统可以通过以下方式获取Token：

1. **props传递**：mount时通过props获取
2. **全局状态**：通过qiankun全局状态订阅
3. **API调用**：`GET /api/tokens/{systemCode}`

## 数据库模型

### User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | UUID主键 |
| email | String | 邮箱（唯一） |
| password | String | 密码（加密） |
| name | String | 姓名 |
| avatar | String | 头像URL |
| role | String | 角色（USER/ADMIN） |
| status | String | 状态（ACTIVE/INACTIVE） |

### System（子系统）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | UUID主键 |
| name | String | 名称 |
| code | String | 编码（唯一） |
| url | String | 部署地址 |
| icon | String | 图标 |
| description | String | 描述 |
| isActive | Boolean | 是否启用 |

### Token（Token记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | UUID主键 |
| userId | String | 用户ID |
| systemId | String | 子系统ID |
| token | String | Token值 |
| expiresAt | DateTime | 过期时间 |

## 开发规范

- 使用 TypeScript 编写代码
- 组件使用 `'use client'` 指令
- API路由使用 Next.js App Router
- 数据库操作使用 Prisma
- 状态管理使用 React Query

## 许可证

MIT
