// =============================================
// NICOBOT - Backend Server SMK ICB Cinta Niaga
// Template-Based Chatbot (tanpa AI API)
// =============================================

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// =============================================
// PENYIMPANAN SESI
// =============================================
const userSessions = {};
const NOMOR_ADMIN = '081221049998';

// =============================================
// DATABASE TEMPLATE JAWABAN
// Setiap intent punya: keywords[] dan reply
// =============================================
const templates = [

  // ---- SALAM / SAPAAN ----
  {
    id: 'salam',
    keywords: ['halo', 'hai', 'hi', 'hello', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'hei', 'hey'],
    reply: `Halo! 👋 Selamat datang di NicoBot, asisten resmi *SMK ICB Cinta Niaga*.\n\nAda yang bisa saya bantu? Silakan pilih topik di bawah atau ketik pertanyaanmu langsung ya! 😊`
  },

  // ---- TERIMA KASIH ----
  {
    id: 'terimakasih',
    keywords: ['terima kasih', 'makasih', 'thanks', 'thank you', 'thx', 'tq', 'tengkyu'],
    reply: `Sama-sama! 😊 Senang bisa membantu. Kalau ada pertanyaan lain seputar SMK ICB Cinta Niaga, jangan ragu untuk bertanya ya!`
  },

  // ---- INFO UMUM / PROFIL SEKOLAH ----
  {
    id: 'info_umum',
    keywords: ['info', 'informasi', 'profil', 'tentang', 'sekolah', 'smk', 'icb', 'cinta niaga', 'kepala sekolah', 'alamat', 'lokasi', 'dimana', 'letak', 'email', 'kontak', 'telepon', 'phone', 'nomor', 'hubungi', 'contact', 'whatsapp', 'wa'],
    reply: `📋 *Profil SMK ICB Cinta Niaga*\n\n🏫 *Nama:* SMK ICB Cinta Niaga (Insan Cinta Bangsa)\n👨‍💼 *Kepala Sekolah:* Galih Arifandi, S.Pd.\n📍 *Alamat:* Jl. Pahlawan No.19B1, Cihaur Geulis, Kec. Cibeunying Kaler, Kota Bandung, Jawa Barat 40122\n📞 *Telepon/WA:* 081221049998\n📧 *Email:* smkicbcintaniaga19b@gmail.com\n\nUntuk kunjungan langsung, silakan lihat jam operasional kami ya! ⏰`
  },

  // ---- JAM OPERASIONAL ----
  {
    id: 'jam_operasional',
    keywords: ['jam', 'waktu', 'operasional', 'buka', 'tutup', 'masuk', 'pulang', 'jadwal', 'kunjungan', 'tamu'],
    reply: `⏰ *Jam Operasional SMK ICB Cinta Niaga*\n\n👨‍🎓 *Jam Sekolah Siswa:*\n• Senin – Selasa : 06.30 – 14.20 WIB\n• Rabu – Kamis   : 06.30 – 15.20 WIB\n• Jumat           : 06.30 – 11.00 WIB\n\n🏢 *Jam Kunjungan Tamu:*\n• Senin – Kamis : 08.00 – 15.00 WIB\n• Jumat         : 08.00 – 11.00 WIB`
  },

  // ---- VISI MISI ----
  {
    id: 'visi_misi',
    keywords: ['visi', 'misi', 'tujuan', 'goal', 'visi misi'],
    reply: `🎯 *Visi & Misi SMK ICB Cinta Niaga*\n\n🌟 *Visi:*\nMenjadi satuan pendidikan vokasi yang mampu membentuk generasi muda yang produktif dan berkarakter (cageur, bageur, bener, pinter, singer), serta berdaya saing global di sektor industri pada tahun 2030.\n\n📌 *Misi:*\n1. Menghasilkan lulusan yang berkarakter dan berdaya saing global\n2. Mendorong kreativitas dan kolaborasi dalam pembelajaran bermakna\n3. Mengembangkan kompetensi siswa melalui pemanfaatan digital (Industri 4.0)\n4. Memberdayakan karakter siswa agar siap kerja, kuliah, dan wirausaha\n5. Menjalin kemitraan dengan seluruh ekosistem pendidikan untuk penjaminan mutu`
  },

  // ---- JURUSAN ----
  {
    id: 'jurusan',
    keywords: ['jurusan', 'program', 'studi', 'kejuruan', 'mplb', 'akuntansi', 'ak', 'rpl', 'pplg', 'perangkat lunak', 'programmer', 'developer', 'bisnis ritel', 'br', 'pemasaran', 'marketing', 'manajemen perkantoran', 'pilihan', 'jurusan apa'],
    reply: `📚 *Jurusan di SMK ICB Cinta Niaga*\n_(Kapasitas: maks. 30 siswa/kelas)_\n\n1️⃣ *MPLB – Manajemen Perkantoran & Layanan Bisnis*\n   Area kerja luas di berbagai instansi, bisa jadi Event Organizer\n\n2️⃣ *AK – Akuntansi dan Keuangan Lembaga*\n   Fokus keuangan, peluang kerja di Bank atau kelola keuangan UMKM\n\n3️⃣ *PPLG/RPL – Pengembangan Perangkat Lunak & GIM*\n   Fokus teknologi & aplikasi, peluang jadi developer / game developer\n\n4️⃣ *BR – Bisnis Ritel / Pemasaran*\n   Fokus bisnis digital & marketing online, bisa buka toko sendiri\n\nMau tahu lebih detail salah satu jurusan? Tanyakan saja! 😊`
  },

  // ---- PENDAFTARAN / PPDB ----
  {
    id: 'pendaftaran',
    keywords: ['daftar', 'pendaftaran', 'ppdb', 'cara daftar', 'syarat', 'dokumen', 'registrasi', 'masuk', 'penerimaan', 'gelombang', 'online', 'offline', 'formulir'],
    reply: `📝 *Info Pendaftaran (PPDB) SMK ICB Cinta Niaga*\n\n📅 *Jadwal:* Periode utama Mei – Juni (gelombang awal sudah dibuka lebih awal)\n\n🖥️ *Cara Mendaftar:*\n• *Online:* Melalui link pendaftaran, scan barcode, atau website resmi\n• *Offline:* Datang langsung ke sekolah, panitia siap membantu\n\n📄 *Dokumen yang Diperlukan:*\n1. Fotokopi Ijazah / SKL (2 lembar)\n2. Fotokopi KTP Orang Tua (2 lembar)\n3. Fotokopi Kartu Keluarga (1 lembar)\n4. Surat Keterangan Berkelakuan Baik dari Kepsek SMP asal\n5. Stofmap Biola warna kuning (2 buah)\n6. Kaos oblong warna putih\n\nAda pertanyaan lain seputar pendaftaran? 😊`
  },

  // ---- BIAYA ----
  {
    id: 'biaya',
    keywords: ['biaya', 'spp', 'uang', 'bayar', 'harga', 'tarif', 'iuran', 'dsp', 'dana sumbangan', 'berapa', 'cost', 'beasiswa', 'diskon', 'gratis', 'potongan', 'cicil'],
    reply: `💰 *Biaya Sekolah SMK ICB Cinta Niaga (Kelas 10)*\n\n| Komponen | Biaya |\n|---|---|\n| SPP per bulan | Rp 375.000 |\n| Dana Sumbangan (DSP) | Rp 3.000.000 |\n| Uang Praktik & Ujian /tahun | Rp 1.550.000 |\n| Biaya Personal Siswa* | Rp 1.200.000 |\n| **TOTAL AWAL** | **Rp 6.325.000** |\n\n*_*Biaya personal meliputi: seragam olahraga, jurusan, batik, jas almamater, kartu pelajar, asuransi 3 tahun, kunjungan industri, air minum 1 tahun_\n\n🎁 *Program Diskon / Beasiswa:*\n• Diskon DSP 30% → daftar 1 Jan – 31 Mar 2026\n• Diskon DSP 20% → daftar 1 Apr – 30 Jun 2026\n• Diskon DSP 30% → khusus anak Guru, TNI, atau POLRI\n• Diskon tambahan 5% → jika biaya dibayar lunas sekaligus\n• Gratis SPP 1 bulan → jika SPP dibayar penuh 1 tahun`
  },

  // ---- FASILITAS ----
  {
    id: 'fasilitas',
    keywords: ['fasilitas', 'sarana', 'prasarana', 'lab', 'laboratorium', 'gor', 'olahraga', 'gedung', 'ruang', 'mart', 'niaga mart', 'seni'],
    reply: `🏫 *Fasilitas SMK ICB Cinta Niaga*\n\n• 🔬 Laboratorium untuk setiap jurusan\n• 🎨 Ruang Seni\n• 🏀 Gedung Olahraga (GOR)\n• 🛒 Niaga Mart\n\nFasilitas dirancang untuk mendukung pembelajaran vokasi yang praktis dan siap industri! 💪`
  },

  // ---- EKSTRAKURIKULER ----
  {
    id: 'ekskul',
    keywords: ['ekskul', 'ekstrakurikuler', 'kegiatan', 'organisasi', 'osis', 'pmr', 'paskibra', 'boxing', 'rohis', 'pramuka', 'basket', 'fotografi', 'angklung', 'english club', 'paduan suara', 'japanese', 'sispala', 'club', 'komunitas'],
    reply: `🎓 *Ekstrakurikuler SMK ICB Cinta Niaga*\n\nAda banyak pilihan ekskul seru! 🎉\n\n⚕️ PMR &nbsp;&nbsp; 🇮🇩 Paskibra &nbsp;&nbsp; 🥊 Boxing\n🕌 Rohis &nbsp;&nbsp; 💃 Serinca &nbsp;&nbsp; 🎭 Danger\n📷 Fotografi &nbsp;&nbsp; 🎵 Angklung &nbsp;&nbsp; 🏀 Basket\n🏕️ Pramuka &nbsp;&nbsp; 🧗 Sispala\n🇬🇧 English Club &nbsp;&nbsp; 🎤 Paduan Suara\n🇯🇵 Japanese Club &nbsp;&nbsp; 👥 OSIS\n\nMinat yang beragam bisa tersalurkan di sini! 😊`
  },

  // ---- PKL / MAGANG ----
  {
    id: 'pkl',
    keywords: ['pkl', 'magang', 'praktik kerja', 'prakerin', 'industri', 'kerja lapangan', 'tempat magang', 'yogya', 'griya', 'hotel'],
    reply: `🏢 *Info PKL / Magang SMK ICB Cinta Niaga*\n\n• 🛒 Jaringan PKL resmi: **Toserba Yogya/Griya** (untuk semua jurusan) dan **perhotelan**\n• ✅ Siswa juga *boleh mencari tempat PKL sendiri* secara mandiri\n\nSMK ICB Cinta Niaga memastikan setiap siswa mendapat pengalaman kerja nyata sebelum lulus! 💼`
  },

  // ---- PRESTASI & ALUMNI ----
  {
    id: 'prestasi',
    keywords: ['prestasi', 'alumni', 'lulusan', 'kerja', 'karir', 'sukses', 'pencapaian', 'nicholas', 'taufiq', 'devops', 'berprestasi'],
    reply: `🏆 *Prestasi & Alumni SMK ICB Cinta Niaga*\n\n✅ Sekolah menjamin lulusannya **siap kerja** — tidak ada siswa yang menganggur setelah lulus!\n🎯 Aktif mengadakan berbagai acara dan workshop persiapan karir\n\n👨‍💻 *Alumni Berprestasi:*\n\n• **Nicholas Alvi Saputra**\n  Alumni RPL angkatan 2019\n  → DevOps Engineer di PT. Swamedia\n\n• **Dr. Taufiq Hifayat, S.Sos., M.M.**\n  → Wakil Ketua 1 Bidang Akademik & Kemahasiswaan\n  di STIE Pariwisata Yapari Bandung`
  },

  // ---- TIDAK DIKENALI ----
  {
    id: 'fallback',
    keywords: [], // fallback tidak pakai keywords, dipanggil manual
    reply: `Hmm, maaf saya belum bisa menjawab pertanyaan itu. 🙏\n\nSilakan pilih topik yang tersedia, atau hubungi admin kami langsung:\n📞 *WhatsApp:* 081221049998\n📧 *Email:* smkicbcintaniaga19b@gmail.com`
  }
];

