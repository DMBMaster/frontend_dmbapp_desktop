import { create } from 'zustand'

export const useConfigStore = create((set) => ({
  config: undefined,
  assetsPathConfig: '',
  isLoading: true,

  // 🔄 fetch config dari preload API (Electron)
  fetchConfig: async () => {
    try {
      const cfg = await window.api.getMyConfig()
      const img = await window.api.getImage()
      set({ config: cfg, assetsPathConfig: img, isLoading: false })
    } catch (err) {
      console.error('Failed to load config:', err)
      set({ isLoading: false })
    }
  },

  setConfig: (cfg) => set({ config: cfg })
}))
