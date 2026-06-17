import type { System } from '@prisma/client'

export interface MicroAppConfig {
  name: string
  entry: string
  container: string
  activeRule: string
  props?: Record<string, any>
}

export async function setupQiankun(systems: System[], userInfo: Record<string, any>) {
  if (typeof window === 'undefined') return

  const { registerMicroApps, initGlobalState } = await import('qiankun')

  const microApps: MicroAppConfig[] = systems
    .filter(system => system.isActive)
    .map(system => ({
      name: system.code,
      entry: system.url,
      container: '#micro-app-container',
      activeRule: `/app/${system.code}`,
      props: {
        token: '',
        userInfo,
      },
    }))

  registerMicroApps(microApps)

  const actions = initGlobalState({
    token: '',
    userInfo,
  })

  ;(window as any).__QIANKUN_GLOBAL_STATE_ACTIONS__ = actions

  return actions
}

export async function startQiankun() {
  if (typeof window === 'undefined') return

  const { start } = await import('qiankun')
  start()
}

export async function setGlobalToken(token: string) {
  if (typeof window === 'undefined') return

  const actions = (window as any).__QIANKUN_GLOBAL_STATE_ACTIONS__
  if (actions) {
    actions.setGlobalState({ token })
  }
}
