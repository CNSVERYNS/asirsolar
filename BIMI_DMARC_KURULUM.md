# Asır Solar — DMARC ve BIMI hazırlığı

**Durum: audit ve uygulama taslakları hazır; domain henüz BIMI-ready değil. DNS'e hiçbir kayıt eklenmedi/değiştirilmedi.** Gerçek e-posta/SMS gönderilmedi; Zoho Mail, ZeptoMail, MX/SPF/DKIM, env ve secret ayarlarına dokunulmadı. Sertifika satın alınmadı veya CA başvurusu yapılmadı.

Audit: **17 Eylül 2026, 12:16:41 UTC**. Gönderen domain `asirsolar.com`, canonical web origin `https://www.asirsolar.com`. Production From, kullanıcının bildirdiği ve önceki çalışmada ayarlanan `ASIR SOLAR GÜNEŞ ENERJİSİ SİSTEMLERİ <iletisim@asirsolar.com>` olarak korunur. `asirsolar.com.tr` e-posta/BIMI domaini değildir.

## 1. Canlı DNS sonucu

Cloudflare `1.1.1.1` ve Google `8.8.8.8` aynı sonucu verdi. Domain kayıtları ayrıca Vercel nameserver'larından read-only kontrol edildi. Aşağıdakiler DNS varlık kontrolleridir; teslim edilmiş bir iletinin authentication sonucu değildir.

| Kayıt | Canlı sonuç |
| --- | --- |
| NS | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| MX `asirsolar.com` | `mx.zoho.com` / 10; `mx2.zoho.com` / 20; `mx3.zoho.com` / 50 |
| SPF `asirsolar.com` | **Tek SPF:** `v=spf1 include:zohomail.com ~all` |
| Zoho Mail DKIM | `zmail._domainkey.asirsolar.com` TXT mevcut; RSA public key ayrıştırıldı, 1024 bit, boş/revoked değil |
| ZeptoMail DKIM | `16151140._domainkey.asirsolar.com` TXT mevcut; RSA public key ayrıştırıldı, 1024 bit, boş/revoked değil |
| Bounce | `bounce-zem.asirsolar.com` CNAME → `cluster89.zeptomail.com` |
| Bounce SPF | CNAME hedefinden çözülen TXT: `v=spf1 include:zeptomail.net -all` |
| DMARC `_dmarc.asirsolar.com` | **TXT yok — ENODATA. Mevcut DMARC değeri bulunmuyor.** |
| BIMI `default._bimi.asirsolar.com` | **TXT yok — ENODATA.** Bu kontrol default selector içindir. |

Root TXT'deki Zoho ownership doğrulaması ikinci bir SPF değildir. Zoho Mail include zinciri `asirsolar.com` → `zohomail.com` → `spf.zohomail.com` olarak çözüldü; son SPF IP ağlarını tanımlıyor. Mevcut kayıt Zoho Mail gönderim altyapısını kapsıyor. Yeni/duplicate SPF oluşturmayın; ZeptoMail için root SPF'ye körlemesine include eklemeyin.

İki resolver'da eşleşen DKIM public-key SHA256 değerleri:

- `zmail`: `59aadc8e638022c767662244c95812c44498622f198dab68f6c3db9f3273e4e6`
- `16151140`: `922bb9c66a1f99bffa168ab87d2c13ffae2fe3710c133321be902c946fc08998`

Tekrarlanabilir read-only kontrol: `node scripts/audit-email-dns.mjs`. Script yalnızca public DNS sorgular; sorgu hatasını kayıt yokluğu gibi göstermez. DKIM public key'leri secret değildir. Kontrol signing private key'ine veya sağlayıcı hesabına erişmez.

## 2. Alignment değerlendirmesi

| Kaynak | DNS'in desteklediği yapı | Henüz ispatlanmayan |
| --- | --- | --- |
| Zoho Mail — Onur, Furkan ve shared mailbox send-as/reply | `d=asirsolar.com; s=zmail` imzasını doğrulayabilecek public key mevcut | Gerçek gönderimde bu domain/selector ile imza atılması, `dkim=pass`, gerçek envelope-from ve SPF/DMARC sonucu |
| ZeptoMail — müşteri ve iki mühendis bildirimi | `d=asirsolar.com; s=16151140` için key; özel bounce subdomain ve SPF mevcut | Gerçek `DKIM-Signature`, `Return-Path` ve alıcı `Authentication-Results` değerleri |

