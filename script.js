// ===== DATA AWAL =====
// Estimasi kalori per menit untuk tiap jenis olahraga (angka kasar)
var kaloriPerMenit = {
  "Lari": 10, "Jalan": 4, "Bersepeda": 7, "Gym": 6,
  "Yoga": 3, "Renang": 9, "Futsal": 9, "Badminton": 6
};

// Ambil data yang tersimpan di browser
var nama = localStorage.getItem("gerak_nama");
var riwayat = JSON.parse(localStorage.getItem("gerak_riwayat") || "[]");
var target = Number(localStorage.getItem("gerak_target")) || 150;

// Alamat API resep gratis dari web
var URL_API = "https://www.themealdb.com/api/json/v1/1/";

// ===== FUNGSI BANTU =====
function ambil(id) {
  return document.getElementById(id);
}

// Mencegah teks yang diketik berisi kode HTML
function aman(teks) {
  return String(teks).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tanggalHariIni() {
  var d = new Date();
  var bulan = String(d.getMonth() + 1).padStart(2, "0");
  var hari = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + bulan + "-" + hari;
}

// Berapa hari yang lalu sebuah tanggal (0 = hari ini)
function selisihHari(tgl) {
  var a = new Date(tanggalHariIni() + "T00:00:00");
  var b = new Date(tgl + "T00:00:00");
  return Math.round((a - b) / 86400000);
}

function tampilkanToast(pesan) {
  var toast = ambil("toast");
  toast.textContent = pesan;
  toast.classList.add("tampil");
  setTimeout(function () {
    toast.classList.remove("tampil");
  }, 2500);
}

function simpanRiwayat() {
  localStorage.setItem("gerak_riwayat", JSON.stringify(riwayat));
}

// ===== HALAMAN 1 DAN 2 =====
function tampilkanHalaman() {
  if (nama) {
    ambil("halaman-nama").classList.add("sembunyi");
    ambil("halaman-utama").classList.remove("sembunyi");
    ambil("sapaan").textContent = "Halo, " + nama + ", selamat datang";
    tampilkanSemua();
  } else {
    ambil("halaman-nama").classList.remove("sembunyi");
    ambil("halaman-utama").classList.add("sembunyi");
  }
}

ambil("form-nama").addEventListener("submit", function (e) {
  e.preventDefault();
  nama = ambil("input-nama").value.trim();
  localStorage.setItem("gerak_nama", nama);
  tampilkanHalaman();
  window.scrollTo(0, 0);
  tampilkanToast("Berhasil disimpan!");
});

ambil("ganti-nama").addEventListener("click", function () {
  localStorage.removeItem("gerak_nama");
  nama = null;
  ambil("input-nama").value = "";
  tampilkanHalaman();
});

// ===== CATAT OLAHRAGA =====
function isiPilihanJenis() {
  var pilihan = "";
  for (var jenis in kaloriPerMenit) {
    pilihan += "<option>" + jenis + "</option>";
  }
  ambil("jenis").innerHTML = pilihan;
}

ambil("form-catat").addEventListener("submit", function (e) {
  e.preventDefault();
  var jenis = ambil("jenis").value;
  var menit = Number(ambil("menit").value);

  var catatan = {
    id: Date.now(),
    jenis: jenis,
    menit: menit,
    tanggal: ambil("tanggal").value,
    fokus: Number(ambil("fokus").value),
    kalori: menit * kaloriPerMenit[jenis]
  };

  riwayat.push(catatan);
  simpanRiwayat();
  ambil("menit").value = "";
  tampilkanSemua();
  tampilkanToast("Berhasil disimpan!");
});

ambil("form-target").addEventListener("submit", function (e) {
  e.preventDefault();
  target = Number(ambil("target").value);
  localStorage.setItem("gerak_target", target);
  tampilkanSemua();
  tampilkanToast("Target berhasil disimpan!");
});

function hapusCatatan(id) {
  riwayat = riwayat.filter(function (r) {
    return r.id !== id;
  });
  simpanRiwayat();
  tampilkanSemua();
  tampilkanToast("Catatan dihapus");
}

// ===== STATISTIK =====
function adaLatihan(selisih) {
  return riwayat.some(function (r) {
    return selisihHari(r.tanggal) === selisih;
  });
}

function tampilkanStatistik() {
  var menit = 0;
  var kalori = 0;
  var fokusTotal = 0;
  var fokusJumlah = 0;

  // Hitung data 7 hari terakhir
  riwayat.forEach(function (r) {
    var s = selisihHari(r.tanggal);
    if (s >= 0 && s <= 6) {
      menit += r.menit;
      kalori += r.kalori;
      fokusTotal += r.fokus;
      fokusJumlah++;
    }
  });

  // Hitung streak (hari berturut-turut berolahraga)
  var streak = 0;
  var hariCek = 0;
  if (!adaLatihan(0)) {
    hariCek = 1; // kalau hari ini belum, mulai hitung dari kemarin
  }
  while (adaLatihan(hariCek)) {
    streak++;
    hariCek++;
  }

  var persen = Math.min(100, Math.round((menit / target) * 100));

  ambil("stat-menit").textContent = menit;
  ambil("stat-kalori").textContent = kalori;
  ambil("stat-streak").textContent = streak;
  ambil("stat-fokus").textContent = fokusJumlah > 0 ? (fokusTotal / fokusJumlah).toFixed(1) : "-";
  ambil("persen").textContent = persen + "%";
  ambil("ring").style.background = "conic-gradient(#ff6a13 " + persen * 3.6 + "deg, #d9d9d9 0deg)";
  ambil("bar-isi").style.width = persen + "%";
  ambil("teks-target").textContent = menit + " dari " + target + " menit minggu ini";
}

// ===== RIWAYAT =====
function tampilkanRiwayat() {
  var urut = riwayat.slice().sort(function (a, b) {
    return b.tanggal.localeCompare(a.tanggal) || b.id - a.id;
  });

  if (urut.length === 0) {
    ambil("daftar-riwayat").innerHTML = "<p class='kecil'>Belum ada catatan. Isi form di atas untuk mulai.</p>";
    return;
  }

  var html = "";
  urut.forEach(function (r) {
    html += "<div class='item-riwayat'>";
    html += "<div><strong>" + aman(r.jenis) + " " + r.menit + " menit</strong>";
    html += "<small>" + r.tanggal + " · " + r.kalori + " kkal · fokus " + r.fokus + "/5</small></div>";
    html += "<button type='button' onclick='hapusCatatan(" + r.id + ")'>Hapus</button>";
    html += "</div>";
  });
  ambil("daftar-riwayat").innerHTML = html;
}

function tampilkanSemua() {
  tampilkanStatistik();
  tampilkanRiwayat();
}

// ===== RESEP DARI WEB =====
function cariResep(kata) {
  var hasil = ambil("hasil-resep");
  hasil.innerHTML = "<p class='kecil'>Mencari resep...</p>";

  fetch(URL_API + "search.php?s=" + encodeURIComponent(kata))
    .then(function (respon) {
      return respon.json();
    })
    .then(function (data) {
      if (!data.meals) {
        hasil.innerHTML = "<p class='kecil'>Resep tidak ditemukan. Coba kata lain dalam bahasa Inggris.</p>";
        return;
      }
      var html = "";
      // Tampilkan maksimal 8 resep
      data.meals.slice(0, 8).forEach(function (meal) {
        html += "<div class='resep-kartu'>";
        html += "<img src='" + meal.strMealThumb + "/preview' alt='" + aman(meal.strMeal) + "'>";
        html += "<div><h3>" + aman(meal.strMeal) + "</h3>";
        html += "<small>" + aman(meal.strCategory) + " · " + aman(meal.strArea) + "</small><br>";
        html += "<button type='button' class='tombol' onclick='lihatResep(" + meal.idMeal + ")'>Lihat resep</button>";
        html += "</div></div>";
      });
      hasil.innerHTML = html;
    })
    .catch(function () {
      hasil.innerHTML = "<p class='kecil'>Gagal mengambil data. Cek koneksi internetmu lalu coba lagi.</p>";
    });
}

function lihatResep(id) {
  fetch(URL_API + "lookup.php?i=" + id)
    .then(function (respon) {
      return respon.json();
    })
    .then(function (data) {
      var meal = data.meals[0];

      // Kumpulkan bahan (API menyimpan sampai 20 bahan)
      var bahan = "";
      for (var i = 1; i <= 20; i++) {
        var namaBahan = meal["strIngredient" + i];
        if (namaBahan) {
          bahan += "<li>" + aman(meal["strMeasure" + i] || "") + " " + aman(namaBahan) + "</li>";
        }
      }

      var html = "<img src='" + meal.strMealThumb + "' alt='" + aman(meal.strMeal) + "'>";
      html += "<h2>" + aman(meal.strMeal) + "</h2>";
      html += "<h3>Bahan</h3><ul>" + bahan + "</ul>";
      html += "<h3>Cara membuat</h3><p class='langkah'>" + aman(meal.strInstructions) + "</p>";
      if (meal.strYoutube) {
        html += "<p><a href='" + meal.strYoutube + "' target='_blank' rel='noopener'>Tonton video resep →</a></p>";
      }
      ambil("isi-dialog").innerHTML = html;
      ambil("dialog-resep").showModal();
    })
    .catch(function () {
      tampilkanToast("Gagal memuat resep");
    });
}

function cariDariChip(kata) {
  ambil("kata-resep").value = kata;
  cariResep(kata);
}

ambil("form-resep").addEventListener("submit", function (e) {
  e.preventDefault();
  cariResep(ambil("kata-resep").value.trim());
});

// ===== EFEK FADE SAAT SCROLL =====
// Elemen ber-class "muncul" awalnya transparan. Saat masuk layar,
// kita tambahkan class "terlihat" supaya muncul perlahan (lihat style.css).
function aktifkanFadeScroll() {
  var elemen = document.querySelectorAll(".muncul");

  // Kalau browser terlalu lama, tampilkan semuanya saja
  if (!("IntersectionObserver" in window)) {
    elemen.forEach(function (e) {
      e.classList.add("terlihat");
    });
    return;
  }

  var pengamat = new IntersectionObserver(function (daftar) {
    daftar.forEach(function (item) {
      if (item.isIntersecting) {
        item.target.classList.add("terlihat"); // masuk layar: muncul
      } else {
        item.target.classList.remove("terlihat"); // keluar layar: reset, siap muncul lagi
      }
    });
  }, { threshold: 0.15 });

  elemen.forEach(function (e) {
    pengamat.observe(e);
  });
}

// ===== MULAI =====
isiPilihanJenis();
ambil("tanggal").value = tanggalHariIni();
ambil("target").value = target;
tampilkanHalaman();
cariResep("chicken"); // tampilkan resep awal
aktifkanFadeScroll();