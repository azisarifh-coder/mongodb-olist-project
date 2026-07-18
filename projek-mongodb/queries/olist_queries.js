// ============================================================
//  FILE QUERY MongoDB — Olist Brazilian E-Commerce
//  Database  : olist_marketplace
//  Source    : https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
//  Collections: customers, products, orders, reviews, sellers
// ============================================================

use("olist_marketplace")

// ─────────────────────────────────────────────────────────────
//  IMPORT COMMAND (jalankan di terminal sebelum query)
// ─────────────────────────────────────────────────────────────
// mongoimport --db olist_marketplace --collection customers --file collection_customers.json --jsonArray
// mongoimport --db olist_marketplace --collection products  --file collection_products.json  --jsonArray
// mongoimport --db olist_marketplace --collection orders    --file collection_orders.json    --jsonArray
// mongoimport --db olist_marketplace --collection reviews   --file collection_reviews.json   --jsonArray
// mongoimport --db olist_marketplace --collection sellers   --file collection_sellers.json   --jsonArray

// ─────────────────────────────────────────────────────────────
//  BAGIAN A : QUERY DASAR — Eksplorasi Data
// ─────────────────────────────────────────────────────────────

// A1. Lihat sample data customers
db.customers.find().limit(5)

// A2. Lihat sample data products
db.products.find().limit(5)

// A3. Lihat sample orders (dengan embedded payment & items)
db.orders.find().limit(3)

// A4. Hitung total dokumen setiap collection
db.customers.countDocuments()
db.products.countDocuments()
db.orders.countDocuments()
db.reviews.countDocuments()
db.sellers.countDocuments()

// A5. Tampilkan order dengan status tertentu
db.orders.find({ status: "delivered" }).limit(10)

// A6. Tampilkan review dengan score 5
db.reviews.find({ score: 5 }, { order_id: 1, score: 1, message: 1 }).limit(10)

// ─────────────────────────────────────────────────────────────
//  BAGIAN B : INSIGHT 1 — Kategori Produk Paling Populer
// ─────────────────────────────────────────────────────────────

// B1. Jumlah produk per kategori (English)
db.products.aggregate([
  {
    $group: {
      _id: "$category_en",
      jumlah_produk: { $sum: 1 },
      avg_weight_g:  { $avg: "$weight_g" },
      avg_photos:    { $avg: "$photos_qty" }
    }
  },
  { $sort: { jumlah_produk: -1 } },
  {
    $project: {
      kategori: "$_id",
      jumlah_produk: 1,
      avg_weight_g:  { $round: ["$avg_weight_g", 0] },
      avg_photos:    { $round: ["$avg_photos", 1] }
    }
  }
])

// B2. Produk terberat (top 5) — indikasi produk fisik besar
db.products.find(
  { weight_g: { $gt: 0 } },
  { category_en: 1, weight_g: 1, height_cm: 1, width_cm: 1 }
).sort({ weight_g: -1 }).limit(5)

// B3. Kategori dengan foto produk terbanyak (kualitas listing)
db.products.aggregate([
  { $match: { photos_qty: { $gt: 0 } } },
  {
    $group: {
      _id: "$category_en",
      avg_photos: { $avg: "$photos_qty" },
      max_photos: { $max: "$photos_qty" }
    }
  },
  { $sort: { avg_photos: -1 } },
  { $limit: 10 }
])

// ─────────────────────────────────────────────────────────────
//  BAGIAN C : INSIGHT 2 — Metode Pembayaran & Nilai Transaksi
// ─────────────────────────────────────────────────────────────

// C1. Distribusi metode pembayaran
db.orders.aggregate([
  { $match: { payment: { $ne: null } } },
  { $unwind: "$payment.types" },
  {
    $group: {
      _id: "$payment.types",
      jumlah_transaksi: { $sum: 1 },
      total_nilai: { $sum: "$payment.total_value" },
      rata_nilai:  { $avg: "$payment.total_value" }
    }
  },
  { $sort: { jumlah_transaksi: -1 } },
  {
    $project: {
      metode: "$_id",
      jumlah_transaksi: 1,
      total_nilai:  { $round: ["$total_nilai", 2] },
      rata_nilai:   { $round: ["$rata_nilai", 2] }
    }
  }
])