`From` adı alignment'a karar vermez; görünür From domaini önemlidir. `dkim=pass` veren imzanın `d=` domaini From ile aligned olmalıdır. Alternatif olarak SPF'nin geçtiği envelope-from domaini aligned olabilir; DMARC için en az bir aligned başarılı mekanizma yeterlidir. Hedef iki kaynağın da DKIM ile güvenilir alignment sağlamasıdır.

ZeptoMail gerçekten `bounce-zem.asirsolar.com` Return-Path kullanırsa `aspf=r` ile `asirsolar.com` arasında relaxed alignment mümkündür. CNAME'in dışarıdaki hedef adı, tek başına SMTP envelope domainini değiştirmez. `aspf=s` bu subdomain farkında SPF alignment'ını bozabilir; taslaklarda relaxed mod korunur. Bu, DNS ve [ZeptoMail'in alignment açıklamasına](https://www.zoho.com/zeptomail/help/dmarc-policy.html) dayalı beklentidir, gerçek mesaj testi değildir.

**Bugün güvenle enforcement uygulanabilir sonucu çıkarılamaz.** Önceki başarılı teslimler yararlı olsa da tek başına DKIM/DMARC alignment kanıtı değildir. Mevcut iletilerin ham header'ları ve monitoring raporları henüz incelenmedi. Yeni gerçek test göndermeden önce ayrıca kullanıcı onayı gerekir; eldeki eski iletilerin header'larıyla başlanabilir.

## 3. SVG durumu — gerçek vektör kaynak eksik

Kullanıcı yalnız JPEG bulunduğunu doğruladı. Root `logo.jpeg` ile tracked `public/images/brand/asir-logo.jpeg` byte-for-byte aynı: **619×619 JPEG**, SHA256 `801bdf860d398ab1e0ea0347e1005e466d46ab0f4f405b796f221245d3f5adec`. Mevcut favicon/PNG'ler de raster türevler; repoda gerçek logo SVG/AI/EPS/vektör PDF kaynağı bulunmadı.

**BIMI SVG oluşturulmadı.** JPEG'i base64 `<image>` olarak SVG'ye gömmek uygun değil; [BIMI Group gömülü raster görüntüleri dışlıyor](https://bimigroup.org/faqs-for-senders-esps/). Uzantı değiştirilmedi, otomatik izleme sonucu yeni/uydurma logo veya sahte vektör yayımlanmadı.

Gereken: tasarımcıdan/tasarım arşivinden orijinal vektör SVG, AI, EPS veya gerçek path içeren PDF. JPEG yerleştirilmiş PDF yeterli değildir. Orijinal çizim yoksa mevcut tescilli logoyu sadakatle vektörleştirecek tasarım çalışması, şirket görsel onayı ve sertifika otoritesinin kabulü gerekir.

Vektör kaynak geldiğinde hedef dosya: `public/brand/bimi/asir-solar.svg`.

Planlanan URL: `https://www.asirsolar.com/brand/bimi/asir-solar.svg`.
**Bu URL şu an yayınlanmış BIMI asset'i değildir: GET 404, `text/html`, redirect yok. DNS'te referans vermeyin.** Mevcut JPEG URL'si GET 200 `image/jpeg`; BIMI yerine geçmez.

Vektör dosya için kabul listesi (henüz uygulanabilir bir SVG yok):

- SVG Tiny Portable/Secure: `version="1.2"`, `baseProfile="tiny-ps"`, SVG namespace; kare viewBox ve en az 96×96 mutlak boyut. Planlanan canvas `width="512" height="512" viewBox="0 0 512 512"`.
- Kaynak tasarımı ve oranı koruyan, ortalı gerçek vector path'ler; opak tek renk arka plan; transparan arka plan yok.
- `<title>ASIR SOLAR GÜNEŞ ENERJİSİ SİSTEMLERİ</title>` ve açıklayıcı `<desc>`.
- Root `<svg>` üzerinde x/y yok; raster/image, base64 image, script, animation, event handler, dış font/link/reference, foreignObject veya entity/DTD gibi dış içerik yok.
- Küçük boyutta ve daire/kare maskede görsel kontrol; mümkünse en fazla 32 KB.
- XML parse + güvenlik kontrolleri ardından [BIMI Group SVG araçları](https://bimigroup.org/svg-conversion-tools/) ve ilgili CA doğrulaması. Birkaç string kontrolünü tam Tiny-PS sertifikasyonu olarak kabul etmeyin.
- Public GET: TLS/HTTPS, doğrudan 200, `Content-Type: image/svg+xml`, authentication/cookie gerektirmeyen erişim, beklenen asset byte'ları. Vercel `public` hosting yeterli; henüz özel route/header veya boş placeholder eklenmedi.

Profil ayrıntıları: [BIMI Group SVG rehberi](https://bimigroup.org/creating-bimi-svg-logo-files/), [Google BIMI gereksinimleri](https://knowledge.workspace.google.com/admin/security/set-up-bimi).

## 4. DMARC taslakları — otomatik uygulama yok

Vercel DNS zone: `asirsolar.com`. Type: **TXT**. Name: **`_dmarc`**. FQDN: **`_dmarc.asirsolar.com`**. Başlangıç TTL önerisi: 300 saniye. Vercel name alanına domaini ikinci kez eklemeyin. Mevcut kayıt varsa ikinci DMARC TXT açmak yerine mevcut kaydın tamamını inceleyin.

Kullanıcı RUA alıcısı olarak iki mühendisi seçti: `onur.durak@asirsolar.com` ve `furkan.cansever@asirsolar.com`. Yeni adres/alias uydurulmadı. Bunlar per-form bildirimleri değil; alıcı sunucuların toplu authentication raporlarıdır, genellikle XML/sıkıştırılmış dosya biçiminde gelir. Raporların iki mevcut kutuda kabul edildiği ve düzenli incelendiği doğrulanmalıdır. `ruf` forensic raporu eklenmedi.

**A — Önce monitoring, henüz uygulanmadı:**

```text
v=DMARC1; p=none; rua=mailto:onur.durak@asirsolar.com,mailto:furkan.cansever@asirsolar.com; adkim=r; aspf=r
```

**B — BIMI için final quarantine hedefi; şimdi UYGULAMAYIN:**

```text
v=DMARC1; p=quarantine; sp=quarantine; pct=100; rua=mailto:onur.durak@asirsolar.com,mailto:furkan.cansever@asirsolar.com; adkim=r; aspf=r
```

`sp=quarantine` alt domainleri de kapsar; onların meşru göndericileri de envantere alınmalıdır. Alt domainlerde ayrı DMARC override'ları varsa ayrıca incelenir. `pct=100`, DMARC başarısızlığına ilişkin politikayı tam uygular; tüm meşru postaları karantinaya alma talimatı değildir. `p=reject` bu planın hedefi değildir.

Google önce en az bir hafta monitoring ve rapor incelemesi, ardından düşük oranlı quarantine ve kademeli artış öneriyor. Düşük hacimli Asır Solar için en az **7–14 gün ve bütün gerçek mail akışlarını kapsayan yeterli örnek** görmek önerilen değerlendirme süresidir; yalnız sürenin dolması onay sayılmaz. Gerekirse ara quarantine oranı ayrıca değerlendirilir; `pct<100` aşaması BIMI-ready değildir. [Google rollout rehberi](https://knowledge.workspace.google.com/admin/security/recommended-dmarc-rollout)

Quarantine'a geçişten önce:

1. Zoho Mail iki kullanıcının gönderimi, shared mailbox send-as/reply ve ZeptoMail müşteri/ekip mesajları dahil bütün kaynaklar envantere alınır. CRM dışında fatura, pazarlama veya başka SMTP hizmeti varsa ayrıca belirlenir.
2. SPF/DKIM ayarlarının yayılması tamamlanır; Google başlangıçta en az 48 saat önerir. Şu anki DNS görüntüsü ile eski sağlayıcı verified durumu tek başına yeterli sayılmaz.
3. Her kaynağın daha önce alınmış örneklerinde alıcının güvenilir `Authentication-Results`, `DKIM-Signature` (`d=`, `s=`), `Return-Path`, `From` incelenir. `dkim=pass`/`spf=pass` ve alignment birlikte değerlendirilir; DNS'te DMARC yokken eski mesajda `dmarc=none` görülebilir.
4. Monitoring yayımlandıktan sonra yeni normal akışların aggregate raporlarında kaynak IP, header_from, aligned DKIM/SPF ve disposition incelenir. Meşru trafik başarısızlıkları çözülür; açıklanamayan bir meşru akış kalmaz. Forwarding/mailing-list etkileri ayrıca değerlendirilir.
5. İki rapor kutusuna raporların ulaştığı, inceleme sorumlusu ve geri alma erişimi doğrulanır. Rapor gelmemesi başarı kanıtı değildir.
6. Alt domain etkileri, günlük rapor takibi ve rollback hazır olduğunda kullanıcıdan exact kayıt için ayrıca açık onay alınır. Gerçek test gerekiyorsa test gönderimi için de ayrı onay alınır.

## 5. VMC / CMC ve alıcı istemci koşulları

**Kullanıcı logonun tescilli olduğunu, tarihini bilmediğini bildirdi. Öncelikli değerlendirme VMC'dir; uygunluk henüz belgeyle doğrulanmadı.** Tarihi şimdi bilmek zorunlu değil; tescil belgesinden doğrulanır. Tescil kurum/ülkesi, numarası, güncel durumu, hak sahibi ve tescilli görselin bu logoyla eşleşmesi gerekli. Yalnız şirket adı/kelime markası tescili, logonun tesciliyle aynı kabul edilmemelidir.

| Seçenek | Uygunluk | Gmail görünümü |
| --- | --- | --- |
| VMC | CA'nın tanıdığı tescilli logo/marka ve kuruluş/domain haklarının doğrulanması | BIMI logosu ve VMC doğrulama işareti için uygun yol |
| CMC | Logo tescilli değilse de CA'nın kullanım/hak sahipliği şartlarıyla mümkün olabilir | BIMI logosu mümkün; VMC verified checkmark sağlamaz |

Gmail yalnız standalone SVG BIMI ile logo göstermeyi desteklemiyor; geçerli VMC veya CMC ve public PEM gerekir. Sertifika, ona bağlı logo ve gerekli CA zinciri birlikte doğrulanır. [Google'ın güncel kurulumu](https://knowledge.workspace.google.com/admin/security/set-up-bimi)

Sertifika kararı için manuel bilgi listesi: tescil belgesi/numarası/ülkesi/kurumu; marka ve domain hak sahibi şirketin unvanı; logo çiziminin tescille birebir eşleşmesi; orijinal vektör kaynak; istenen alıcı istemciler ve Gmail checkmark beklentisi. CMC yolu gerekirse kamuya açık kullanım geçmişi ve CA'nın istediği kanıtlar ayrıca belirlenir. [BIMI Group issuer listesi](https://bimigroup.org/vmc-issuers/) üzerinden ilgili CA'nın bu tescili ve hedef alıcıları desteklediği teyit edilir. Satın alma/başvuru yapılmadı.

İstemci desteği tek tip değildir:

- Gmail: yukarıdaki VMC/CMC koşulları geçerlidir; authentication, reputation ve istemci önbelleği de görünümü etkileyebilir.
- Yahoo: self-asserted BIMI için bazı destek bulunur; gönderim hacmi/reputation ve alıcı politikaları önemlidir. Küçük hacimli bireysel yazışmalarda logo garantisi yoktur. [BIMI Group sender FAQ](https://bimigroup.org/faqs-for-senders-esps/)
- Apple Mail: gönderenin yanı sıra alıcı e-posta hizmetinin de Apple'ın BIMI koşullarını sağlaması gerekir. CMC kabulünü Gmail desteğinden türetmeyin. [Apple açıklaması](https://support.apple.com/en-us/108340)
- Zoho'nun yayımladığı yönetim rehberi VMC'yi şart olarak listeliyor; CMC'nin aynı kapsamda kabul edildiği varsayılmadı. Zoho paneli değiştirilmedi. [Zoho rehberi](https://www.zoho.com/mail/help/adminconsole/advanced-security-configuration.html)

## 6. BIMI TXT taslakları — SVG/sertifika olmadan yayımlamayın

Vercel zone: `asirsolar.com`. Type: **TXT**. Name: **`default._bimi`**. FQDN: **`default._bimi.asirsolar.com`**. Başlangıç TTL önerisi: 300 saniye. Tek kayıt kullanılacak.

**SVG-only örnek — henüz 404 olan planlanan asset'e işaret eder, uygulanamaz ve Gmail için yeterli değildir:**

```text
v=BIMI1; l=https://www.asirsolar.com/brand/bimi/asir-solar.svg;
```

**SVG ve CA sertifikası hazır olduğunda hedef genel biçim:**

```text
v=BIMI1; l=https://www.asirsolar.com/brand/bimi/asir-solar.svg; a=<CA_ONAYLI_PEM_HTTPS_URL>;
```

`<CA_ONAYLI_PEM_HTTPS_URL>` bilinçli placeholder'dır; gerçek sertifika/URL yok, DNS'e bu metin girilmez. Sertifika PEM'i public doğrulama belgesidir; private key kesinlikle public dizine konmaz. Public PEM'in entity + gerekli intermediate/root zinciri CA'nın verdiği sırayla hazırlanır. Dosya URL'sinin HTTPS/200, zincirin geçerli, domain/logo eşleşmesinin doğru olduğu kontrol edilir.

Google'ın güncel örneği, logo PEM içinde olduğunda `v=BIMI1; l=; a=<CA_ONAYLI_PEM_HTTPS_URL>;` biçimini de kullanıyor. CA/Google'a göre final biçim seçilir; iki alternatif aynı anda iki TXT olarak eklenmez. [Google TXT adımları](https://knowledge.workspace.google.com/admin/security/add-a-bimi-txt-record-to-your-domain-detailed-steps), [BIMI Group implementation guide](https://bimigroup.org/implementation-guide/)

## 7. Rollback ve değişiklik sınırı

Bu işte DNS değişmedi; şu an rollback gerekmiyor. Gelecekte her değişiklikten önce mevcut TXT değerleri, TTL ve zaman kaydedilir, DNS yeniden audit edilir.

- Quarantine meşru gönderimi etkilerse ayrı onayla DMARC, bölüm 4-A'daki monitoring değerine geri alınır. `sp=quarantine` da kaldırılarak inherited `p=none` kullanılır. Mevcut MX/SPF/DKIM korunur; DMARC kaydı körlemesine silinmez. BIMI bu sırada enforcement şartını karşılamaz.
- BIMI sorunu varsa ilgili yeni BIMI kaydı önceki exact değerine alınır; önce yoksa yeni kayıt kaldırılır. Yalnız logo gösterimi için sağlıklı DMARC enforcement gevşetilmez.
- HTTP asset sorunu varsa önceki doğrulanmış **logo/sertifika çifti** birlikte geri alınır; farklı SVG ile eski PEM eşleştirilmez. DNS/istemci cache nedeniyle görünüm anında değişmeyebilir.
- Site kodu deployment geri alma ile DNS geri alma farklı işlemlerdir. Web deployment'ını geri almak DNS politikasını geri almaz.

## 8. Doğrulama ve kalan işler

Çalıştırılan kontroller:

```powershell
node scripts/audit-email-dns.mjs
npm run lint
npm run build
npx tsc --noEmit
npm test
node scripts/check-communication-build.mjs
node scripts/check-brand-icons.mjs https://www.asirsolar.com
```

DNS script'i canlı public sorgu; mevcut email/SMS testleri mock. Site/form/notification uygulama kodunda değişiklik yok. Mevcut production favicon ve logo hosting korunur.

Sonuçlar: lint ve bağımsız typecheck geçti; mevcut suite **45/45** geçti. İlk yerel build 11 worker ile sistem belleğine takıldı; kurulu Next.js'in desteklediği `CIRCLE_NODE_TOTAL=2` yalnız o shell sürecine verilerek build **1 worker ile başarılı** tamamlandı. Bu yerel test ayarı Vercel'e, `.env` dosyasına veya uygulama config'ine eklenmedi. Yeni client build'in 23 dosyasında communication secret/provider kodu sızıntısı bulunmadı. Production favicon/apple/manifest/head GET kontrolleri geçti. Dokümandaki iki DMARC TXT taslağında doğrulanmış iki alıcı, politika ve tek TXT-string uzunluğu ayrıca kontrol edildi.

**BIMI asset validation / SVG syntax-security / SVG 200 testi: BLOKE — gerçek vektör kaynak yok; geçerli SVG üretilmedi.** Planlanan URL'nin gerçek GET sonucu 404 olarak kaydedildi. Bu, başarılı SVG testi diye raporlanmaz. Vektör kaynak sağlanınca bölüm 3 kabul listesi çalıştırılacak; sertifika ve DNS aktivasyonu ayrı onay adımıdır.

- [x] SPF/MX/DKIM/bounce ve mevcut DMARC/BIMI read-only audit.
- [x] İki RUA alıcısı kullanıcı tarafından seçildi.
- [x] Logo tescili kullanıcı tarafından bildirildi; VMC öncelikli yol olarak belirlendi.
- [x] Monitoring/enforcement/BIMI taslakları ve rollback hazır.
- [ ] Orijinal gerçek vektör logo veya onaylı vektör çizim.
- [ ] Tescil belgesi ve CA uygunluk değerlendirmesi; VMC/CMC sertifikası.
- [ ] Eski header incelemesi; ayrıca onay sonrası monitoring ve rapor toplama.
- [ ] Quarantine'a geçiş koşullarının karşılanması ve exact DNS değişikliği onayı.
- [ ] Valid SVG/public PEM hosting, doğrulama ve ayrı BIMI DNS aktivasyon onayı.

**DNS değişikliği öncesinde duruldu. Bu belge uygulama onayı yerine geçmez.**