// =============================================
// ENGINE: Cocokkan pesan ke intent
// Pakai fuzzy matching sederhana (includes)
// =============================================
function matchIntent(message) {
  const lower = message.toLowerCase().trim();

  // Coba cocokkan ke setiap template
  for (const tmpl of templates) {
    if (tmpl.id === 'fallback') continue;
    for (const kw of tmpl.keywords) {
      if (lower.includes(kw)) {
        return tmpl;
      }
    }
  }

  // Tidak cocok → fallback
  return templates.find(t => t.id === 'fallback');
}

// =============================================
// ENDPOINT: Quick Replies
// =============================================
app.get('/api/quick-replies', (req, res) => {
  const quickReplies = [
    { id: 1, label: '📚 Jurusan yang Tersedia',  message: 'Jurusan apa saja yang ada?' },
    { id: 2, label: '📝 Info Pendaftaran',        message: 'Bagaimana cara mendaftar?' },
    { id: 3, label: '💰 Biaya Sekolah',           message: 'Berapa biaya sekolahnya?' },
    { id: 4, label: '🎓 Fasilitas & Ekskul',      message: 'Apa saja fasilitas dan ekskul?' },
    { id: 5, label: '⏰ Jam Operasional',          message: 'Jam berapa sekolah buka?' },
    { id: 6, label: '🏆 Prestasi & Alumni',        message: 'Prestasi dan alumni sekolah' },
    { id: 7, label: '📍 Lokasi & Kontak',          message: 'Di mana lokasi sekolah dan kontaknya?' },
    { id: 8, label: '🎯 Visi & Misi',              message: 'Apa visi dan misi sekolah?' },
  ];
  res.json(quickReplies);
});

// =============================================
// ENDPOINT: Chat (Template Engine)
// =============================================
app.post('/api/chat', (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
  }
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID tidak ditemukan' });
  }

  // Inisialisasi sesi jika belum ada
  if (!userSessions[sessionId]) {
    userSessions[sessionId] = { count: 0 };
  }

  // Cocokkan pesan ke intent
  const matched = matchIntent(message);

  res.json({
    reply: matched.reply,
    intent: matched.id,
    timestamp: new Date().toISOString()
  });
});

// =============================================
// ENDPOINT: Reset Sesi
// =============================================
app.post('/api/reset-session', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && userSessions[sessionId]) {
    delete userSessions[sessionId];
  }
  res.json({ message: 'Sesi berhasil direset' });
});

// =============================================
// ENDPOINT: Test
// =============================================
app.get('/', (req, res) => {
  res.send('NicoBot Template Server berjalan! 🚀');
});

app.listen(PORT, () => {
  console.log(`NicoBot Server berjalan di http://localhost:${PORT}`);
});