# [BACKEND TASK] Endpoint Log Aktivitas Lock Card (Audit Log)

## Deskripsi
Aplikasi desktop hotel akan mengirimkan log setiap aksi penting pada Lock Card Reader/Writer (menulis kartu, cancel, daftar kartu cloud, dsb). Perlu dibuat endpoint untuk menerima dan menyimpan log ini.

## Spesifikasi Endpoint

### 1. Endpoint Utama (Kirim Log)

| Item        | Nilai                                          |
| ----------- | ---------------------------------------------- |
| **Method**  | `POST`                                         |
| **Path**    | `/lock-card/log`                               |
| **Auth**    | Bearer token (header `Authorization: Bearer <token>`) |
| **Content-Type** | `application/json`                      |
| **Response**| `200 OK` (tidak wajib mengembalikan data; `{ success: true }` cukup) |

### 2. Endpoint Tambahan (Opsional, untuk melihat log)

| Item        | Nilai                                          |
| ----------- | ---------------------------------------------- |
| **Method**  | `GET`                                          |
| **Path**    | `/lock-card/log`                               |
| **Query**   | `outlet_guid`, `user_id`, `action`, `status`, `start_date`, `end_date`, `page`, `page_size` |
| **Response**| `{ data: [...], total, page, page_size }`      |

## Payload (JSON Dinamis)

Payload dikirim sebagai JSON bebas — **tidak boleh ditolak/divalidasi ketat** karena akan terus bertambah field-nya. Minimal berisi field umum berikut:

```json
{
  "outlet_guid": "string",
  "user_id": "string",
  "timestamp": "string (ISO 8601)",
  "action": "string",
  "status": "SUCCESS | FAILED",
  "card_number": "string (opsional)",
  "error_message": "string (hanya saat FAILED)",
  "...": "field detail lain, dinamis"
}
```

Saran penyimpanan: simpan payload mentah sebagai `JSON` (mis. kolom `payload JSON` di DB), plus kolom `outlet_guid`, `user_id`, `action`, `status`, `timestamp` yang di-index agar mudah difilter.

### Enumerasi Action

| Action               | Keterangan                        |
| -------------------- | --------------------------------- |
| `WRITE_CARD`         | Tulis kartu akses kamar (single)  |
| `WRITE_MULTI_CARD`   | Tulis kartu multi-lock            |
| `WRITE_STAFF_CARD`   | Tulis kartu staff                 |
| `CANCEL_CARD`        | Cancel / tangguhkan kartu         |
| `CLEAR_CARD`         | Kosongkan kartu                   |
| `DEINIT_CARD`        | Kembalikan kartu ke blank         |
| `ADD_CLOUD_CARD`     | Daftarkan kartu ke cloud          |
| `DELETE_CLOUD_CARD`  | Hapus kartu dari cloud            |

## Contoh Payload (Real, apa adanya dari aplikasi)

### 1. WRITE_CARD — SUCCESS
```json
{
  "outlet_guid": "9a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "user_id": "123",
  "timestamp": "2026-08-14T10:30:00.000Z",
  "action": "WRITE_CARD",
  "status": "SUCCESS",
  "card_number": "1428579301",
  "lock_id": 56782,
  "lock_name": "Kamar 102",
  "lock_mac": "AA:BB:CC:DD:EE:FF",
  "building_no": 1,
  "floor_no": 1,
  "start_date": "2026-08-14T12:00",
  "end_date": "2026-08-28T12:00",
  "allow_lockout": false
}
```

### 2. WRITE_MULTI_CARD — SUCCESS
```json
{
  "outlet_guid": "9a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "user_id": "123",
  "timestamp": "2026-08-14T10:35:00.000Z",
  "action": "WRITE_MULTI_CARD",
  "status": "SUCCESS",
  "card_number": "1428579302",
  "lock_ids": [56782, 56783],
  "lock_names": ["Kamar 102", "Kamar 103"],
  "lock_macs": ["AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"],
  "building_no": 1,
  "floor_no": 1,
  "start_date": "2026-08-14T12:00",
  "end_date": "Permanent",
  "allow_lockout": true
}
```

### 3. WRITE_STAFF_CARD — SUCCESS
```json
{
  "outlet_guid": "9a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "user_id": "123",
  "timestamp": "2026-08-14T10:40:00.000Z",
  "action": "WRITE_STAFF_CARD",
  "status": "SUCCESS",
  "card_number": "1428579303",
  "staff_card_type": "master",
  "building_no": 0,
  "floor_no": 0,
  "start_date": "2026-08-14T12:00",
  "end_date": "Permanent",
  "allow_lockout": true
}
```

### 4. CANCEL_CARD — FAILED
```json
{
  "outlet_guid": "9a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "user_id": "123",
  "timestamp": "2026-08-14T10:45:00.000Z",
  "action": "CANCEL_CARD",
  "status": "FAILED",
  "card_number": "1428579301",
  "error_message": "Gagal melakukan cancel kartu: encoder tidak merespon"
}
```

### 5. CLEAR_CARD — SUCCESS
```json
{
  "outlet_guid": "9a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "user_id": "123",
  "timestamp": "2026-08-14T10:50:00.000Z",
  "action": "CLEAR_CARD",
  "status": "SUCCESS",
  "card_number": "1428579301"
}
```

### 6. DEINIT_CARD — SUCCESS
```json
{
  "outlet_guid": "9a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "user_id": "123",
  "timestamp": "2026-08-14T10:55:00.000Z",
  "action": "DEINIT_CARD",
  "status": "SUCCESS",
  "card_number": "1428579301"
}
```

### 7. ADD_CLOUD_CARD — SUCCESS
```json
{
  "outlet_guid": "9a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "user_id": "123",
  "timestamp": "2026-08-14T11:00:00.000Z",
  "action": "ADD_CLOUD_CARD",
  "status": "SUCCESS",
  "card_id": 998877,
  "lock_id": 56782,
  "lock_name": "Kamar 102",
  "lock_mac": "AA:BB:CC:DD:EE:FF",
  "card_name": "Budi Kamar 102",
  "card_number": "1428579304",
  "start_date": "2026-08-14T12:00",
  "end_date": "2026-08-28T12:00",
  "allow_lockout": false,
  "byte_order": "normal"
}
```

### 8. DELETE_CLOUD_CARD — SUCCESS
```json
{
  "outlet_guid": "9a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "user_id": "123",
  "timestamp": "2026-08-14T11:05:00.000Z",
  "action": "DELETE_CLOUD_CARD",
  "status": "SUCCESS",
  "lock_id": 56782,
  "lock_name": "Kamar 102",
  "lock_mac": "AA:BB:CC:DD:EE:FF",
  "card_id": 998877,
  "card_name": "Budi Kamar 102",
  "card_number": "1428579304"
}
```

## Aturan / Catatan untuk Backend
1. Terima payload JSON apa adanya; jangan paksa skema kaku.
2. `status` bernilai `SUCCESS` atau `FAILED` (uppercase).
3. `error_message` hanya terisi saat `FAILED`.
4. `timestamp` dikirim sebagai ISO 8601 (UTC).
5. `card_number` tidak selalu ada (kosong pada beberapa aksi gagal).
6. Endpoint ini dipanggil fire-and-forget dari desktop — pastikan respons cepat (tidak perlu blokir), dan jangan error bila ada field baru yang tidak dikenal.
7. Simpan minimal kolom index: `outlet_guid`, `user_id`, `action`, `status`, `timestamp`.
