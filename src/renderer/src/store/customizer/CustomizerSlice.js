import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeDir: 'ltr',
  activeMode: 'light', // light atau dark
  activeTheme: 'ORANGE_THEME', // BLUE_THEME, AQUA_THEME, PURPLE_THEME, GREEN_THEME, CYAN_THEME, ORANGE_THEME
  SidebarWidth: 270,
  MiniSidebarWidth: 87,
  TopbarHeight: 70,
  isCollapse: false,
  isLayout: 'full', // full, boxed
  isSidebarHover: false,
  isMobileSidebar: false,
  isHorizontal: false,
  isLanguage: 'id',
  isCardShadow: true,
  borderRadius: 7
}

export const CustomizerSlice = createSlice({
  name: 'customizer',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.activeTheme = action.payload
    },
    setDarkMode: (state, action) => {
      state.activeMode = action.payload
    },
    setDir: (state, action) => {
      state.activeDir = action.payload
    },
    setLanguage: (state, action) => {
      state.isLanguage = action.payload
    },
    setCardShadow: (state, action) => {
      state.isCardShadow = action.payload
    },
    toggleSidebar: (state) => {
      state.isCollapse = !state.isCollapse
    },
    hoverSidebar: (state, action) => {
      state.isSidebarHover = action.payload
    },
    toggleMobileSidebar: (state) => {
      state.isMobileSidebar = !state.isMobileSidebar
    },
    toggleLayout: (state, action) => {
      state.isLayout = action.payload
    },
    toggleHorizontal: (state, action) => {
      state.isHorizontal = action.payload
    },
    setBorderRadius: (state, action) => {
      state.borderRadius = action.payload
    }
  }
})

export const {
  setTheme,
  setDarkMode,
  setDir,
  setLanguage,
  setCardShadow,
  toggleSidebar,
  hoverSidebar,
  toggleMobileSidebar,
  toggleLayout,
  toggleHorizontal,
  setBorderRadius
} = CustomizerSlice.actions

export default CustomizerSlice.reducer
