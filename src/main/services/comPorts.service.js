import { execFile } from 'child_process'

function execPowershell(shellCmd) {
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', shellCmd],
      { windowsHide: true },
      (err, stdout) => {
        if (err) return resolve([])
        resolve(
          stdout
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean)
        )
      }
    )
  })
}

export async function listComPorts() {
  const lines = await execPowershell('[System.IO.Ports.SerialPort]::GetPortNames()')
  return lines.filter((p) => /^COM\d+$/i.test(p))
}
