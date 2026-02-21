import { useEffect, useState } from 'react'
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import AuthService from '@renderer/services/authService'
import { useNavigate } from 'react-router-dom'

export const useIndex = () => {
  const authService = AuthService()
  const notifier = useNotifier()
  const navigate = useNavigate()

  const [formLogin, setFormLogin] = useState({
    username: '',
    password: ''
  })
  const [appVersion, setAppVersion] = useState()

  const [errorFormLogin, setErrorFormLogin] = useState({})

  const [loading, setLoading] = useState({ submit: false })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormLogin((prev) => ({ ...prev, [name]: value }))
    setErrorFormLogin((prev) => ({ ...prev, [name]: '' }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formLogin.username.trim()) {
      newErrors.username = 'Username wajib diisi.'
    }

    if (!formLogin.password) {
      newErrors.password = 'Password wajib diisi.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrorFormLogin(newErrors)
      return
    }

    setLoading({ submit: true })

    try {
      const response = await authService.loginAuth(formLogin)
      if (response.status === 'ok' || response.status === true) {
        console.log(response?.token)

        notifier.show({
          message: 'Selamat Datang Kembali',
          description: response.message || '',
          severity: 'success'
        })

        localStorage.setItem('userLogin', JSON.stringify(response))

        const outlets = response?.outlets
        const employee = response?.employee

        if (outlets && outlets.length > 0) {
          localStorage.setItem('outlets', JSON.stringify(response?.outlets))
          localStorage.setItem('selectedOutlet', JSON.stringify(outlets[0]))
          if (employee) {
            localStorage.setItem('employee', JSON.stringify(employee))
          }
          localStorage.setItem('userId', response?.user?.uid)
          localStorage.setItem('token', response.token)
          localStorage.setItem('outletGuid', outlets[0].guid)
          localStorage.setItem('outletId', outlets[0].id.toString())
          localStorage.setItem('outletName', outlets[0].name)
          localStorage.setItem('outletPhone', outlets[0].phone)
          localStorage.setItem('outletAddress', outlets[0].address)
          localStorage.setItem('outletCategoryId', outlets[0].category_id)
          localStorage.setItem('outletCategory', outlets[0].category)
          localStorage.setItem('defaultOutlet', JSON.stringify(outlets[0]))
          const module = response.module // Assuming the module is the structure you showed
          if (module && module.name === 'Home' && module.is_active === true) {
            setTimeout(() => {
              navigate('/') // Redirect to homepage
              setLoading(false)
            }, 500)
          } else if (module && module.name === 'Housekeeping' && module.is_active === true) {
            setTimeout(() => {
              navigate('/housekeeping/rooms') // Redirect to homepage
              setLoading(false)
            }, 500)
          } else {
            setTimeout(() => {
              navigate('/transaction/history') // Redirect to transaction history
              setLoading(false)
            }, 500)
          }
        }
        navigate('/')
      } else {
        notifier.show({
          message: 'Login Gagal',
          description: response.message || 'Terjadi kesalahan saat login. Silakan coba lagi.',
          severity: 'error'
        })
      }
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Login Gagal',
        description: message,
        severity: 'error'
      })
    } finally {
      setFormLogin((prev) => ({ ...prev, password: '' }))
      setLoading({ submit: false })
    }
  }

  useEffect(() => {
    const fetchVersion = async () => {
      if (window.api && window.api.getAppVersion) {
        const version = await window.api.getAppVersion()
        setAppVersion(version)
      }
    }
    fetchVersion()
  }, [])

  return {
    formLogin,
    handleChange,
    loading,
    errorFormLogin,
    handleLogin,
    appVersion
  }
}
