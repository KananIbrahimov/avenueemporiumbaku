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
- [x] Firebase: `avenueemporiumbaku-admin` hosting sitesi oluşturuldu
- [x] İlk yayın yapıldı (27.09.2026) — avenueemporiumbaku.web.app + avenueemporiumbaku-admin.web.app
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
- [x] iPhone-dan şəkil: Qalereya + Kamera düymələri, HEIC → JPEG çevirmə, şaquli şəkillər düz, hazırlanarkən "Yadda saxla" bağlı
- [x] Siparişler: canlı liste, durum filtresi, durum değiştirme, kaynak linki, kazanç, telefon/WhatsApp/mail
- [x] Panel açıkken yeni siparişte web bildirimi + ses + sayaç
- [x] Müşteri listesi (ad, soyad, e-posta, kayıt tarihi, sipariş sayısı/tutarı)
- [x] Yedek: tüm veriyi JSON olarak indir
- [x] "Ana ekrana ekle" (PWA)
- [x] Ayarlar tabı: məhsullar/kateqoriyalar keçidi, Instagram mətni şablonu, ehtiyat nüsxə, çıxış
- [x] Admin aşağı menyu (v1.2): Mağaza (müştərinin gördüyü ana səhifə) · Müştərilər · (+) Məhsul əlavə et · Sifarişlər (mərhələlər + kargo izləmə) · Ayarlar
- [x] Müştərilər: sifariş sayı, uğurlu, ləğv, aktiv, alış-veriş məbləği; sıralama
- [x] v1.3 Məhsul formu: brend/kateqoriya/ölçü/rəng axtarışlı siyahıdan seçilir, tapılmayan "+ yenisini əlavə et" pəncərəsi ilə əlavə olunur
- [x] v1.3 Alış qiyməti + valyuta (USD, EUR, TRY, GBP, RUB, CNY, AED) → avtomatik kurs, AZN qarşılığı; kurs əl ilə dəyişilə bilir
- [x] v1.3 Qazanc faizi ↔ satış qiyməti iki tərəfli (əl ilə yuvarlaqlaşdıranda faiz özü hesablanır); xülasədə 2 qutu: üzv olmayan / üzv sifarişindən qazanc
- [x] v1.3 Sifarişlər və kargo izləmə bir səhifədə (hər kartda kargo məlumatı)
- [x] Sifariş axını: Yeni sifariş → Qəbul edildi → Yoldadır → Çatdırıldı; istənilən mərhələdə Ləğv et, ləğvdən Bərpa et; status tarixçəsi
- [x] Sifariş izləmə: kargo şirkəti, izləmə kodu/link, təxmini tarix, müştəriyə qeyd
- [x] Instagram üçün hazırla: post (1080×1080) və story (1080×1920) şəkli + hazır mətn, telefonda paylaş menyusu
- [x] Yeni məhsul əlavə edəndə "Instagram üçün hazırlansın?" təklifi
- [x] Telefon yönümlü: aşağı menyu, məhsul və müştəri siyahıları kart şəklində, yapışqan "Yadda saxla" paneli
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
- [x] Ayarlar səhifəsi: hesab (ad/soyad dəyişmə, çıxış), dil
- [x] Sifarişlərim: addım-addım izləmə + kargo məlumatı
- [x] Aşağı menyu (5 ikon): Bəyəndiklərim · Kataloq · (ortada) Ana səhifə · Səbətim · Ayarlar
- [x] Ana səhifə: yuxarıda yapışqan axtarış (ad/brend yazanda dərhal çıxır) + kateqoriya, brend, ölçü, rəng, sıralama
- [x] Bəyəndiklərim: ♡ ilə; qonaqda cihazda, üzvdə hesabda saxlanılır
- [x] Kataloq: məhsul qrupları (kateqoriyalar) şəkil ilə + brendlər
- [x] Səbət: bir neçə məhsul, say +/−, üzv endirimi hesabı, bir düymə ilə sifariş (admin-də "Səbət #..." nişanı)
- [x] Yeni versiya yoxlaması: bildiriş + arxa fondan qayıdanda avtomatik yeniləmə (hər iki sayt)
- [x] Sürüm nömrəsi v1.1 + "Powered by Kanan Ibrahimov" — hər iki saytda Ayarların ən aşağısında
- [x] Dizayn: həmişə qaranlıq, gümüşü rənglər (SafeMoney üslubu), hər iki saytda
- [x] Telefon yönümlü: aşağı menyu (Mağaza, Sifarişlərim, Ayarlar)
- [x] Məhsul səhifəsində "Paylaş" düyməsi
- [ ] Mobil görünüm son kontrolleri

## Faz 3 — Yayın ve sonrası
- [ ] avenuebaku.az alan adını al ve bağla (+ admin.avenuebaku.az)
- [ ] Doğrulama / şifre sıfırlama mail şablonlarını Azerbaycanca yap
- [ ] 2. ve 3. dil (örn. rusça, ingilizce)
- [ ] Blaze'e geçiş kararı: fotoğraflar Storage'a, kapalıyken push bildirim, otomatik yedek, Instagram'a tam avtomatik paylaşım
- [ ] Online ödeme
