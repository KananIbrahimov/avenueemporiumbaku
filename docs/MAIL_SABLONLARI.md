# AvenueBaku — E-posta şablonları (Firebase Console)

**Nereye:** Firebase Console → `avenueemporiumbaku` → Authentication → **Templates** sekmesi.
Her şablonun sağ üstündeki ✏️ (kalem) ile açılır. Aşağıdaki alanları kopyala-yapıştır yap, **Save**.

Mail tek şablon olarak iki dilde gider (üstte Azərbaycan dili, altta Rusça). Müşteri hangi dili seçerse seçsin anlayacağı mail gelir;
linke tıklayınca açılan sayfa da müşterinin kendi dilinde açılır.

> `%DISPLAY_NAME%`, `%LINK%`, `%EMAIL%`, `%NEW_EMAIL%` alanlarını **silme / değiştirme** — Firebase onları otomatik doldurur.

---

## 0. Önce bunu yap (bir kere, tüm şablonlar için ortak)

Herhangi bir şablonu açınca en altta **"Customize action URL"** linki var. Tıkla ve şunu yaz:

```
https://avenueemporiumbaku.web.app/eylem
```

Bu sayede müşteri maildeki linke tıklayınca Firebase'in İngilizce sayfası yerine **bizim sitemiz** açılır:
- e-posta onayında → "E-poçtunuz təsdiqləndi" yazar ve 4 saniye sonra **otomatik giriş ekranına** gider (e-posta hazır yazılı olur)
- şifre sıfırlamada → yeni şifre bizim sayfamızda yazılır, sonra giriş ekranı

(Domain alınınca bu adres `https://avenuebaku.az/eylem` olarak değiştirilecek.)

**Template language:** şablon sayfasının üstünde varsa dil seçimini değiştirme, olduğu gibi bırak.

---

## 1. Email address verification (E-posta doğrulama)

**Sender name:**
```
AvenueBaku
```

**Subject:**
```
AvenueBaku — e-poçt ünvanınızı təsdiqləyin | Подтвердите адрес электронной почты
```

**Message:**
```html
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1c1f23;max-width:560px">
<p style="font-size:20px;letter-spacing:3px;margin:0 0 20px"><b>AVENUE</b> BAKU</p>

<p>Hörmətli %DISPLAY_NAME%,</p>
<p>AvenueBaku-da qeydiyyatdan keçdiyiniz üçün təşəkkür edirik. Hesabınızı aktivləşdirmək üçün aşağıdakı keçidə daxil olaraq e-poçt ünvanınızı təsdiqləyin:</p>
<p><a href="%LINK%" style="display:inline-block;background:#1c1f23;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:24px;font-weight:bold">E-poçtu təsdiqlə</a></p>
<p>Təsdiqdən sonra üzvlər üçün endirimli qiymətlərdən yararlana və sifariş verə bilərsiniz.</p>
<p style="color:#6b7078;font-size:13px">Əgər bu hesabı siz yaratmamısınızsa, bu məktubu nəzərə almayın — heç bir əməliyyat tələb olunmur.</p>
<p>Hörmətlə,<br>AvenueBaku komandası</p>

<hr style="border:none;border-top:1px solid #e3e5e8;margin:28px 0">

<p>Уважаемый(-ая) %DISPLAY_NAME%,</p>
<p>Благодарим вас за регистрацию в AvenueBaku. Чтобы активировать аккаунт, подтвердите адрес электронной почты, перейдя по ссылке ниже:</p>
<p><a href="%LINK%" style="display:inline-block;background:#1c1f23;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:24px;font-weight:bold">Подтвердить почту</a></p>
<p>После подтверждения вам станут доступны цены для участников и оформление заказов.</p>
<p style="color:#6b7078;font-size:13px">Если вы не создавали этот аккаунт, просто проигнорируйте это письмо — никаких действий не требуется.</p>
<p>С уважением,<br>команда AvenueBaku</p>
</div>
```

---

## 2. Password reset (Şifre sıfırlama)

**Sender name:**
```
AvenueBaku
```

**Subject:**
```
AvenueBaku — şifrənin bərpası | Восстановление пароля
```

**Message:**
```html
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1c1f23;max-width:560px">
<p style="font-size:20px;letter-spacing:3px;margin:0 0 20px"><b>AVENUE</b> BAKU</p>

<p>Salam,</p>
<p>%EMAIL% hesabı üçün şifrənin bərpası tələb olunub. Yeni şifrə təyin etmək üçün aşağıdakı keçidə daxil olun:</p>
<p><a href="%LINK%" style="display:inline-block;background:#1c1f23;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:24px;font-weight:bold">Yeni şifrə təyin et</a></p>
<p style="color:#6b7078;font-size:13px">Keçid məhdud müddət ərzində etibarlıdır. Əgər bu tələbi siz göndərməmisinizsə, məktubu nəzərə almayın — hazırkı şifrəniz dəyişməz qalacaq.</p>
<p>Hörmətlə,<br>AvenueBaku komandası</p>

<hr style="border:none;border-top:1px solid #e3e5e8;margin:28px 0">

<p>Здравствуйте,</p>
<p>Для аккаунта %EMAIL% был запрошен сброс пароля. Чтобы задать новый пароль, перейдите по ссылке ниже:</p>
<p><a href="%LINK%" style="display:inline-block;background:#1c1f23;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:24px;font-weight:bold">Задать новый пароль</a></p>
<p style="color:#6b7078;font-size:13px">Ссылка действительна ограниченное время. Если вы не отправляли этот запрос, просто проигнорируйте письмо — ваш текущий пароль останется прежним.</p>
<p>С уважением,<br>команда AvenueBaku</p>
</div>
```

---

## 3. Email address change (E-posta değişikliği) — sadece gönderen adı ve konu

Sitede müşteri e-postasını değiştiremiyor, bu mail pratikte gitmez. Yine de tutarlı olsun:

**Sender name:** `AvenueBaku`

**Subject:**
```
AvenueBaku — e-poçt ünvanınız dəyişdirildi | Адрес электронной почты изменён
```

(Firebase bu şablonun metnini düzenlemeye izin vermiyorsa sadece bu iki alanı değiştir.)

---

## 4. Reply-to (hepsinde, isteğe bağlı)

Müşteri maile "Cevapla" derse nereye gitsin? Ablanın mağaza e-postası varsa **Reply to** alanına onu yaz.
Yoksa boş bırak.

---

## Kontrol

1. Test hesabıyla (`kananibrahimov999+musteri2@gmail.com`) yeni kayıt ol.
2. Gelen maili aç: konu, isim, iki dil düzgün mü?
3. Butona bas → "E-poçtunuz təsdiqləndi" sayfası → 4 sn sonra giriş ekranı, e-posta hazır yazılı.
4. Giriş ekranında "Şifrəni unutmusunuz?" → mail → yeni şifre sayfası → giriş.

> Not: `noreply@avenueemporiumbaku.firebaseapp.com` gönderen adresi domain alınana kadar değişmez. Domain bağlanınca
> "Customize domain" ile `noreply@avenuebaku.az` yapılır — maillerin spam'e düşme ihtimali de azalır.
