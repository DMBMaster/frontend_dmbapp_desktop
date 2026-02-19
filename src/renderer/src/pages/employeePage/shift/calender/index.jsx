import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useNetworkStore } from '@renderer/store/networkStore'
import { UseCalender } from './hook/useCalender'
import { id } from 'date-fns/locale'
import { format, parseISO } from 'date-fns'

export const CalenderShiftEmployeePage = () => {
  const isOnline = useNetworkStore((state) => state.isOnline)
  const {
    loading,
    employees,
    startDate,
    setStartDate,
    employeeId,
    setEmployeeId,
    endDate,
    setEndDate,
    fetchData,
    dates,
    attendanceData
  } = UseCalender()
  return (
    <Box>
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        showBackButton={true}
        title="Jadwal Shift Calender"
        items={[{ to: '/', title: 'Home' }, { title: 'karyawan' }, { title: 'Jadwal Shift' }]}
      />

      <Grid size={{ xs: 12 }}>
        <Box>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 2 }}>
              <FormControl fullWidth variant="outlined">
                <FormLabel htmlFor="start-date">Tanggal Mulai</FormLabel>
                <TextField
                  id="start-date"
                  type="date"
                  variant="outlined"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 2 }}>
              <FormControl fullWidth variant="outlined">
                <FormLabel htmlFor="end-date">Tanggal Akhir</FormLabel>
                <TextField
                  id="end-date"
                  type="date"
                  variant="outlined"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 3 }}>
              <FormLabel htmlFor="end-date">Pilih Karyawan</FormLabel>
              <Autocomplete
                value={employees.find((e) => e.user_id === employeeId) || null}
                onChange={(event, newValue) => {
                  setEmployeeId(newValue ? newValue.user_id : '')
                }}
                options={employees}
                getOptionLabel={(option) => option.employee_name || ''}
                isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
                loading={loading.fetchEmployees}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading.fetchEmployees ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 2 }} display="flex" alignItems="center">
              <Button
                variant="contained"
                onClick={fetchData}
                disabled={!startDate || !endDate}
                fullWidth
                sx={{ mt: 2, height: '45px' }}
              >
                Fetch Data
              </Button>
            </Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table id="attendance-table">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>Posisi</TableCell>

                  {loading.fetchData ? (
                    <TableCell colSpan={dates.length * 2} align="center">
                      <CircularProgress />
                    </TableCell>
                  ) : (
                    dates &&
                    dates.map((date) => (
                      <TableCell
                        colSpan={2}
                        key={date}
                        sx={{
                          textAlign: 'left',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {format(parseISO(date), 'd MMM', { locale: id })}
                      </TableCell>
                    ))
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceData.map((employee, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{employee.employee_name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    {dates.map((date) => {
                      console.log(date, 'isi dateee')
                      console.log(employee.schedule, 'Employee Schedule')

                      const shift = employee.schedule.find((s) => s.date === date)
                      console.log(shift, 'Shift Data')

                      return (
                        <TableCell
                          sx={{
                            whiteSpace: 'nowrap'
                          }}
                          colSpan={2}
                          key={date}
                        >
                          {shift
                            ? `${shift.clock_in}${shift.clock_out === '' ? '' : ' - ' + shift.clock_out}`
                            : '-'}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Grid>
    </Box>
  )
}
