import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { FileDownload, PictureAsPdf } from '@mui/icons-material'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useReportProfit } from './hook/useReportProfit'

export const ReportProfitPage = () => {
  const report = useReportProfit()
  const {
    title,
    subtitle,
    breadcrumbs,
    permissions,
    pageParams,
    setPageParams,
    fetchData,
    exportPdf,
    exportExcel,
    reportData,
    formatNumber,
    loading,
    hasData,
    emptyLabel
  } = report

  if (!permissions.read) {
    return <Alert severity="warning">Anda tidak memiliki akses untuk melihat halaman ini.</Alert>
  }

  const summary = reportData.summary || {}

  return (
    <Stack spacing={3}>
      <Breadcrumb title={title} subtitle={subtitle} items={breadcrumbs} />

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              label="Tanggal Mulai"
              type="date"
              value={pageParams.startDate}
              onChange={(event) =>
                setPageParams((prev) => ({ ...prev, startDate: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Tanggal Akhir"
              type="date"
              value={pageParams.endDate}
              onChange={(event) =>
                setPageParams((prev) => ({ ...prev, endDate: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={fetchData}
              disabled={loading}
              sx={{ minWidth: 160 }}
            >
              Fetch Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={exportPdf}
              disabled={loading || !hasData}
              sx={{ minWidth: 140 }}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={<FileDownload />}
              onClick={exportExcel}
              disabled={loading || !hasData}
              sx={{ minWidth: 150 }}
            >
              Export Excel
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box py={8} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : !hasData ? (
        <Card>
          <CardContent>
            <Box py={6} textAlign="center">
              <Typography color="text.secondary">{emptyLabel}</Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Ringkasan
              </Typography>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Typography color="text.secondary">Total Pendapatan:</Typography>
                  <Typography variant="h5" color="success.main">
                    Rp {formatNumber(summary.totalRevenue)}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Typography color="text.secondary">Total Pengeluaran:</Typography>
                  <Typography variant="h5" color="error.main">
                    Rp {formatNumber(summary.totalExpenses)}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 4 }}>
                  <Typography color="text.secondary">Laba Kotor:</Typography>
                  <Typography variant="h5" color="success.main">
                    Rp {formatNumber(summary.grossProfit)}
                  </Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Typography color="text.secondary">Margin Laba:</Typography>
                  <Typography variant="h5">{summary.profitMargin || '0.00%'}</Typography>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <Typography color="text.secondary">Nilai Transaksi Rata-rata:</Typography>
                  <Typography variant="h5">
                    Rp{' '}
                    {formatNumber(summary.averageTransactionValue, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Pendapatan per Kategori
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Kategori</TableCell>
                          <TableCell align="right">Total (Rp)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(reportData.revenueByCategory || {}).map(
                          ([category, amount]) => (
                            <TableRow key={category}>
                              <TableCell>{category}</TableCell>
                              <TableCell align="right">{formatNumber(amount)}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Pengeluaran per Kategori
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Kategori</TableCell>
                          <TableCell align="right">Total (Rp)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(reportData.expensesByCategory || {}).map(
                          ([category, amount]) => (
                            <TableRow key={category}>
                              <TableCell>{category}</TableCell>
                              <TableCell align="right">{formatNumber(amount)}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  )
}
