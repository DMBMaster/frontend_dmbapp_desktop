'use client'
import { useTheme } from '@mui/material/styles'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { useSelector } from 'react-redux'

// eslint-disable-next-line react/prop-types
export const DashboardWidgetCard = ({ title, subtitle, children }) => {
  const customizer = useSelector((state) => state.customizer)

  const theme = useTheme()
  const borderColor = theme.palette.grey[100]

  return (
    <Card
      sx={{ padding: 0, border: !customizer.isCardShadow ? `1px solid ${borderColor}` : 'none' }}
      elevation={customizer.isCardShadow ? 9 : 0}
      variant={!customizer.isCardShadow ? 'outlined' : undefined}
    >
      <CardContent sx={{ p: '30px' }}>
        {title ? (
          <Box>
            {title ? <Typography variant="h5">{title}</Typography> : ''}

            {subtitle ? (
              <Typography variant="subtitle2" color="textSecondary">
                {subtitle}
              </Typography>
            ) : (
              ''
            )}
          </Box>
        ) : null}

        {children}
      </CardContent>
    </Card>
  )
}
