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
  Grid,
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
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useNetworkStore } from '@renderer/store/networkStore'
import React from 'react'
import { UseSchedule } from './hook/useSchedule'
import { flexRender } from '@tanstack/react-table'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { IconPlus } from '@tabler/icons-react'
import CustomSelect from '@renderer/components/ui/form/theme-elements/CustomSelect'
import { useDropzone } from 'react-dropzone'

export const ScheduleEmployeePage = () => {
  const isOnline = useNetworkStore((state) => state.isOnline)

  const {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    columns,
    userId,
    handleEmployeeChange,
    employee,
    openDialog,
    setOpenDialog,
    handleSubmit,
    handleEChange,
    handleChange2,
    importSchedule,
    setImportSchedule,
    setAttachmentUrl,
    handleSubmitImport,
    newUser,
    schedule,
    handleDelete
  } = UseSchedule()

  const { getRootProps, getInputProps } = useDropzone({
    accept: '.xls, .xlsx, .csv',
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]

      setImportSchedule({
        file,
        name: file.name,
        type: file.type,
        url: ''
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('outlet_id', localStorage.getItem('outletGuid'))
      setAttachmentUrl(formData)
    }
  })

  return (
    <Box>
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        showBackButton={true}
        title="Jadwal Karyawan"
        items={[{ to: '/', title: 'Home' }, { title: 'karyawan' }, { title: 'Jadwal Karyawan' }]}
      />

      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box />
        <Box display="flex" justifyContent="flex-end" mb={2}>
          {/* {permissions.create && ( */}
          <Button
            variant="contained"
            disableElevation
            color="warning"
            sx={{ mr: 2 }}
            onClick={() => setOpenDialog((prev) => ({ ...prev, import: true }))}
          >
            Import
          </Button>
          {/* )} */}
          {/* {permissions.create && ( */}
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            disableElevation
            color="primary"
            onClick={() => setOpenDialog((prev) => ({ ...prev, addData: true }))}
          >
            Tambah Data
          </Button>
          {/* )} */}
        </Box>
      </Stack>

      <Grid size={{ xs: 12 }}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <TextField
              variant="outlined"
              label="Search"
              value={pageParams.searchTerm}
              onChange={(e) => setPageParams((prev) => ({ ...prev, searchTerm: e.target.value }))}
              fullWidth
              sx={{ mb: 2, mr: 2 }}
            />

            {/* Outlet Select Box */}
            <CustomSelect
              value={userId}
              onChange={handleEmployeeChange}
              displayEmpty
              fullWidth
              sx={{ mb: 2, ml: 2 }}
            >
              <MenuItem value="">
                <em>Semua Karyawan</em>
              </MenuItem>
              {employee.map((e) => (
                <MenuItem key={e.user_id} value={e.user_id}>
                  {e.employee_name}
                </MenuItem>
              ))}
            </CustomSelect>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
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
                ) : data.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
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
                      <Typography color="textPrimary">Tidak ada data jadwal</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Grid>

      <Dialog
        open={openDialog.import}
        onClose={() => {
          setOpenDialog((prev) => ({ ...prev, import: false }))
          setImportSchedule({
            file: null,
            name: '',
            type: '',
            url: ''
          })
        }}
      >
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <Box
              mt={0}
              fontSize="12px"
              sx={{
                backgroundColor: 'primary.light',
                color: 'primary.main',
                padding: '30px',
                textAlign: 'center',
                border: `1px dashed`,
                display: 'block',
                borderColor: 'primary.main'
              }}
              {...getRootProps({ className: 'dropzone' })}
            >
              <input {...getInputProps()} />
              <p>Drag n drop some files here, or click to select files</p>
            </Box>

            {/* Display file details after upload */}
            {importSchedule.file && (
              <Box mt={2} textAlign="center">
                <p>File: {importSchedule.name}</p> {/* Display file name */}
                <div>
                  {/* Optional: Show an Excel icon */}
                  <img
                    src="https://cdn.pixabay.com/photo/2023/06/01/12/02/excel-logo-8033473_960_720.png" // Excel logo
                    alt="Excel File Icon"
                    style={{ width: '80px', height: '50px', marginBottom: '0px' }}
                  />
                </div>
                <p>{importSchedule.type}</p> {/* Optionally display the file type */}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog((prev) => ({ ...prev, import: false }))
              setImportSchedule({
                file: null,
                name: '',
                type: '',
                url: ''
              })
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitImport}
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading || !importSchedule.file}
          >
            {loading ? 'Import...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.addData}
        onClose={() => setOpenDialog((prev) => ({ ...prev, addData: false }))}
      >
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              {/* Nama Lengkap Karyawan */}
              <Grid size={{ xs: 12 }}>
                <CustomSelect
                  value={newUser.employee_name}
                  onChange={handleEChange}
                  displayEmpty
                  fullWidth
                  sx={{}}
                >
                  <MenuItem value="">
                    <em>Pilih Karyawan</em>
                  </MenuItem>
                  {employee.map((e) => (
                    <MenuItem key={e.user_id} value={e}>
                      {e.employee_name}
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  // label="Tanggal"
                  name="date" // Ensure the name matches the state key
                  value={schedule.date} // Correct the value to refer to 'date'
                  onChange={handleChange2}
                  fullWidth
                  type="date"
                  variant="outlined"
                />
              </Grid>

              {/* Clock In */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  // label="Clock In"
                  name="clock_in" // Ensure the name matches the state key
                  value={schedule.clock_in} // Correct the value to refer to 'clock_in'
                  onChange={handleChange2}
                  fullWidth
                  type="time"
                  variant="outlined"
                />
              </Grid>

              {/* Clock Out */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  // label="Clock Out"
                  name="clock_out" // Ensure the name matches the state key
                  value={schedule.clock_out} // Correct the value to refer to 'clock_out'
                  onChange={handleChange2}
                  fullWidth
                  type="time"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog((prev) => ({ ...prev, addData: false }))}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            type="submit"
            disabled={
              loading.addData ||
              !schedule.date ||
              // || !schedule.clock_in || !schedule.clock_out
              !schedule.employee_id
            }
          >
            {loading.addData ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.delete}
        onClose={() => setOpenDialog((prev) => ({ ...prev, delete: false }))}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menghapus item ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog((prev) => ({ ...prev, delete: false }))}
            color="primary"
          >
            Batal
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDialog.updateData}
        onClose={() => setOpenDialog((prev) => ({ ...prev, updateData: false }))}
      >
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              {/* Nama Lengkap Karyawan */}
              <Grid item xs={12}>
                <CustomSelect
                  value={schedule.employee_name}
                  onChange={handleEChange}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Pilih Karyawan</em>
                  </MenuItem>
                  {employee.map((e) => (
                    <MenuItem key={e.user_id} value={e}>
                      {e.employee_name}
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>

              {/* Tanggal */}
              <Grid item xs={12}>
                <TextField
                  name="date"
                  value={schedule.date}
                  onChange={handleChange2}
                  fullWidth
                  type="date"
                  variant="outlined"
                />
              </Grid>

              {/* Clock In */}
              <Grid item xs={12}>
                <TextField
                  name="clock_in"
                  value={schedule.clock_in}
                  onChange={handleChange2}
                  fullWidth
                  type="time"
                  variant="outlined"
                />
              </Grid>

              {/* Clock Out */}
              <Grid item xs={12}>
                <TextField
                  name="clock_out"
                  value={schedule.clock_out}
                  onChange={handleChange2}
                  fullWidth
                  type="time"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          {/* <Button onClick={handleClose}>Cancel</Button> */}
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={
              loading ||
              !schedule.date ||
              !schedule.clock_in ||
              !schedule.clock_out ||
              !schedule.employee_id
            }
          >
            {loading ? 'Submitting...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
