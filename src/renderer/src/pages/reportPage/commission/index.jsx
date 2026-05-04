import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useReportCommission } from './hook/useReportCommission'

export const ReportCommissionPage = () => {
  const report = useReportCommission()
  const {
    title,
    subtitle,
    breadcrumbs,
    permissions,
    pageParams,
    setPageParams,
    fetchData,
    loading,
    data,
    columns,
    totalAmount,
    formatNumber,
    emptyLabel
  } = report

  if (!permissions.read) {
    return <Alert severity="warning">Anda tidak memiliki akses untuk melihat halaman ini.</Alert>
  }

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
                setPageParams((prev) => ({ ...prev, startDate: event.target.value, page: 1 }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Tanggal Akhir"
              type="date"
              value={pageParams.endDate}
              onChange={(event) =>
                setPageParams((prev) => ({ ...prev, endDate: event.target.value, page: 1 }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={fetchData}
              disabled={loading}
              sx={{ minWidth: 150 }}
            >
              Fetch Data
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box py={6} display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : data.length === 0 ? (
            <Box py={6} textAlign="center">
              <Typography color="text.secondary">{emptyLabel}</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <TableCell key={column.id} align={column.align || 'left'}>
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow
                        key={
                          row.guid ||
                          row.id ||
                          `${row.transaction?.transaction_no || 'row'}-${index}`
                        }
                        hover
                      >
                        {columns.map((column) => (
                          <TableCell key={column.id} align={column.align || 'left'}>
                            {column.render ? column.render(row, index) : row[column.id] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatNumber(totalAmount)}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={pageParams.totalCount}
                page={Math.max(pageParams.page - 1, 0)}
                onPageChange={(_, newPage) =>
                  setPageParams((prev) => ({
                    ...prev,
                    page: newPage + 1
                  }))
                }
                rowsPerPage={pageParams.pageSize}
                onRowsPerPageChange={(event) =>
                  setPageParams((prev) => ({
                    ...prev,
                    page: 1,
                    pageSize: Number(event.target.value)
                  }))
                }
                rowsPerPageOptions={[10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}