// C2. Distribusi cicilan (installments) pembayaran
db.orders.aggregate([
  { $match: { "payment.installments": { $gt: 0 } } },
  {
    $group: {
      _id: "$payment.installments",
      jumlah_order: { $sum: 1 },
      rata_nilai:   { $avg: "$payment.total_value" }
    }
  },
  { $sort: { _id: 1 } },
  {
    $project: {
      cicilan: "$_id",
      jumlah_order: 1,
      rata_nilai: { $round: ["$rata_nilai", 2] }
    }
  }
])

// C3. Order dengan nilai pembayaran tertinggi (Top 10)
db.orders.aggregate([
  { $match: { payment: { $ne: null } } },
  { $sort: { "payment.total_value": -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 1,
      customer_id: 1,
      status: 1,
      payment_value: "$payment.total_value",
      payment_type: "$payment.types",
      item_count: "$items.count"
    }
  }
])

// ─────────────────────────────────────────────────────────────
//  BAGIAN D : INSIGHT 3 — Distribusi Wilayah Customer & Seller
// ─────────────────────────────────────────────────────────────

// D1. Customer terbanyak per State (negara bagian Brazil)
db.customers.aggregate([
  {
    $group: {
      _id: "$state",
      jumlah_customer: { $sum: 1 },
      kota_unik: { $addToSet: "$city" }
    }
  },
  {
    $project: {
      state: "$_id",
      jumlah_customer: 1,
      jumlah_kota: { $size: "$kota_unik" }
    }
  },
  { $sort: { jumlah_customer: -1 } }
])

// D2. Seller terbanyak per State
db.sellers.aggregate([
  {
    $group: {
      _id: "$state",
      jumlah_seller: { $sum: 1 },
      kota_unik: { $addToSet: "$city" }
    }
  },
  {
    $project: {
      state: "$_id",
      jumlah_seller: 1,
      jumlah_kota: { $size: "$kota_unik" }
    }
  },
  { $sort: { jumlah_seller: -1 } }
])

// D3. Customer per kota (top 10 kota)
db.customers.aggregate([
  {
    $group: {
      _id: { city: "$city", state: "$state" },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 },
  {
    $project: {
      kota: "$_id.city",
      state: "$_id.state",
      jumlah_customer: "$count"
    }
  }
])

// ─────────────────────────────────────────────────────────────
//  BAGIAN E : INSIGHT 4 — Analisis Review & Kepuasan Pelanggan
// ─────────────────────────────────────────────────────────────

// E1. Distribusi skor review
db.reviews.aggregate([
  {
    $group: {
      _id: "$score",
      jumlah: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } },
  {
    $project: {
      skor: "$_id",
      jumlah: 1,
      label: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 1] }, then: "⭐ Sangat Buruk" },
            { case: { $eq: ["$_id", 2] }, then: "⭐⭐ Buruk" },
            { case: { $eq: ["$_id", 3] }, then: "⭐⭐⭐ Cukup" },
            { case: { $eq: ["$_id", 4] }, then: "⭐⭐⭐⭐ Baik" },
            { case: { $eq: ["$_id", 5] }, then: "⭐⭐⭐⭐⭐ Sangat Baik" }
          ],
          default: "Unknown"
        }
      }
    }
  }
])

