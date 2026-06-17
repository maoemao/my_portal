export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Portal系统 API',
    version: '1.0.0',
    description: '统一认证与子系统管理门户 API 文档',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: '开发服务器',
    },
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          avatar: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['email', 'password', 'name'],
      },
      System: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          code: { type: 'string' },
          url: { type: 'string', format: 'url' },
          icon: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          sortOrder: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['name', 'code', 'url'],
      },
      Token: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          systemId: { type: 'string', format: 'uuid' },
          token: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
        },
        required: ['email', 'password', 'name'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: '登录后自动设置的Cookie',
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        summary: '用户登录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse',
                },
              },
            },
          },
          '401': {
            description: '邮箱或密码错误',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: '用户注册',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: '注册成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: '参数错误或邮箱已注册',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: '用户登出',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: '登出成功',
          },
        },
      },
    },
    '/api/auth/session': {
      get: {
        summary: '获取当前会话',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: '未登录',
          },
        },
      },
    },
    '/api/users/me': {
      get: {
        summary: '获取当前用户信息',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          '401': {
            description: '未登录',
          },
        },
      },
    },
    '/api/users': {
      get: {
        summary: '获取用户列表（管理员）',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
          '403': {
            description: '权限不足',
          },
        },
      },
    },
    '/api/systems': {
      get: {
        summary: '获取子系统列表',
        security: [{ CookieAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/System',
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: '创建子系统（管理员）',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/System',
              },
            },
          },
        },
        responses: {
          '200': {
            description: '创建成功',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/System',
                },
              },
            },
          },
          '403': {
            description: '权限不足',
          },
        },
      },
    },
    '/api/systems/{id}': {
      get: {
        summary: '获取子系统详情',
        security: [{ CookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/System',
                },
              },
            },
          },
          '404': {
            description: '子系统不存在',
          },
        },
      },
      put: {
        summary: '更新子系统（管理员）',
        security: [{ CookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/System',
              },
            },
          },
        },
        responses: {
          '200': {
            description: '更新成功',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/System',
                },
              },
            },
          },
          '403': {
            description: '权限不足',
          },
          '404': {
            description: '子系统不存在',
          },
        },
      },
      delete: {
        summary: '删除子系统（管理员）',
        security: [{ CookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: '删除成功',
          },
          '403': {
            description: '权限不足',
          },
          '404': {
            description: '子系统不存在',
          },
        },
      },
    },
    '/api/tokens/{systemCode}': {
      get: {
        summary: '获取子系统Token',
        security: [{ CookieAuth: [] }],
        parameters: [
          {
            name: 'systemCode',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '404': {
            description: '子系统不存在',
          },
        },
      },
    },
    '/api/tokens/refresh': {
      post: {
        summary: '刷新Token',
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  systemCode: { type: 'string' },
                },
                required: ['systemCode'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: '刷新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/tokens/validate': {
      post: {
        summary: '验证Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                },
                required: ['token'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: '验证成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    valid: { type: 'boolean' },
                    userId: { type: 'string' },
                    systemCode: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Token无效',
          },
        },
      },
    },
  },
}
