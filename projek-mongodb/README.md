# Analisis Database NoSQL MongoDB — Olist Marketplace

## Deskripsi
Project perancangan dan analisis database NoSQL menggunakan MongoDB
dengan studi kasus platform marketplace menggunakan dataset publik
Olist Brazilian E-Commerce dari Kaggle.

## Dataset
- Sumber: [Olist Brazilian E-Commerce — Kaggle](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
- 5 Collection, masing-masing 100 dokumen (total 500 dokumen)

## Struktur Database
| Collection | Dokumen | Keterangan |
|-----------|---------|-----------|
| customers | 100 | Data pelanggan |
| products  | 100 | Katalog produk |
| orders    | 100 | Transaksi pembelian |
| reviews   | 100 | Ulasan pelanggan |
| sellers   | 100 | Data penjual |

## Insight yang Ditemukan
1. Kategori computers_accessories & housewares terpopuler (11 produk)
2. Credit card dominan 82% transaksi (R$16.076)
3. São Paulo (SP) pusat e-commerce — 37% customer
4. Rating rata-rata 4.18/5 — 82% review positif
5. 98% order berhasil delivered

## Tech Stack
- MongoDB 8.2
- MongoDB Compass
- Python (konversi CSV ke JSON)
- JavaScript (query)
- HTML + Chart.js (dashboard visualisasi)

## Cara Pakai
1. Import dataset ke MongoDB
2. Jalankan query dari folder queries/
3. Buka dashboard_olist.html di browser

## Tim
Kelompok 7 — Program Studi Informatika
Universitas Bina Sarana Informatika 2026