// E2. Rata-rata skor review keseluruhan
db.reviews.aggregate([
  {
    $group: {
      _id: null,
      rata_skor: { $avg: "$score" },
      total_review: { $sum: 1 },
      review_dengan_pesan: {
        $sum: { $cond: [{ $ne: ["$message", null] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      _id: 0,
      rata_skor: { $round: ["$rata_skor", 2] },
      total_review: 1,
      review_dengan_pesan: 1,
      pct_dengan_pesan: {
        $round: [
          { $multiply: [{ $divide: ["$review_dengan_pesan", "$total_review"] }, 100] },
          1
        ]
      }
    }
  }
])

// E3. Review negatif (score 1-2) dengan pesan
db.reviews.find(
  { score: { $lte: 2 }, message: { $ne: null } },
  { score: 1, title: 1, message: 1, created_at: 1 }
).sort({ score: 1 })

// ─────────────────────────────────────────────────────────────
//  BAGIAN F : INSIGHT 5 — Status Order & Waktu Pengiriman
// ─────────────────────────────────────────────────────────────

// F1. Distribusi status order
db.orders.aggregate([
  {
    $group: {
      _id: "$status",
      jumlah: { $sum: 1 },
      total_nilai: { $sum: "$payment.total_value" }
    }
  },
  {
    $project: {
      status: "$_id",
      jumlah: 1,
      total_nilai: { $round: ["$total_nilai", 2] },
      persentase: {
        $round: [
          { $multiply: [{ $divide: ["$jumlah", { $literal: 100 }] }, 100] },
          1
        ]
      }
    }
  },
  { $sort: { jumlah: -1 } }
])

// F2. Order dengan jumlah item terbanyak (top 10)
db.orders.aggregate([
  { $match: { "items.count": { $gt: 0 } } },
  { $sort: { "items.count": -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 1,
      status: 1,
      item_count: "$items.count",
      total_price: "$items.total_price",
      total_freight: "$items.total_freight",
      payment_value: "$payment.total_value"
    }
  }
])

// F3. Rata-rata nilai order dan rata-rata jumlah item
db.orders.aggregate([
  { $match: { payment: { $ne: null }, items: { $ne: null } } },
  {
    $group: {
      _id: null,
      avg_payment: { $avg: "$payment.total_value" },
      avg_items: { $avg: "$items.count" },
      avg_freight: { $avg: "$items.total_freight" },
      total_revenue: { $sum: "$payment.total_value" }
    }
  },
  {
    $project: {
      _id: 0,
      avg_payment: { $round: ["$avg_payment", 2] },
      avg_items: { $round: ["$avg_items", 2] },
      avg_freight: { $round: ["$avg_freight", 2] },
      total_revenue: { $round: ["$total_revenue", 2] }
    }
  }
])

// ─────────────────────────────────────────────────────────────
//  BAGIAN G : QUERY LANJUTAN — $lookup (JOIN antar Collection)
// ─────────────────────────────────────────────────────────────

// G1. Join orders dengan customers (lihat asal pembeli)
db.orders.aggregate([
  { $limit: 5 },
  {
    $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer_info"
    }
  },
  { $unwind: { path: "$customer_info", preserveNullAndEmpty: true } },
  {
    $project: {
      _id: 1,
      status: 1,
      payment_value: "$payment.total_value",
      customer_city:  "$customer_info.city",
      customer_state: "$customer_info.state"
    }
  }
])

// G2. Review dengan info order terkait
db.reviews.aggregate([
  { $limit: 5 },
  {
    $lookup: {
      from: "orders",
      localField: "order_id",
      foreignField: "_id",
      as: "order_data"
    }
  },
  { $unwind: { path: "$order_data", preserveNullAndEmpty: true } },
  {
    $project: {
      review_id: "$_id",
      score: 1,
      message: 1,
      order_status: "$order_data.status",
      payment_value: "$order_data.payment.total_value"
    }
  }
])

// G3. Produk dengan deskripsi terpanjang (proxy kualitas listing)
db.products.find(
  { description_length: { $gt: 0 } },
  { category_en: 1, description_length: 1, photos_qty: 1, weight_g: 1 }
).sort({ description_length: -1 }).limit(10)
