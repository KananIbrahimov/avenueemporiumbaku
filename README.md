# AvenueBaku

Yurt dışı sitelerden (Avrupa, Amerika, Çin, İspanya, Trendyol…) seçilen ürünlerin satıldığı online mağaza.

| Site | Adres (şimdilik) | Alan adı alınınca |
|---|---|---|
| Müşteri mağazası | `avenueemporiumbaku.web.app` | `avenuebaku.az` |
| Admin paneli | `avenueemporiumbaku-admin.web.app` | `admin.avenuebaku.az` |

**Teknoloji:** düz HTML + JavaScript (kurulum/derleme yok) · Firebase Authentication · Firestore · Firebase Hosting — hepsi ücretsiz **Spark** planında.

İş planı ve ilerleme: [IS_PLANI.md](IS_PLANI.md)

---

## Klasör yapısı

```
public/                 ← iki site de bu klasörden yayınlanır
├── index.html          vitrin (filtreler: kategori, marka, ölçü, renk)
├── urun.html           ürün sayfası + sipariş
├── kayit.html / giris.html / sifre.html
├── siparislerim.html
├── js/                 mağaza kodları
├── admin/              admin paneli (admin sitesinin açılış sayfası)
│   ├── index.html      admin girişi (kayıt yok)
│   ├── panel.html      siparişler · ürünler · kategoriler · müşteriler · yedek
│   └── js/
└── ortak/              iki tarafın ortak kodu
    ├── ayarlar.js      ← Firebase bilgileri buraya
    ├── firebase.js     bağlantı (localhost'ta otomatik emulator)
    ├── fiyat.js        fiyat formülü
    ├── i18n.js         çok dil altyapısı
    ├── dil/az.js       Azərbaycan dili metinleri
    ├── foto.js         fotoğraf küçültme
    └── stil.css
firestore.rules         güvenlik kuralları (gizli bilgileri korur)
firebase.json           iki site tanımı
```

## Veritabanı (Firestore)

| Koleksiyon | Kim okur | İçerik |
|---|---|---|
| `kullanicilar` | kişi kendisi + admin | ad, soyad, e-posta, rol (`musteri` / `admin`) |
| `kategoriler` | herkes | Geyim, Ayaqqabı… (admin panelden eklenir) |
| `urunler` | herkes (sadece aktif olanlar) | ad, açıklama, marka, ölçüler, renkler, satış fiyatı, üye indirimi, kapak fotoğrafı |
| `urunDetay` | **sadece admin** | alış fiyatı, kargo, vergi, kâr %, **kaynak link**, not |
| `urunFoto` | herkes | ürün fotoğrafları (sıkıştırılmış) |
| `siparisler` | müşteri kendi siparişini + admin | ürün, ölçü, renk, adet, telefon, durum |
| `ayarlar` | sadece admin | Instagram metin şablonu |

**Fiyat formülü:** maya = alış + kargo + vergi → satış = maya × (1 + kâr %) (istenirse elle yazılır) → üye fiyatı = satış × (1 − indirim %).
Müşteri sipariş verirken fiyatı değiştiremez; güvenlik kuralı fiyatın ürünün üye fiyatıyla aynı olduğunu kontrol eder.

## Nasıl çalışır

- **Müşteri:** ad, soyad, e-posta ve şifreyle kayıt olur → Firebase doğrulama maili gönderir → linke tıklayınca üye olur, indirimli fiyatları görür ve sipariş (istek) verebilir.
- **Abla (admin):** `admin/` adresinden girer. Ürün ekler, fiyatı hesaplar, siparişleri görür ve kaynak linke tıklayıp ürünü bulur, durum değiştirir.
- **Bildirim:** admin paneli açıkken yeni sipariş gelince bildirim + ses.
- **Yedek:** Admin → Ayarlar → Ehtiyat nüsxə → tüm veriler tek JSON dosyası.
- **Müşteri menüsü:** Bəyəndiklərim · Kataloq · Ana səhifə · Səbətim · Ayarlar. Sepetten tek seferde sipariş verilir.
- **Yeni sürüm:** her `firebase deploy` öncesi `skript/versiya.js` otomatik çalışır ve `public/versiya.json` güncellenir. Açık sayfalarda "Yeni versiya hazırdır — Yenilə" bildirimi çıkar; uygulama arka plandan dönünce kendisi yenilenir.
- **Telefonda uygulama:** her iki site "Ana ekrana ekle" ile uygulama gibi açılır; telefonda aşağıda menü çıkar.
- **Dizayn:** her iki site her zaman koyu (dark) temada, gümüş (silver) renklerle açılır.
- **Sipariş akışı:** Yeni sifariş → Qəbul edildi → Yoldadır → Çatdırıldı; her aşamada Ləğv et. Admin → Sifariş izləmə bölümünden kargo firması, takip kodu ve tahmini tarih girilir; müşteri "Sifarişlərim"de adım adım görür.
- **Instagram:** Admin → Məhsullar → "Instagram" → post veya story görseli + hazır metin. Telefonda "Paylaş" ile Instagram'a gönderilir. Metin şablonu Admin → Ayarlar'dan değiştirilir.

