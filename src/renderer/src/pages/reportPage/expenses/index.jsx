import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
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
import { useReportExpenses } from './hook/useReportExpenses'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'

export const ReportExpensesPage = () => {
  const report = useReportExpenses()
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
    showSearch = true,
    searchPlaceholder = 'Cari data',
    status,
    setStatus,
    statusOptions = [],
    dateInputType = 'date',
    emptyLabel
  } = report

  const formatCurrency = (value) => {
    const amount = Number(value)
    const safeAmount = Number.isFinite(amount) ? amount : 0
    return `Rp ${new Intl.NumberFormat('id-ID').format(safeAmount)}`
  }

  const grandTotal = data.reduce((sum, row) => sum + Number(row?.total || 0), 0)

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
              label="Tanggal Awal"
              type={dateInputType}
              value={pageParams.startDate}
              onChange={(event) =>
                setPageParams((prev) => ({ ...prev, startDate: event.target.value, page: 1 }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Tanggal Akhir"
              type={dateInputType}
              value={pageParams.endDate}
              onChange={(event) =>
                setPageParams((prev) => ({ ...prev, endDate: event.target.value, page: 1 }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            {statusOptions.length > 0 ? (
              <TextField
                select
                label="Status"
                value={status || ''}
                onChange={(event) => setStatus(event.target.value)}
                fullWidth
              >
                <MenuItem value="">Semua Status</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {showSearch ? (
              <TextField
                label="Search"
                placeholder={searchPlaceholder}
                value={pageParams.searchTerm}
                onChange={(event) =>
                  setPageParams((prev) => ({ ...prev, searchTerm: event.target.value, page: 1 }))
                }
                fullWidth
              />
            ) : null}
            <Button
              variant="contained"
              onClick={fetchData}
              disabled={loading}
              sx={{ minWidth: 140 }}
            >
              Filter
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
                        key={row.guid || row.id || `${row.transaction_no || 'row'}-${index}`}
                        hover
                      >
                        {columns.map((column) => (
                          <TableCell key={column.id} align={column.align || 'left'}>
                            {column.render ? column.render(row, index) : row[column.id] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell colSpan={Math.max(columns.length - 1, 1)}>
                        <Typography fontWeight={700}>Total Keseluruhan</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700}>{formatCurrency(grandTotal)}</Typography>
                      </TableCell>
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
