# API Tracking Aktivitas Lock Card (Audit Log)

Dokumen ini menjelaskan endpoint dan payload yang dikirim aplikasi desktop **satuDMB** setiap kali operator melakukan aksi penting pada Lock Card Reader/Writer (halaman `/setting/lock-card`).

## Endpoint

| Item        | Nilai                                                         |
| ----------- | ------------------------------------------------------------- |
| **Method**  | `POST`                                                        |
| **Base URL**| `API_URL_CM` dari `resources/assets/config/config.json` (`https://cm.api.dmbapp.com`) |
| **Path**    | `/lock-card/log`                                              |
| **Header**  | `Content-Type: application/json`, `Authorization: Bearer <token_dmb>` |

Kode sumber: `src/renderer/src/services/lockCardService.js`, instance axios: `src/renderer/src/api/axiosInstanceCM.js`.

## Skema Umum Payload

```json
{
  "outlet_guid": "string",   // ID outlet (localStorage 'outletGuid')
  "user_id": "string",       // ID operator (localStorage 'userId')
  "timestamp": "string",     // ISO 8601, otomatis
  "action": "string",        // salah satu nilai Action (tabel di bawah)
  "status": "SUCCESS | FAILED",
  "card_number": "string",   // UID kartu bila ada
  "error_message": "string", // hanya saat FAILED
  "...": "field detail konteks per action, dinamis (JSON bebas)"
}
```

> **Catatan:** payload bersifat dinamis. Backend boleh menyimpan apa saja; bidang `action` adalah penanda utama, sisanya detail tambahan yang bisa berubah sesuai kebutuhan tiap aksi.

## Daftar Action

| Action                | Deskripsi                        |
| --------------------- | -------------------------------- |
| `WRITE_CARD`          | Tulis kartu akses kamar (single) |
| `WRITE_MULTI_CARD`    | Tulis kartu multi-lock           |
| `WRITE_STAFF_CARD`    | Tulis kartu staff                |
| `CANCEL_CARD`         | Cancel / tangguhkan kartu        |
| `CLEAR_CARD`          | Kosongkan kartu                  |
| `DEINIT_CARD`         | Kembalikan kartu ke blank        |
| `ADD_CLOUD_CARD`      | Daftarkan kartu ke cloud         |
| `DELETE_CLOUD_CARD`   | Hapus kartu dari cloud           |

## Contoh Payload per Action

### 1. WRITE_CARD (SUCCESS)

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

### 2. WRITE_MULTI_CARD (SUCCESS)

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

### 3. WRITE_STAFF_CARD (SUCCESS)

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

### 4. CANCEL_CARD (FAILED)

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

### 5. CLEAR_CARD (SUCCESS)

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

### 6. DEINIT_CARD (SUCCESS)

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

### 7. ADD_CLOUD_CARD (SUCCESS)

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

### 8. DELETE_CLOUD_CARD (SUCCESS)

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

## Catatan Implementasi

- Panggilan log dilakukan **fire-and-forget**: gagal kirim tidak memblokir aksi utama.
- `status` selalu `SUCCESS`/`FAILED`; `error_message` hanya diisi saat `FAILED`.
- Saat `WRITE_CARD`/`WRITE_MULTI_CARD`/`WRITE_STAFF_CARD` sukses, `card_number` diambil dari hasil baca ulang kartu.
