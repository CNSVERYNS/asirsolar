# Asır Solar — Production iletişim kurulumu

16 Eylül 2026. Ana site `https://www.asirsolar.com`; `asirsolar.com` buraya yönlenir. `asirsolar.com.tr` yalnızca web yönlendirmesi içindir, e-posta domaini değildir.

**Ortak adres: Asır Solar İletişim <iletisim@asirsolar.com>.** Eski `info@asirsolar.com` primary/shared adres değildir. Bu görevde gerçek e-posta/SMS gönderilmez. E-posta testi ve SMS testi için ayrı, açık kullanıcı onayı gerekir.

## Tamamlanan hesap ve DNS kurulumu

Bu bölüm kullanıcının bildirdiği tamamlanmış kurulum ve gerçek posta kutusu testlerine dayanır; web sitesinden transactional teslimatın test edildiği anlamına gelmez.

- [x] asirsolar.com Vercel DNS'e taşındı: ns1.vercel-dns.com, ns2.vercel-dns.com.
- [x] Zoho Mail Lite **10 GB**, iki kullanıcı lisansı aktif.
- [x] onur.durak@asirsolar.com oluşturuldu — Onur Durak.
- [x] furkan.cansever@asirsolar.com oluşturuldu — Ahmet Furkan Cansever.
- [x] iletisim@asirsolar.com Shared Mailbox oluşturuldu; adı Asır Solar İletişim.
- [x] Onur Shared Mailbox Moderator.
- [x] Furkan Shared Mailbox Moderator.
- [x] İkisinde de “Send using group email address” = Allowed.
- [x] Zoho MX verified: mx.zoho.com / 10, mx2.zoho.com / 20, mx3.zoho.com / 50.
- [x] Zoho SPF verified: `v=spf1 include:zohomail.com ~all`.
- [x] Zoho Mail DKIM verified: zmail._domainkey.
- [x] Domain ownership TXT mevcut ve doğrulanmış.
- [x] Harici Gmail'den ortak kutuya inbound mail gerçek test edildi.
- [x] Shared mailbox reply gerçek test edildi; gönderen iletisim@asirsolar.com.
- [x] ZeptoMail hesabı oluşturuldu — Organization: ASIR SOLAR.
- [x] ZeptoMail DKIM verified: 16151140._domainkey.
- [x] ZeptoMail bounce CNAME verified: bounce-zem → cluster89.zeptomail.com.
- [x] mail_agent_1 asirsolar.com ile associate edildi.
- [x] Sender Address Restriction enabled.
- [x] Allowed transactional sender = iletisim@asirsolar.com.
- [x] ZeptoMail Send Mail Token mevcut; değeri bu belgede tutulmaz.

Mevcut DNS/MX/SPF/DKIM kayıtlarını yeniden kurmak gerekmez.

## Uygulama akışı

Tek public submission endpoint'i **POST /api/talepler**. `/iletisim` üzerindeki ContactForm kullanır; hizmet/çözüm seçimleri aynı forma proje türü parametresiyle yönlenir. Geri ödeme hesaplayıcısı yalnızca tarayıcıda çalışır, lead/e-posta oluşturmaz.

Form alanları: ad soyad, telefon, e-posta, firma, proje türü, açıklama ve onay. Ayrı şehir/fatura/tüketim alanı yoktur; açıklamaya yazılan konum ve sistem bilgilerinin tamamı internal e-postaya girer. Yeni form alanı veya uydurma URL eklenmedi.

Doğrulama → lead + geçmiş + üç e-posta + iki SMS işinin aynı DB transaction'ında kaydı → HTTP yanıtı → Next.js after içinde bağımsız gönderimler. Idempotency, advisory lock, rate limit, API yanıtı ve panel URL'si korunur. Provider hatası kaydedilmiş lead'i silmez.

