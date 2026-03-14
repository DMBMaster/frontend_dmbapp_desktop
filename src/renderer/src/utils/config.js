export const companyName = 'Satu DMB'
export const companyNameSub = 'Portal Desktop'
export const byPassSubs = false
export const withLocalLogger = false

export const optionsPagination = [10, 25, 50, 100]
export const optionInitialLimit = 25
export const timeDebounce = 500

const userLogin = localStorage.getItem('userLogin')
export const userData = userLogin ? JSON.parse(userLogin) : null

const outlets = localStorage.getItem('outlets')
const userRoleTemp = localStorage.getItem('sidebar_cache')
const selectedOutletTemp = localStorage.getItem('selectedOutlet')

export const userRole = userRoleTemp ? JSON.parse(userRoleTemp) : null
export const listOutlets = outlets ? JSON.parse(outlets) : []
export const selectedOutlet = selectedOutletTemp ? JSON.parse(selectedOutletTemp) : null

export const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1482252753060499567/k4hi1pJIosOuBsPSzyrfWmbjOvztaHYfpyH6n7O7xv0MiR-46kyxSXSJCIS0JRtuy2p_'
