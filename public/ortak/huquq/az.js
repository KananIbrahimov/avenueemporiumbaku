// İstifadə şərtləri və Məxfilik siyasəti — Azərbaycan dili
// {onOdeme} və {elaqe} mağaza ayarlarından (Admin → Ayarlar → Sifariş və ön ödəniş) avtomatik doldurulur.
export default {
  tarixEtiket: "Son yenilənmə",

  sertler: {
    baslik: "İstifadə şərtləri",
    html: `
<p>Bu İstifadə şərtləri AvenueBaku onlayn mağazasının (bundan sonra — «Mağaza») saytından və mobil tətbiq kimi quraşdırılan versiyasından (bundan sonra — «Sayt») istifadə qaydalarını, habelə Mağaza ilə Sayt vasitəsilə sifariş verən şəxs (bundan sonra — «Müştəri») arasındakı münasibətləri tənzimləyir.</p>
<p>Saytda qeydiyyatdan keçməklə və ya sifariş verməklə Müştəri bu şərtləri oxuduğunu, anladığını və tam həcmdə qəbul etdiyini təsdiq edir. Şərtlərlə razı deyilsinizsə, Saytdan istifadə etməməyiniz xahiş olunur.</p>

<h3>1. Xidmətin mahiyyəti</h3>
<p>1.1. Mağaza Avropa, Türkiyə, ABŞ, Çin və digər ölkələrdəki satıcıların məhsullarını (geyim, ayaqqabı, aksesuar və s.) seçir, Saytda təqdim edir və Müştərinin sifarişi əsasında həmin məhsulları alaraq Bakıya çatdırır.</p>
<p>1.2. Məhsulların böyük hissəsi anbarda saxlanılmır; sifariş təsdiqləndikdən və ön ödəniş edildikdən sonra xarici satıcıdan alınır.</p>
<p>1.3. Mağaza Saytda göstərilən brendlərin rəsmi nümayəndəsi və ya distributoru deyil. Brend adları və əmtəə nişanları onların hüquq sahiblərinə məxsusdur.</p>

<h3>2. Hesab və qeydiyyat</h3>
<p>2.1. Qeydiyyat üçün ad, soyad, e-poçt ünvanı və şifrə tələb olunur. Müştəri təqdim etdiyi məlumatların doğru və aktual olmasına cavabdehdir.</p>
<p>2.2. Hesab e-poçt ünvanına göndərilən keçid vasitəsilə təsdiqləndikdən sonra aktivləşir. Üzvlər üçün nəzərdə tutulmuş endirimli qiymətlər və sifariş imkanı yalnız təsdiqlənmiş hesablara şamil olunur.</p>
<p>2.3. Müştəri şifrəsinin məxfiliyini qorumağa və hesabı ilə edilən bütün əməliyyatlara görə məsuliyyət daşıyır. Hesabdan icazəsiz istifadə şübhəsi yarandıqda dərhal şifrəni dəyişməli və Mağazaya məlumat verməlidir.</p>
<p>2.4. Sayt 18 yaşına çatmış şəxslər üçün nəzərdə tutulub. 18 yaşından kiçik şəxslər Saytdan yalnız valideynin və ya qanuni nümayəndənin razılığı ilə istifadə edə bilər.</p>
<p>2.5. Bu şərtləri pozan, yanlış məlumat təqdim edən və ya Saytdan qeyri-qanuni məqsədlə istifadə edən hesablar Mağaza tərəfindən bağlana bilər.</p>

<h3>3. Qiymətlər</h3>
<p>3.1. Bütün qiymətlər Azərbaycan manatı (₼) ilə göstərilir. Göstərilən qiymətə, bir qayda olaraq, məhsulun dəyəri, Bakıya qədər beynəlxalq daşınma və gömrük xərcləri daxildir.</p>
<p>3.2. Qiymətlər valyuta məzənnələrinə və xarici satıcıların qiymətlərinə görə dəyişə bilər. Sifarişə sifarişin verildiyi andakı qiymət tətbiq olunur.</p>
<p>3.3. Saytda texniki səhv nəticəsində yanlış qiymət göstərildiyi halda Mağaza bu barədə Müştəriyə məlumat verir. Belə sifariş Müştərinin yeni qiymətlə razılığı olmadan icra edilmir; razılıq verilmədikdə edilmiş ödəniş tam həcmdə qaytarılır.</p>
<p>3.4. Qiymətə daxil olmayan hər hansı əlavə xərc (məsələn, Müştərinin xahişi ilə xüsusi çatdırılma) yarandıqda, bu xərc əvvəlcədən Müştəri ilə razılaşdırılır.</p>

<h3>4. Sifariş və ön ödəniş</h3>
<p>4.1. Saytda verilən sifariş Mağazaya ünvanlanmış müraciətdir. Mağaza məhsulun satıcıda mövcudluğunu və qiymətini yoxladıqdan sonra sifarişi təsdiqləyir və ya səbəbini bildirməklə imtina edir.</p>
<p>4.2. Sifarişin icrasına başlanması üçün sifariş məbləğinin <b>{onOdeme}%</b>-i həcmində ön ödəniş tələb olunur. Ön ödəniş məbləği səbətdə və «Sifarişlərim» bölməsində göstərilir. Ön ödəniş daxil olmadan məhsul xarici satıcıdan alınmır.</p>
<p>4.3. Qalıq məbləğ məhsul Müştəriyə təhvil verilərkən ödənilir.</p>
<p>4.4. Hazırda Saytda onlayn ödəniş aparılmır. Ödəniş Mağazanın rəsmi əlaqə vasitələri ilə bildirdiyi rekvizitlər üzrə həyata keçirilir. Mağaza heç vaxt kart məlumatlarınızı, SMS kodlarını və ya şifrənizi soruşmur.</p>
<p>4.5. Sifarişin mərhələləri (ödəniş edildi, sifariş verildi, yoldadır, gömrükdədir, çatdırıldı) «Sifarişlərim» bölməsində izlənilə bilər.</p>

<h3>5. Çatdırılma</h3>
<p>5.1. Saytda və ya sifariş zamanı bildirilən çatdırılma müddətləri təxminidir. Müddət xarici satıcının göndərmə sürətindən, kargo şirkətindən və gömrük prosedurlarından asılıdır.</p>
<p>5.2. Mağazadan asılı olmayan səbəblərdən (satıcının gecikməsi, gömrük yoxlaması, fors-major halları) yaranan gecikmələrə görə Mağaza məsuliyyət daşımır, lakin Müştərini vəziyyət barədə məlumatlandırır.</p>
<p>5.3. Məhsulun Bakıda Müştəriyə təhvil verilmə qaydası və vaxtı tərəflər arasında razılaşdırılır.</p>

<h3>6. Sifarişin ləğvi</h3>
<p>6.1. Məhsul xarici satıcıdan alınmazdan əvvəl (sifariş «Sifariş verildi» mərhələsinə keçənədək) Müştəri sifarişi ləğv edə bilər; bu halda ön ödəniş tam həcmdə qaytarılır.</p>
<p>6.2. Məhsul Müştərinin sifarişi əsasında xarici satıcıdan alındıqdan sonra sifarişin ləğvi zamanı ön ödəniş, çəkilmiş xərclərin (məhsulun alışı, daşınma, gömrük) ödənilməsi məqsədilə qaytarılmır. Bu halda qalıq məbləğ tələb olunmur.</p>
<p>6.3. Məhsul satıcıda tükəndikdə və ya sifariş Mağaza tərəfindən icra edilə bilmədikdə, ödənilmiş məbləğ tam həcmdə qaytarılır.</p>

<h3>7. Geri qaytarma və dəyişdirmə</h3>
<p>7.1. Qüsurlu, zədələnmiş və ya sifarişə uyğun olmayan (fərqli model, rəng və ya ölçü) məhsul barədə Müştəri təhvil aldığı gündən etibarən <b>3 gün</b> ərzində fotoşəkillərlə birlikdə Mağazaya müraciət etməlidir. Müraciət təsdiqləndikdə məhsul dəyişdirilir və ya ödənilmiş məbləğ qaytarılır.</p>
<p>7.2. Məhsullar Müştərinin fərdi sifarişi ilə xaricdən gətirildiyi üçün ölçü seçimi Müştərinin məsuliyyətindədir. Sifarişdən əvvəl məhsul səhifəsindəki ölçü məlumatları ilə tanış olmaq və zərurət olduqda Mağazadan məsləhət almaq tövsiyə olunur.</p>
<p>7.3. Keyfiyyətli məhsulun qaytarılması və dəyişdirilməsi Azərbaycan Respublikasının istehlakçıların hüquqlarının müdafiəsi sahəsindəki qanunvericiliyi ilə müəyyən edilmiş qaydada həyata keçirilir. Gigiyenik səbəblərdən alt paltarı, çimərlik geyimi, corab və qulaq sırğaları istifadə edilmiş olmasından asılı olmayaraq geri qəbul edilmir.</p>
<p>7.4. Geri qaytarılan məhsul istifadə edilməmiş, etiketləri və orijinal qablaşdırması saxlanılmış vəziyyətdə olmalıdır.</p>

<h3>8. Məhsul məlumatları və şəkillər</h3>
<p>8.1. Mağaza məhsulların təsvirini və şəkillərini mümkün qədər dəqiq təqdim etməyə çalışır. Ekran parametrlərindən asılı olaraq rəng çalarları real məhsuldan cüzi fərqlənə bilər.</p>
<p>8.2. Məhsul şəkillərinin bir hissəsi satıcılar tərəfindən təqdim olunur və yalnız məlumat xarakteri daşıyır.</p>

<h3>9. Əqli mülkiyyət</h3>
<p>Saytın dizaynı, mətnləri, loqosu və proqram təminatı Mağazaya məxsusdur. Onların Mağazanın yazılı icazəsi olmadan kopyalanması, yayılması və kommersiya məqsədilə istifadəsi qadağandır.</p>

<h3>10. Məsuliyyətin məhdudlaşdırılması</h3>
<p>10.1. Mağaza Saytın fasiləsiz və xətasız işləməsi üçün ağlabatan tədbirlər görür, lakin texniki nasazlıqlar, internet bağlantısındakı problemlər və üçüncü tərəf xidmətlərinin fasilələri nəticəsində yaranan gecikmələrə görə məsuliyyət daşımır.</p>
<p>10.2. Mağazanın hər hansı sifariş üzrə məsuliyyəti həmin sifariş üzrə Müştəri tərəfindən faktiki ödənilmiş məbləğlə məhdudlaşır.</p>

<h3>11. Şərtlərin dəyişdirilməsi</h3>
<p>Mağaza bu şərtləri dəyişdirmək hüququnu özündə saxlayır. Yeni redaksiya Saytda dərc edildiyi andan qüvvəyə minir. Artıq verilmiş sifarişlərə sifariş zamanı qüvvədə olan şərtlər tətbiq olunur.</p>

<h3>12. Tətbiq olunan hüquq və mübahisələr</h3>
<p>Bu şərtlər Azərbaycan Respublikasının qanunvericiliyi ilə tənzimlənir. Tərəflər arasında yaranan mübahisələr ilk növbədə danışıqlar yolu ilə həll edilir; razılığa gəlinmədikdə mübahisə qanunvericiliklə müəyyən edilmiş qaydada Azərbaycan Respublikasının məhkəmələrində baxılır.</p>

<h3>13. Əlaqə</h3>
<p>Sual, təklif və şikayətlərinizlə bağlı bizimlə {elaqe} əlaqə saxlaya bilərsiniz.</p>`,
  },

  mexfilik: {
    baslik: "Məxfilik siyasəti",
    html: `
<p>AvenueBaku (bundan sonra — «Mağaza») Müştərilərinin fərdi məlumatlarının məxfiliyinə hörmətlə yanaşır. Bu Məxfilik siyasəti Sayt vasitəsilə hansı məlumatların toplandığını, onlardan necə istifadə olunduğunu və necə qorunduğunu izah edir. Fərdi məlumatların emalı «Fərdi məlumatlar haqqında» Azərbaycan Respublikasının Qanununa uyğun həyata keçirilir.</p>
<p>Saytda qeydiyyatdan keçməklə siz fərdi məlumatlarınızın bu siyasətdə göstərilən qaydada emalına razılıq verirsiniz.</p>

<h3>1. Topladığımız məlumatlar</h3>
<ul>
<li><b>Qeydiyyat məlumatları:</b> ad, soyad, e-poçt ünvanı və şifrə. Şifrə açıq şəkildə saxlanılmır — Google Firebase Authentication xidməti tərəfindən şifrələnmiş formada saxlanılır və Mağaza onu görə bilmir.</li>
<li><b>Əlaqə məlumatları:</b> telefon və WhatsApp nömrəsi (hesab ayarlarında və ya sifariş zamanı daxil etdiyiniz halda).</li>
<li><b>Sifariş məlumatları:</b> sifariş etdiyiniz məhsullar, ölçü, rəng, say, qiymət, sifariş qeydi, ödəniş və çatdırılma statusu.</li>
<li><b>Seçimləriniz:</b> bəyəndiyiniz məhsullar, dil və görünüş seçimi.</li>
<li><b>Hesabın yaradılma tarixi</b> və bu sənədlərin qəbul edilmə tarixi.</li>
</ul>
<p>Mağaza bank kartı məlumatlarını, şəxsiyyət vəsiqəsi məlumatlarını və ya dəqiq yerləşmə (geolokasiya) məlumatlarını toplamır.</p>

<h3>2. Cihazınızda saxlanılan məlumatlar</h3>
<p>Saytın düzgün işləməsi üçün brauzerinizin yaddaşında (localStorage, IndexedDB) giriş sessiyası, dil və görünüş seçimi, səbət və qonaq kimi bəyəndiyiniz məhsullar saxlanılır. Sayt reklam və izləmə (tracking) kukilərindən, eləcə də üçüncü tərəf analitika xidmətlərindən istifadə etmir.</p>

<h3>3. Face ID / Touch ID kilidi</h3>
<p>Bu funksiyanı aktiv etdiyiniz halda biometrik yoxlama tamamilə cihazınızın öz təhlükəsizlik sistemi tərəfindən aparılır. Barmaq izi və ya üz məlumatları heç vaxt Mağazaya və ya serverlərə ötürülmür; Sayt yalnız yoxlamanın uğurlu olub-olmadığı barədə cavab alır.</p>

<h3>4. Məlumatlardan istifadə məqsədləri</h3>
<ul>
<li>hesabın yaradılması, təsdiqlənməsi və qorunması;</li>
<li>sifarişlərin qəbulu, icrası və çatdırılması;</li>
<li>sifariş, ödəniş və çatdırılma ilə bağlı sizinlə əlaqə saxlanılması;</li>
<li>üzvlər üçün nəzərdə tutulmuş qiymətlərin tətbiqi;</li>
<li>qanunvericilikdən irəli gələn öhdəliklərin (o cümlədən mühasibat uçotu) yerinə yetirilməsi.</li>
</ul>
<p>Məlumatlarınız sizin ayrıca razılığınız olmadan reklam göndərişləri üçün istifadə edilmir və heç bir halda üçüncü şəxslərə satılmır.</p>

<h3>5. Məlumatların ötürülməsi</h3>
<p>Məlumatlarınız yalnız aşağıdakı hallarda və zəruri həcmdə üçüncü tərəflərə ötürülə bilər:</p>
<ul>
<li><b>Google Firebase (Google LLC)</b> — Saytın yerləşdirilməsi, hesabların idarə olunması və məlumatların saxlanması üçün istifadə olunan texniki xidmət;</li>
<li><b>WhatsApp (Meta Platforms)</b> — sifarişi WhatsApp vasitəsilə göndərməyi seçdiyiniz halda mesaj sizin cihazınızdan birbaşa WhatsApp-a ötürülür;</li>
<li><b>kargo və kuryer xidmətləri</b> — yalnız çatdırılma üçün zəruri olan məlumatlar (ad, soyad, telefon);</li>
<li><b>dövlət orqanları</b> — yalnız qanunvericiliklə nəzərdə tutulmuş hallarda və qaydada.</li>
</ul>

<h3>6. Məlumatların saxlanma yeri və təhlükəsizliyi</h3>
<p>6.1. Məlumatlar Google Cloud infrastrukturunda saxlanılır və serverlər Azərbaycan Respublikasının hüdudlarından kənarda yerləşə bilər. Saytda qeydiyyatdan keçməklə siz məlumatlarınızın bu məqsədlə transsərhəd ötürülməsinə razılıq verirsiniz.</p>
<p>6.2. Sayt ilə bütün məlumat mübadiləsi şifrələnmiş (HTTPS) bağlantı üzərindən aparılır. Verilənlər bazasına giriş təhlükəsizlik qaydaları ilə məhdudlaşdırılıb: hər Müştəri yalnız öz məlumatlarını görə bilir, bütün məlumatlara isə yalnız Mağazanın səlahiyyətli əməkdaşları çıxış əldə edir.</p>

<h3>7. Saxlanma müddəti</h3>
<p>Hesab məlumatları hesab aktiv olduğu müddətdə saxlanılır. Hesab silindikdə fərdi məlumatlar silinir; qanunvericiliyə əsasən saxlanılması tələb olunan sifariş və ödəniş qeydləri isə müvafiq müddət bitənədək saxlanılır.</p>

<h3>8. Hüquqlarınız</h3>
<p>Siz aşağıdakı hüquqlara maliksiniz:</p>
<ul>
<li>barənizdə saxlanılan məlumatlarla tanış olmaq;</li>
<li>məlumatlarınızı düzəltmək — ad, soyad və əlaqə nömrələrini «Ayarlar → Hesab» bölməsində özünüz dəyişə bilərsiniz;</li>
<li>hesabınızın və fərdi məlumatlarınızın silinməsini tələb etmək;</li>
<li>məlumatların emalına verdiyiniz razılığı geri götürmək.</li>
</ul>
<p>Bu hüquqlardan istifadə etmək üçün bizimlə {elaqe} əlaqə saxlayın. Müraciətlər ən qısa müddətdə cavablandırılır.</p>

<h3>9. Yetkinlik yaşına çatmayanlar</h3>
<p>Sayt 18 yaşına çatmamış şəxslər üçün nəzərdə tutulmayıb. Mağaza belə şəxslərin məlumatlarını bilərəkdən toplamır.</p>

<h3>10. Siyasətin dəyişdirilməsi</h3>
<p>Bu siyasət vaxtaşırı yenilənə bilər. Yeni redaksiya Saytda dərc edildiyi andan qüvvəyə minir; mühüm dəyişikliklər barədə istifadəçilər məlumatlandırılır.</p>

<h3>11. Əlaqə</h3>
<p>Fərdi məlumatlarınızla bağlı sual və müraciətlərinizi bizə {elaqe} göndərə bilərsiniz.</p>`,
  },

  elaqeWa: "WhatsApp vasitəsilə ({nomre})",
  elaqeYox: "saytdakı əlaqə vasitələri ilə",
};
