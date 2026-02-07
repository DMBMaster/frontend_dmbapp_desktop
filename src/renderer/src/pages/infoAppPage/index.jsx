import { useEffect, useState } from 'react'
import { Box, Paper, Typography, Button, Stack, LinearProgress, Divider } from '@mui/material'
import { Update as UpdateIcon } from '@mui/icons-material'
import { appVersion } from '@renderer/utils/versionApp'
import { useNavigate } from 'react-router-dom'

export const InfoAppPage = () => {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [, setOpenedProgress] = useState(false)
  const [, setDownloadProgress] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        navigate('/')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate])

  useEffect(() => {
    const handleProgress = (_event, percent) => {
      setDownloadProgress(percent)
      setOpenedProgress(true)
      if (percent >= 100) {
        setTimeout(() => setOpenedProgress(false), 2000)
      }
    }

    window.electron.ipcRenderer.on('update:download-progress', handleProgress)
    return () => {
      window.electron.ipcRenderer.removeAllListeners('update:download-progress')
    }
  }, [])

  // const isUpdateAvailable = appVersion !== latestVersion

  const checkForUpdates = async () => {
    setChecking(true)
    window.electron.ipcRenderer.send('check-for-updates')
    setChecking(false)
  }

  const handleUpdate = async () => {
    setUpdating(true)
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((r) => setTimeout(r, 300))
      setProgress(i)
    }
    setUpdating(false)
    alert('Update downloaded. App will restart.')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        padding: 10,
        bgcolor: '#f5f5f5'
      }}
    >
      <Typography variant="h5" color="black" fontWeight={700} mb={2}>
        Application Info
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          {/* App Name */}
          <Box>
            <Typography fontWeight={600}>Satu DMB Desktop</Typography>
            <Typography variant="caption" color="text.secondary">
              Desktop System Satu DMB
            </Typography>
          </Box>

          <Divider />

          {/* Versions */}
          <Stack direction="row" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Current Version
              </Typography>
              <Typography fontWeight={600}>v{appVersion}</Typography>
            </Box>

            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">
                Latest Version
              </Typography>
              {/* <Typography fontWeight={600} color={isUpdateAvailable ? 'primary' : 'text.primary'}>
                v{latestVersion}
              </Typography> */}
            </Box>
          </Stack>

          <Divider />

          {/* Update Actions */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={checkForUpdates}
              disabled={checking}
              sx={{ flex: 1 }}
            >
              {checking ? 'Checking...' : 'Check for Updates'}
            </Button>

            <Button
              variant="contained"
              startIcon={<UpdateIcon />}
              onClick={handleUpdate}
              disabled={updating}
              sx={{ flex: 1 }}
            >
              {updating ? 'Updating...' : 'Update Now'}
            </Button>
          </Stack>

          {/* Progress Bar */}
          {updating && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" mb={1}>
                Download Progress: {progress}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: 'grey.300',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5
                  }
                }}
              />
            </Box>
          )}

          <Divider />

          {/* Release Notes */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Whats New
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Bug fixes and performance improvements
              <br />
              • Enhanced user interface
              <br />
              • New dashboard features
              <br />• Security updates
            </Typography>
          </Box>

          <Divider />

          {/* App Info */}
          <Stack direction="row" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Build Date
              </Typography>
              <Typography variant="body2">{new Date().toLocaleDateString()}</Typography>
            </Box>

            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">
                Platform
              </Typography>
              <Typography variant="body2">Electron</Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* Back Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="text" onClick={() => navigate('/')} sx={{ color: 'text.secondary' }}>
          ← Back to Home
        </Button>
      </Box>
    </Box>
  )
}
