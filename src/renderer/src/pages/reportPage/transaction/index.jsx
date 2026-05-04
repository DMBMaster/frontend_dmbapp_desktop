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
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { useReportTransaction } from './hook/useReportTransaction'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'

export const ReportTransactionPage = () => {
  const report = useReportTransaction()
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
    detailSections = [],
    columns,
    showSearch = true,
    searchPlaceholder = 'Cari data',
    status,
    setStatus,
    statusOptions = [],
    dateInputType = 'date',
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
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Ringkasan
          </Typography>
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
                        key={row.guid || row.id || `${row.kategori || 'row'}-${index}`}
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
                        {new Intl.NumberFormat('id-ID').format(
                          data.reduce((acc, row) => acc + Number(row.total_qty || 0), 0)
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {new Intl.NumberFormat('id-ID').format(
                          data.reduce((acc, row) => acc + Number(row.total_sub_total || 0), 0)
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {new Intl.NumberFormat('id-ID').format(
                          data.reduce((acc, row) => acc + Number(row.total_submit || 0), 0)
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {new Intl.NumberFormat('id-ID').format(
                          data.reduce((acc, row) => acc + Number(row.total_paid || 0), 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      {!loading && detailSections.length > 0
        ? detailSections.map((section) => (
            <Card key={section.categoryName}>
              <CardContent sx={{ p: 0 }}>
                <Box px={3} py={2}>
                  <Typography variant="h6">{section.categoryName}</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Extranet</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Harga</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Sub Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {section.rows.map((row, idx) => (
                        <TableRow key={row.guid || row.id || `${section.categoryName}-${idx}`}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{row.extranet || '-'}</TableCell>
                          <TableCell>{row.product_code || row.code || '-'}</TableCell>
                          <TableCell>{row.name || '-'}</TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('id-ID').format(Number(row.price || 0))}
                          </TableCell>
                          <TableCell align="right">{Number(row.qty || 0)}</TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('id-ID').format(Number(row.sub_total || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={5} sx={{ fontWeight: 700, textAlign: 'right' }}>
                          Total:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {section.totalQty}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {new Intl.NumberFormat('id-ID').format(section.totalSubTotal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))
        : null}
    </Stack>
  )
}
