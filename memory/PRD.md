# CatatGrosir PRD
## Problem
Aplikasi kasir grosir offline (Expo RN → APK Android): dashboard kasir (total transaksi/omzet/laba), input barang dengan saran (paling sering dibeli di depan), barang otomatis terdaftar di Admin, antrian belanja dengan +1/hapus, qty +1, status bayar Lunas/Cicil/Belum, pop-up uang konsumen & kembalian, riwayat hari ini dengan jam, rekap, admin barang (edit/hapus/detail), piutang, backup JSON.
## Choices
Offline (AsyncStorage), harga jual+modal saat barang pertama diinput, piutang wajib nama pelanggan + cicilan, rekap hari/7 hari/bulan + terlaris, tema terang hijau. Hemat kredit.
## Architecture
Frontend-only Expo Router. src/store.tsx (context + persist), tabs: Kasir, Riwayat, Piutang, Menu; stack: rekap, admin, product/[id], backup.
## Implemented (Oct 2026)
- Semua fitur di atas; testing agent iterasi 1 lulus 100%; sheet dibuat scrollable.
## Backlog
- P1: Cetak/share struk, rekap pilih tanggal custom, stok barang
- P2: Grup piutang per pelanggan, auto-backup