| İş | To | From | Reply-To |
| --- | --- | --- | --- |
| Müşteri teşekkür | Formdaki doğrulanmış adres | Asır Solar İletişim <iletisim@asirsolar.com> | iletisim@asirsolar.com |
| Onur internal | onur.durak@asirsolar.com | Aynı ortak adres | Müşterinin doğrulanmış adresi |
| Furkan internal | furkan.cansever@asirsolar.com | Aynı ortak adres | Müşterinin doğrulanmış adresi |

Üç e-posta üç ayrı kuyruk işi ve API çağrısıdır. Mevcut HTML/text tasarımı korunur. Müşteriye talebin alındığı, inceleneceği, dönüş yapılacağı ve referansı bildirilir; özel CRM bağlantısı veya kullanıcı serbest metni gönderilmez. Internal mesajlar tüm form alanlarını, talep numarasını, lead ID'yi ve **/admin/talepler/{lead.id}** bağlantısını içerir. HTML kaçırılır; recipient/reply-to tek adres olarak doğrulanır.

SMS mevcut ad + proje türü + panel bağlantısı şablonunu korur. Alıcılar: Onur **0541 924 35 45**, Furkan **0543 118 58 61**. Müşteriye SMS yoktur. Netgsm kapalı/eksikse SMS işleri held kalır; ağ çağrısı yapılmaz, e-posta ve kayıt devam eder.

## ZeptoMail REST ve SMTP uyumluluğu

Kod: lib/crm/zeptomail.ts; mevcut işleyici: lib/crm/email.ts. Sunucu giriş noktası notifications.server.ts, server-only sınırını içerir.

- Sabit HTTPS endpoint: https://api.zeptomail.com/v1.1/email.
- Authorization: `Zoho-enczapikey <Send Mail Token>`. Env'ye **ham token** girin, öneki kod ekler.
- from, tek öğeli to, reply_to, subject, htmlbody, textbody, mime_headers, client_reference kullanılır; tracking kapalıdır.
- Agent Alias request için gerekmez; alias/host/domain env'si eklenmedi. Token ilgili Agent'ı belirler.
- 10 saniye timeout; redirect: error. Token farklı hosta yönlendirilemez.
- EM_104 başarı kodu ve request ID doğrulanır. sent sağlayıcının kabulüdür; inbox teslim garantisi değildir.
- 429 artan beklemeyle tekrar denenir. Kesin 4xx failed; timeout, 5xx, bozuk/belirsiz başarı unknown kalır ve otomatik tekrar edilmez. client_reference provider idempotency garantisi sayılmaz.
- Provider error body, token, Authorization veya ham exception loglanmaz; sabit güvenli hata kodları tutulur.

