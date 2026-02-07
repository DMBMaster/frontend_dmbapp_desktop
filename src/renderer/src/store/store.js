import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import CustomizerReducer from './customizer/CustomizerSlice'

// Persist config untuk customizer - simpan pengaturan theme
const customizerPersistConfig = {
  key: 'customizer',
  storage,
  whitelist: ['activeMode', 'activeTheme', 'activeDir', 'borderRadius', 'isCollapse']
}

const rootReducer = combineReducers({
  customizer: persistReducer(customizerPersistConfig, CustomizerReducer)
})

export const store = configureStore({
  reducer: rootReducer,
  // devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false })
})

export const persistor = persistStore(store)