---

## Kurulum

### 1. Bilgisayara gerekenler
- [Node.js](https://nodejs.org) (LTS)
- [Git](https://git-scm.com)
- Firebase CLI: `npm install -g firebase-tools`, ardından `firebase login`

### 2. Bilgisayarda deneme (gerçek veritabanına dokunmaz)
```bash
git clone https://github.com/KananIbrahimov/avenueemporiumbaku.git
cd avenueemporiumbaku
firebase emulators:start --project demo
```
- Mağaza: http://localhost:5000
- Admin: http://localhost:5000/admin/
- Emulator paneli: http://localhost:4000 — doğrulama mailleri gerçekten gönderilmez, linkler buradaki **Authentication** sekmesinde / terminalde görünür.
- Emulator'da admin olmak için: mağazadan kayıt ol → http://localhost:4000/firestore → `kullanicilar` → kendi belgen → `rol` alanını `admin` yap.

### 3. Firebase Console ayarları (bir kere)
1. **Authentication → Sign-in method → Email/Password → Enable**
2. **Firestore Database → Create database** → `europe-west3` → production mode
3. **Project settings → Your apps → Web app** ekle → `firebaseConfig` bilgilerini `public/ortak/ayarlar.js` içine yapıştır
4. Admin sitesini oluştur:
   ```bash
   firebase hosting:sites:create avenueemporiumbaku-admin
   ```
5. **Authentication → Settings → Authorized domains:** `avenueemporiumbaku-admin.web.app` ekle (alan adı alınınca `avenuebaku.az` ve `admin.avenuebaku.az` de eklenir)
6. İstersen **Authentication → Templates**'ten doğrulama ve şifre sıfırlama maillerinin metnini Azerbaycanca yap.

### 4. Yayınlama
```bash
firebase deploy --only hosting,firestore:rules
```

**Otomatik yayın (GitHub'a her yüklemede):**
1. Firebase Console → Project settings → **Service accounts** → *Generate new private key* → JSON dosyası iner.
2. GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: indirilen JSON dosyasının tüm içeriği
3. Bundan sonra `main`'e her yüklemede `.github/workflows/yayinla.yml` iki siteyi ve kuralları yayınlar.
   > Bu JSON dosyası çok gizlidir; kimseyle paylaşma, repoya koyma.

### 5. Admin hesabı
1. Mağaza sitesinden **kananibrahimov999@gmail.com** ile kayıt ol ve maildeki linkle doğrula.
2. Firebase Console → Firestore → `kullanicilar` → bu hesabın belgesi → `rol` alanını `musteri` yerine **`admin`** yap.
3. Artık admin sitesinden bu hesapla girilebilir.

Müşteri tarafını denemek için ikinci hesap: **kananibrahimov999+musteri@gmail.com** (Gmail `+` ile gelen mailleri aynı kutuya getirir, Firebase bunu ayrı hesap sayar).
Abla başlayınca onun hesabı da aynı yolla admin yapılır.

---

## Yeni dil eklemek
1. `public/ortak/dil/az.js` dosyasını kopyala (örn. `ru.js`) ve metinleri çevir.
2. `public/ortak/i18n.js` içindeki `DILLER` listesine ekle.
Admin panelindeki ürün ve kategori formlarına otomatik olarak o dil için alanlar gelir, mağazada dil seçici görünür.

## Bilinen sınırlar (Spark planı)
- Fotoğraflar Firestore'da saklanıyor (Storage Blaze ister). Ürün başına en çok 8 fotoğraf; her biri otomatik ~550 KB altına küçültülür.
- Bildirim sadece admin paneli açıkken gelir. Kapalıyken bildirim için Blaze + Cloud Functions gerekir.
- Otomatik günlük yedek Blaze ister; şimdilik admin panelinden elle indirilir.