[Resmî Send Email sözleşmesi](https://www.zoho.com/zeptomail/help/api/email-sending.html), [hata kodları](https://www.zoho.com/zeptomail/help/api/error-codes.html).

**İki yeni env gerekçesi:** CRM_ZEPTOMAIL_TOKEN SMTP parolasından farklı Send Mail Token'ı taşır. CRM_EMAIL_PROVIDER token eksik olduğunda eski SMTP ayarlarına sessizce dönülmesini önler. Diğer adlar korunur. Provider hiç tanımlanmamış eski deployment'larda varsayılan smtp'dir; mevcut SMTP uyumluluğu sürer. Bilinmeyen provider gönderimi kapalı tutar.

## Vercel env — exact source code adları

Vercel → asirsolar → Settings → Environment Variables. Gerçek provider credentials **yalnızca Production**. Preview/Development gönderim bayrakları false, gerçek token/parolalar boş olmalıdır. Testler sentetik değer ve mock sağlayıcı kullanır, prod DB'ye bağlanmaz.

| ENV VARIABLE NAME | Ne için / değer | Secret? | Nereden / ortam |
| --- | --- | --- | --- |
| CRM_EMAIL_PROVIDER | zeptomail | Hayır | Uygulama ayarı; Production. Preview/Development da aynı seçim, gönderim kapalı. |
| CRM_ZEPTOMAIL_TOKEN | Ham Send Mail Token | **Evet** | ZeptoMail mail_agent_1 → SMTP/API → Send Mail Token; **Production only**, Sensitive/Secret. |
| CRM_EMAIL_FROM | `ASIR SOLAR GÜNEŞ ENERJİSİ SİSTEMLERİ <iletisim@asirsolar.com>` | Hayır | Doğrulanmış sender; Production. |
| CRM_EMAIL_REPLY_TO | iletisim@asirsolar.com | Hayır | Shared Mailbox; Production. Boşsa From kullanılır. |
| CRM_EMAIL_ENABLED | Şimdi **false**; ayrı gerçek test onayı sonrası true | Hayır | Preview/Development false. |
| APP_ORIGIN | https://www.asirsolar.com | Hayır | Production origin; Preview kendi URL'si, Development http://localhost:3000. Bildirimler HTTPS ister. |
| NEXT_PUBLIC_SITE_URL | https://www.asirsolar.com | Hayır, public | Kanonik site URL'si; secret içermez. |
| CRM_SMS_PROVIDER | netgsm | Hayır | Netgsm hazır olduğunda Production. |
| CRM_SMS_ENABLED | Şimdi **false**; ayrı SMS onayı sonrası true | Hayır | Preview/Development false. |
| CRM_NETGSM_USERCODE | API alt kullanıcı kodu | Credential olarak koruyun | Netgsm API alt kullanıcı; Production only. |
| CRM_NETGSM_PASSWORD | API alt kullanıcı parolası | **Evet** | Netgsm alt kullanıcı; Production only, Sensitive/Secret. |
| CRM_NETGSM_HEADER | Onaylı başlığın birebir aynısı | Hayır | Netgsm Başlıklarım; Production. |
| CRON_SECRET | Mevcut zamanlayıcı yetkilendirmesi | **Evet** | Vercel ve Supabase Vault'taki mevcut değer; değiştirmeyin. Production only. |
| DATABASE_URL | Mevcut Supabase bağlantısı | **Evet** | Production değeri korunur. Preview için ayrı DB gerekir. |
| DATABASE_SSL_CA | Mevcut DB sertifika doğrulaması | Hayır, server ayarı | Mevcut Production değeri korunur. |
| CRM_SMTP_HOST | Eski SMTP host | Hayır | Yalnızca provider=smtp; REST kullanmaz. |
| CRM_SMTP_PORT | Eski SMTP portu; varsayılan 587, alternatif 465 | Hayır | Yalnızca SMTP. |
| CRM_SMTP_USER | Eski SMTP kullanıcı adı | Credential olarak koruyun | Yalnızca SMTP. |
| CRM_SMTP_PASSWORD | Eski SMTP parolası | **Evet** | Yalnızca SMTP. Send Mail Token'ını buraya koymayın. |

CRM_TRUST_PROXY IP rate-limit ayarı, CRM_LOCAL_DATABASE/CRM_LOCAL_PATH yerel test ayarları olarak kalır; Production sağlayıcı kurulumu için değişmez. VERCEL, VERCEL_URL ve VERCEL_PROJECT_PRODUCTION_URL platformdan gelir. NEXT_PUBLIC_WHATSAPP_PHONE/NAME public WhatsApp ayarlarıdır, e-posta/SMS credentials değildir.

Gönderen görünen adı `CRM_EMAIL_FROM` içinden güvenli ayrıştırılır; ZeptoMail `from.address` ve `from.name` alanlarına birlikte aktarılır. Ayrı display-name env'si yoktur. Müşteri ve ekip HTML e-postaları aynı başlığı kullanır: kaynak `logo.jpeg` ile aynı olan `public/images/brand/asir-logo.jpeg`, `APP_ORIGIN` üzerinden mutlak HTTPS URL ile yüklenir. Production logo URL'si: https://www.asirsolar.com/images/brand/asir-logo.jpeg. Düz metin ve Reply-To davranışı değişmez. Branding güncellemesi token, diğer secrets veya gönderim bayraklarını değiştirmez; doğrulama mock testler ve logo için GET ile yapılır.

Bu çalışmada Production non-secret CRM_EMAIL_PROVIDER, CRM_EMAIL_FROM, CRM_EMAIL_REPLY_TO hazırlandı; iki gönderim anahtarı false bırakıldı. Token okunmadı, alınmadı veya bağlanmadı. Token eklerken tüm environments seçeneğini kullanmayın.

## Test stratejisi ve kalan işler

Gerçek secret bağlamadan önce mock birim testleri, lint, build/typecheck, client bundle sızıntı kontrolü ve geçici yerel DB ile HTTP entegrasyonu çalıştırılır. Gerçek ileti gönderilmez. Build kontrolü gerçek token yerine sentetik canary kullanabilir.

```powershell
npm test
npm run lint
npm run build
npx tsc --noEmit
node scripts/check-communication-build.mjs
npm run test:integration
```

- [ ] ZeptoMail token Vercel CRM_ZEPTOMAIL_TOKEN'a girilecek.
- [ ] Gerekli diğer Vercel email env'leri son kez kontrol edilecek; non-secret değerler hazır, gönderim kapalı.
- [ ] Token/aktivasyon sonrasında production deployment/redeploy yapılacak. Kodun gönderimsiz yayını aktivasyon değildir.
- [ ] Açık kullanıcı onayıyla controlled transactional email test.
- [ ] Customer confirmation email inbox testi.
- [ ] Onur internal notification inbox testi.
- [ ] Furkan internal notification inbox testi.
- [ ] Netgsm account.
- [ ] Netgsm approved SMS header.
- [ ] Netgsm API sub-user/credentials.
- [ ] Netgsm env variables.
- [ ] Ayrı açık kullanıcı onayıyla SMS controlled test.
- [ ] Full end-to-end production form test.

**Kontrollü gerçek test önerisi:** Kullanıcının onayladığı test adresiyle, gönderimler kapalıyken tek test formu oluşturulur ve beş iş held kalır. E-posta testi onayından sonra email kanalı açılır/redeploy edilir; yalnızca bu talebin üç email işi panelden başlatılır. Bayrağı açmak yeni gerçek formların email gönderimini de etkinleştirir; bu etki onay kapsamında açıkça belirtilmelidir. SMS false kalır. SMS için daha sonra ayrı onay ve aktivasyon gerekir. Eski held işler kendiliğinden açılmaz. Provider kabulü sonrası inbox/telefon teslimatı ayrıca kontrol edilir.

## Netgsm hesabı geldiğinde

[Netgsm portalında](https://portal.netgsm.com.tr/) şirket hesabı/SMS bakiyesi oluşturun. SMS Hizmeti → SMS Ayarları → Başlıklarım üzerinden başlık onayı alın. Kullanıcı İşlemleri → API Talep İşlemleri ve Abonelik İşlemleri → Alt Kullanıcı Hesapları üzerinden API alt kullanıcısı ve SMS gönderim/rapor yetkilerini tamamlayın. Parolayı yalnızca Vercel Production secret alanına girin. [Netgsm API dokümanı](https://www.netgsm.com.tr/dokuman/)

Zamanlayıcı ve teslim durumları: [NOTIFICATION_SETUP.md](NOTIFICATION_SETUP.md). Token/parola/Authorization hiçbir belge, commit veya log'a yazılmaz.

## Bu sürümün doğrulaması

- [x] 45 otomatik test; ZeptoMail/SMTP/Netgsm çağrılarının tamamı mock. Tam gönderen adı ve logo başlığı doğrulandı.
- [x] Lint, production build ve ayrı TypeScript kontrolü geçti.
- [x] Yerel HTTP entegrasyonu ve 67 sayfa/rota kontrolü geçti.
- [x] Sentetik secret canary ile 23 client build dosyası tarandı; provider kodu veya secret sızıntısı yok.
- [x] Vercel Preview ve Development'ta ortam değişkeni tanımlı olmadığı kontrol edildi; production credentials kopyalanmadı.
- [x] Production sender/reply-to güncellendi, provider seçildi; iki gönderim anahtarı false.
- [ ] Gerçek transactional e-posta/SMS teslimatı — yapılmadı, ayrı açık onay gerekiyor.
