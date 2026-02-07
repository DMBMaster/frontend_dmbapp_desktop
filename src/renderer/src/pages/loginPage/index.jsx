import { useState } from 'react'
import { Box, TextField, Button, Typography, Link, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useIndex } from './hook'
import { useConfigStore } from '../../store/configProvider'

export const LoginPage = () => {
  const { formLogin, handleChange, loading, errorFormLogin, handleLogin } = useIndex()
  const { assetsPathConfig } = useConfigStore()
  const [showPassword, setShowPassword] = useState(false)

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#f5f5f5'
      }}
    >
      {/* Left Section - Illustration */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#e8f4f8',
          position: 'relative',
          p: 4
        }}
      >
        {/* Logo di kiri atas */}
        <Box
          sx={{
            position: 'absolute',
            top: 40,
            left: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#DD5070',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
            </svg>
          </Box>
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#DD5070',
              letterSpacing: '0.5px'
            }}
          >
            DMB SATU
          </Typography>
        </Box>

        {/* Illustration */}
        <Box
          sx={{
            maxWidth: 500,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <img
            src={`${assetsPathConfig}\\images\\auth-side-2.svg`}
            alt="Login Illustration"
            style={{
              width: '100%',
              maxWidth: '450px',
              height: 'auto'
            }}
          />
        </Box>
      </Box>

      {/* Right Section - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          bgcolor: 'white'
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 400
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#2C3E50',
                mb: 1
              }}
            >
              Selamat Datang
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#7F8C8D',
                fontSize: '1rem'
              }}
            >
              Silakan masuk ke akun Anda untuk melanjutkan
            </Typography>
          </Box>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2C3E50',
                  mb: 1
                }}
              >
                Username
              </Typography>
              <TextField
                fullWidth
                name="username"
                placeholder="Masukkan username"
                value={formLogin.username}
                onChange={handleChange}
                error={!!errorFormLogin.username}
                helperText={errorFormLogin.username}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F8F9FA',
                    '& fieldset': {
                      borderColor: 'transparent'
                    },
                    '&:hover fieldset': {
                      borderColor: '#DD5070'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#DD5070'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2C3E50',
                  mb: 1
                }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={formLogin.password}
                onChange={handleChange}
                error={!!errorFormLogin.password}
                helperText={errorFormLogin.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        sx={{ color: '#7F8C8D' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F8F9FA',
                    '& fieldset': {
                      borderColor: 'transparent'
                    },
                    '&:hover fieldset': {
                      borderColor: '#DD5070'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#DD5070'
                    }
                  }
                }}
              />
            </Box>

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Link
                href="#"
                sx={{
                  color: '#DD5070',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Lupa password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              disabled={loading.submit}
              sx={{
                py: 1.8,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #DD5070, #FFAD84)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 20px rgba(250, 137, 107, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #F4795C, #DD5070)',
                  boxShadow: '0 6px 25px rgba(250, 137, 107, 0.5)'
                },
                '&:disabled': {
                  background: '#E0E0E0',
                  color: '#9E9E9E',
                  boxShadow: 'none'
                }
              }}
            >
              {loading.submit ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#7F8C8D',
                fontSize: '14px'
              }}
            >
              © 2024 DMB SATU. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
