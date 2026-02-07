import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import IconButton from '@mui/material/IconButton'
import { IconCircle, IconArrowLeft } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

// eslint-disable-next-line react/prop-types
const Breadcrumb = ({ subtitle, items, title, children, showBackButton = false, onBackClick }) => {
  const navigate = useNavigate()

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      navigate(-1)
    }
  }

  return (
    <Grid
      container
      sx={{
        backgroundColor: 'primary.light',
        borderRadius: '12px',
        p: '30px 25px 20px',
        marginBottom: '30px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Grid size={{ xs: 12, sm: 6, lg: 8 }} mb={1}>
        <Box display="flex" alignItems="center" mb={1}>
          {showBackButton && (
            <IconButton
              onClick={handleBackClick}
              sx={{
                mr: 1,
                padding: 0.5,
                color: 'text.primary'
              }}
            >
              <IconArrowLeft size={20} />
            </IconButton>
          )}
          <Typography variant="h4" color="textPrimary">
            {title}
          </Typography>
        </Box>
        <Typography color="textSecondary" variant="h6" fontWeight={400} mt={0.8} mb={0}>
          {subtitle}
        </Typography>
        <Breadcrumbs
          separator={
            <IconCircle
              size="5"
              fill="textSecondary"
              fillOpacity={'0.6'}
              style={{ margin: '0 5px' }}
            />
          }
          sx={{ alignItems: 'center', mt: items ? '10px' : '' }}
          aria-label="breadcrumb"
        >
          {items
            ? // eslint-disable-next-line react/prop-types
              items.map((item, index) => (
                <div key={`${item.title}-${index}`}>
                  {item.to ? (
                    <Link href={item.to} underline="hover" color="textSecondary">
                      <Typography color="textSecondary">{item.title}</Typography>
                    </Link>
                  ) : (
                    <Typography color="textPrimary">{item.title}</Typography>
                  )}
                </div>
              ))
            : ''}
        </Breadcrumbs>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 4 }} display="flex" alignItems="flex-end">
        <Box
          sx={{
            display: { xs: 'none', md: 'block', lg: 'flex' },
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: '100%'
          }}
        >
          {children ? <Box sx={{ top: '0px', position: 'absolute' }}>{children}</Box> : null}
        </Box>
      </Grid>
    </Grid>
  )
}

export default Breadcrumb
