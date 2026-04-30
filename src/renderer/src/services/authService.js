import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { useNavigate } from 'react-router-dom'

const AuthService = () => {
  const axiosInstance = useAxiosInstance()
  const navigate = useNavigate()

  const sendOtpAuth = async (data) => {
    try {
      const response = await axiosInstance.post(`auth/send-otp`, data)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const verifyOtpAuth = async (data) => {
    try {
      const params = new URLSearchParams()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const response = await axiosInstance.post(`auth/verify-otp`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const loginAuthV4 = async (data) => {
    try {
      const response = await axiosInstance.post(`merchant/user/login-v4`, data)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const verifyOtpAuthV4 = async (data) => {
    try {
      const response = await axiosInstance.post(`merchant/user/verify-login-v4`, data)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const logout = async () => {
    localStorage.removeItem('userLogin')
    navigate('/login')
  }

  return {
    verifyOtpAuth,
    sendOtpAuth,
    loginAuthV4,
    verifyOtpAuthV4,
    logout
  }
}

export default AuthService
