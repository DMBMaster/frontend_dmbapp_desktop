import { useAxiosInstance } from '@renderer/api/axiosInstance'

const SIDEBAR_STORAGE_KEY = 'sidebar_cache'

const SidebarService = () => {
  const axiosInstance = useAxiosInstance()
  const userId = localStorage.getItem('userId')
  const outletGuid = localStorage.getItem('outletGuid')

  const getCachedSidebar = () => {
    try {
      const cached = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (!cached) return null

      const parsed = JSON.parse(cached)

      // Validasi apakah cache untuk user & outlet yang sama
      if (parsed.user_id === userId && parsed.outlet_guid === outletGuid) {
        return parsed
      }

      return null
    } catch {
      return null
    }
  }

  const saveSidebarToCache = (data) => {
    const cacheData = {
      user_id: userId,
      outlet_guid: outletGuid,
      data: data,
      updated_at: new Date().toISOString()
    }
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(cacheData))
  }

  const clearCache = () => {
    localStorage.removeItem(SIDEBAR_STORAGE_KEY)
  }

  const getAllSidebar = async (forceRefresh = false) => {
    // Cek cache dulu jika tidak force refresh
    if (!forceRefresh) {
      const cached = getCachedSidebar()
      if (cached) {
        console.log('📦 Sidebar loaded from cache')
        return { data: cached.data }
      }
    }

    try {
      // ===== ONLINE =====
      const res = await axiosInstance.get(`user-service/user-role/v2/${userId}/${outletGuid}`)

      const sidebarData = res.data

      // Simpan ke localStorage
      saveSidebarToCache(sidebarData)
      console.log('🌐 Sidebar fetched from API and cached')

      return { data: sidebarData }
    } catch (error) {
      console.warn('⚠️ Offline mode → load sidebar from cache')

      // ===== OFFLINE / ERROR =====
      const cached = getCachedSidebar()

      if (!cached) {
        console.error(error)
        throw error
      }

      return { data: cached.data }
    }
  }

  return {
    getAllSidebar,
    clearCache
  }
}

export default SidebarService
