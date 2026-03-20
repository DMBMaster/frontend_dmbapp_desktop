import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useNetworkStore } from '@renderer/store/networkStore'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconEgg,
  IconFish,
  IconMeat,
  IconMickey,
  IconPig,
  IconPlus
} from '@tabler/icons-react'
import { UseReportFarm } from './hook/useFarm'
import { flexRender } from '@tanstack/react-table'
import React from 'react'

export const ReportFarmPage = () => {
  const isOnline = useNetworkStore((state) => state.isOnline)
  const {
    importFile,
    loading,
    openDialog,
    setOpenDialog,
    pageParams,
    setPageParams,
    value,
    handleChangeTabs,
    tableAyamKampung,
    tableAyamPedaging,
    tableAyamPetelur,
    tableLele,
    tablePinahan,
    handleImportFileChange,
    handleImportData
  } = UseReportFarm()
  const { page, pageSize, pageCount, totalCount } = pageParams

  // Pilih table & columns berdasarkan tab aktif
  const activeTable = [
    tableAyamKampung,
    tableAyamPedaging,
    tableAyamPetelur,
    tableLele,
    tablePinahan
  ][value]

  const columns = activeTable.getAllColumns()

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`
    }
  }

  return (
    <Box>
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}
      <Breadcrumb
        title="Daftar Peternakan"
        items={[
          { to: '/', title: 'Home' },
          { title: 'Peternakan' },
          { title: 'Daftar Peternakan' }
        ]}
      />
      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box />
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            disableElevation
            color="warning"
            sx={{ mr: 2 }}
            onClick={() => setOpenDialog((prev) => ({ ...prev, import: true }))}
          >
            Import
          </Button>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            disableElevation
            color="primary"
            // onClick={() => setOpenDialog((prev) => ({ ...prev, addData: true }))}
          >
            Tambah Data
          </Button>
        </Box>
      </Stack>

      <Grid size={{ xs: 12 }}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <TextField
              variant="outlined"
              label="Search"
              value={pageParams.searchTerm}
              onChange={(e) =>
                setPageParams((prev) => ({ ...prev, searchTerm: e.target.value, page: 1 }))
              }
              fullWidth
              sx={{ mb: 2, mr: 2 }}
            />
          </Box>
        </Box>
      </Grid>

      <Box>
        <Tabs
          value={value}
          onChange={handleChangeTabs}
          scrollButtons="auto"
          aria-label="basic tabs example"
        >
          <Tab
            iconPosition="start"
            icon={<IconMickey size="22" />}
            label="Ayam Kampung"
            {...a11yProps(0)}
          />
          <Tab
            iconPosition="start"
            icon={<IconMeat size="22" />}
            label="Ayam Pedaging"
            {...a11yProps(1)}
          />
          <Tab
            iconPosition="start"
            icon={<IconEgg size="22" />}
            label="Ayam Petelur"
            {...a11yProps(2)}
          />
          <Tab iconPosition="start" icon={<IconFish size="22" />} label="Lele" {...a11yProps(3)} />
          <Tab
            iconPosition="start"
            icon={<IconPig size="22" />}
            label="Pinahan"
            {...a11yProps(4)}
          />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              {activeTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableCell key={header.id}>
                      <Box
                        onClick={header.column.getToggleSortingHandler()}
                        sx={{
                          cursor: header.column.getCanSort() ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          '&:hover': {
                            color: header.column.getCanSort() ? 'primary.main' : 'inherit'
                          }
                        }}
                      >
                        <Typography variant="h6" mb={1}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Typography>
                        {header.column.getCanSort() && (
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <ExpandLessIcon
                              sx={{
                                fontSize: 18,
                                opacity: header.column.getIsSorted() === 'asc' ? 1 : 0.3,
                                mb: -0.5
                              }}
                            />
                            <ExpandMoreIcon
                              sx={{
                                fontSize: 18,
                                opacity: header.column.getIsSorted() === 'desc' ? 1 : 0.3,
                                mt: -0.5
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>

            <TableBody>
              {loading.fetchData ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <CircularProgress />
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : activeTable.getRowModel().rows.length > 0 ? (
                activeTable.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow hover>
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell key={index}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Typography color="textPrimary">Tidak ada data</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Stack
        gap={1}
        p={3}
        alignItems="center"
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
      >
        <Typography variant="body1" color="textPrimary">
          {totalCount} Rows
        </Typography>

        <Stack direction="row" alignItems="center" gap={1}>
          <IconButton
            size="small"
            onClick={() => setPageParams((prev) => ({ ...prev, page: 1 }))}
            disabled={page === 1}
          >
            <IconChevronsLeft />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setPageParams((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={page === 1}
          >
            <IconChevronLeft />
          </IconButton>
          <Typography variant="body1" color="textPrimary">
            Page {page} of {pageCount || 1}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setPageParams((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={page >= pageCount}
          >
            <IconChevronRight />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setPageParams((prev) => ({ ...prev, page: pageCount }))}
            disabled={page >= pageCount}
          >
            <IconChevronsRight />
          </IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="body1" color="textPrimary">
            Rows per page:
          </Typography>
          <Select
            value={pageSize}
            onChange={(e) =>
              setPageParams((prev) => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))
            }
          >
            {[10, 15, 20, 25].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>
      <Divider />

      {/* Dialog Import */}
      <Dialog
        open={openDialog.import}
        onClose={() => setOpenDialog((prev) => ({ ...prev, import: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Data Peternakan</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Pilih file Excel (.xls, .xlsx) yang berisi data peternakan untuk diimpor.
          </DialogContentText>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFileChange}
            style={{ display: 'none' }}
            id="import-file-input"
          />

          <label htmlFor="import-file-input">
            <Button variant="outlined" component="span" fullWidth sx={{ mb: 2 }}>
              {importFile ? importFile.name : 'Pilih File'}
            </Button>
          </label>

          {importFile && (
            <Typography variant="body2" color="text.secondary">
              File terpilih: {importFile.name} ({(importFile.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpenDialog((prev) => ({ ...prev, import: false }))}
            disabled={loading.importData}
          >
            Batal
          </Button>
          <Button
            onClick={handleImportData}
            variant="contained"
            disabled={!importFile || loading.importData}
          >
            {loading.importData ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Mengimpor...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
