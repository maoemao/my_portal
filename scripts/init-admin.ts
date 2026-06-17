import { prisma } from '../lib/prisma'
import bcrypt from 'bcrypt'

async function initAdmin() {
  const adminEmail = 'admin@qq.com'
  const adminPassword = '1234qwer'
  const adminName = '管理员'

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (existingAdmin) {
    console.log('管理员账号已存在，跳过创建')
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  console.log('管理员账号创建成功')
  console.log('邮箱:', adminEmail)
  console.log('密码:', adminPassword)
  process.exit(0)
}

initAdmin().catch((error) => {
  console.error('创建管理员账号失败:', error)
  process.exit(1)
})
