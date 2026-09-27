# AvenueBaku — İş Planı

`[x]` yapıldı · `[ ]` yapılacak

## Faz 0 — Kararlar ve kurulum
- [x] Yapı: tek repo, iki site (mağaza + admin), aynı Firebase projesi
- [x] Teknoloji: düz HTML/JS + Firebase (Auth, Firestore, Hosting) — Spark planı, ücretsiz
- [x] Dil: Azərbaycan dili (sonradan 2 dil eklenebilir altyapı hazır)
- [x] Para birimi: AZN
- [x] GitHub reposu açıldı: `KananIbrahimov/avenueemporiumbaku`
- [x] Firebase projesi açıldı: `avenueemporiumbaku`
- [x] Firebase: Email/Password girişi açıldı + admin adresi yetkili alan adlarına eklendi
- [x] Firebase: Firestore veritabanı oluşturuldu (Standard, production mode)
- [x] Firebase: Web app eklendi, `firebaseConfig` `public/ortak/ayarlar.js`'e yazıldı
- [ ] Firebase: `avenueemporiumbaku-admin` hosting sitesini oluştur
- [ ] İlk yayın (`firebase deploy`)
- [ ] Admin hesabı: kananibrahimov999@gmail.com → rol `admin`
- [ ] Test müşteri hesabı: kananibrahimov999+musteri@gmail.com
- [ ] Otomatik yayın için GitHub'a `FIREBASE_SERVICE_ACCOUNT` anahtarı

## Faz 1 — Admin paneli
- [x] Admin girişi (e-posta + şifre, kayıt yok, sadece `admin` rolü)
- [x] Kategoriler: ekle, adını değiştir, sırala, sil (dolu kategori silinmez) — "Geyim + Ayaqqabı" tek tıkla
- [x] Ürün ekle / düzenle / sil / vitrinden kaldır
- [x] Ürün bilgileri: ad, açıklama, marka, kategori, ölçüler (hazır geyim/ayakkabı ölçüleri), renkler
- [x] Gizli bilgiler (müşteri göremez): alış fiyatı, kargo, vergi, kâr %, kaynak link, not
- [x] Canlı fiyat hesabı: maya → önerilen fiyat → müşterinin gördüğü fiyat → üye fiyatı → kazanç
- [x] Satış fiyatını elle yazma seçeneği, zarar uyarısı
- [x] Ürün bazında üye indirimi %
- [x] Fotoğraflar: çoklu yükleme, otomatik küçültme, sıralama, silme (ilk fotoğraf = vitrin)
- [x] Siparişler: canlı liste, durum filtresi, durum değiştirme, kaynak linki, kazanç, telefon/WhatsApp/mail
- [x] Panel açıkken yeni siparişte web bildirimi + ses + sayaç
- [x] Müşteri listesi (ad, soyad, e-posta, kayıt tarihi, sipariş sayısı/tutarı)
- [x] Yedek: tüm veriyi JSON olarak indir
- [x] "Ana ekrana ekle" (PWA)
- [ ] Yedekten geri yükleme
- [ ] Gerçek cihazda test (abla ile)

## Faz 2 — Müşteri sitesi
- [x] Vitrin: kategori, marka, ölçü, renk filtreleri + arama + sıralama
- [x] Ürün sayfası: fotoğraf galerisi, ölçü/renk seçimi
- [x] Kayıt: ad, soyad, e-posta, şifre → Firebase doğrulama maili
- [x] Giriş, şifremi unuttum, doğrulama linkini tekrar gönder
- [x] Misafir normal fiyatı + "üyelere X ₼" görür; doğrulanmış üye indirimli fiyatı görür
- [x] Sipariş (istek) verme — sadece doğrulanmış üyeler, fiyat kuralla korunuyor
- [x] Siparişlerim: canlı durum takibi
- [x] "Ana ekrana ekle" (PWA)
- [ ] Profil sayfası (ad/soyad değiştirme)
- [ ] Mobil görünüm son kontrolleri

## Faz 3 — Yayın ve sonrası
- [ ] avenuebaku.az alan adını al ve bağla (+ admin.avenuebaku.az)
- [ ] Doğrulama / şifre sıfırlama mail şablonlarını Azerbaycanca yap
- [ ] 2. ve 3. dil (örn. rusça, ingilizce)
- [ ] Blaze'e geçiş kararı: fotoğraflar Storage'a, kapalıyken push bildirim, otomatik yedek
- [ ] Sepet (birden fazla ürün tek siparişte)
- [ ] Online ödeme
