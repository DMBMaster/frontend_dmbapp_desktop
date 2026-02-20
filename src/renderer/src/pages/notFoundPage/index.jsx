import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Card sx={{ p: 3, textAlign: 'center', maxWidth: 640, width: '100%', boxShadow: 6 }}>
        <CardContent>
          <Typography
            variant="h1"
            component="div"
            sx={{ fontSize: '4rem', mb: 4, fontWeight: 800 }}
          >
            404
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
            Halaman Tidak Ditemukan
          </Typography>
          <Typography sx={{ mb: 3 }}>
            Halaman yang Anda cari tidak ada atau telah dipindahkan. Periksa kembali alamat atau
            kembali ke beranda.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Kembali
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
