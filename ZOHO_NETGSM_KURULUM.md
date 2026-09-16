# Asır Solar — Zoho ve Netgsm kurulumu

16 Eylül 2026. Site adresi `https://www.asirsolar.com`; `asirsolar.com` bu adrese yönleniyor.

Site yazılımı hazırlandığında her yeni web talebi için müşteriye teşekkür e-postası, Onur ve Furkan'a ayrı ayrı e-posta ve SMS kaydı oluşturulur. Hesap açılışı, DNS doğrulaması, sağlayıcı erişimi ve gerçek teslimat kontrolü tamamlanmadan gönderimler açılmaz. Admin giriş hesapları, şirket posta kutularından ayrıdır.

## 1. Şirket e-posta adresleri: Zoho Mail Lite

Başlangıç için **Mail Lite 5 GB, iki kullanıcı** seçin. [Paket sayfasında](https://www.zoho.com/mail/zohomail-pricing.html) yıllık ücretlendirme ve hesabınızın ülkesine ait son fiyatı kontrol edin. Bu iş için e-posta paketi yeterli; ayrıca ofis uygulaması paketi gerekmiyor.

1. Şirket yetkilisi olarak Zoho hesabınızı açın; kendi telefonunuzla doğrulamayı ve gerekiyorsa satın almayı tamamlayın. Mevcut alan adı olarak `asirsolar.com` ekleyin.
2. Zoho'nun verdiği domain doğrulama TXT kaydını **Vercel → Domains → asirsolar.com → DNS Records** bölümüne ekleyin, sonra Zoho'da doğrulayın. Hesaba özel kayıt değeri Zoho ekranından alınmalıdır.
3. **Users** bölümünde iki posta kutusu oluşturun:
   - `onur.durak@asirsolar.com` — Onur Durak
   - `furkan.cansever@asirsolar.com` — Furkan Cansever
4. **Groups** bölümünde `info@asirsolar.com` grubu oluşturun; ikisini üye ekleyin. Dışarıdan müşteri yanıtları gelebilmesi için gruba e-posta gönderebilecekleri **Everyone** olarak seçin. Böylece teşekkür e-postasının yanıtları iki mühendise de ulaşır. [Zoho grup ayarları](https://www.zoho.com/mail/help/adminconsole/creating-groups.html)
5. **Domains → asirsolar.com → Email Configuration** ekranındaki MX, SPF ve DKIM kayıtlarını Vercel DNS'e ekleyin. MX önceliklerini aynen koruyun. Sunucu adları veri merkezine göre değişebilir; rastgele `.com` veya `.eu` değerleri kullanmayın. Aynı domain adına ikinci bir SPF TXT kaydı eklemeyin; varsa mevcut SPF içinde birleştirin. Web sitesinin A/CNAME ve nameserver ayarlarını değiştirmek gerekmez. [Zoho e-posta kurulumu](https://www.zoho.com/mail/help/adminconsole/email-hosting-setup.html)
6. Zoho'da kayıtları doğrulayın; iki kutunun ve `info` grubunun dışarıdan posta alabildiğini kontrol edin. DKIM'i etkinleştirin. DMARC'ı sağlayıcı panelinin önerdiği kayıtla kurup SPF/DKIM geçişlerini kontrol edin.

## 2. Web sitesi otomatik e-postaları: Zoho ZeptoMail

Zoho Mail'in yönetim panelindeki **Transactional Emails / ZeptoMail** alanını kullanın; hesabınızda bulunmuyorsa aynı Zoho hesabıyla [ZeptoMail](https://www.zoho.com/zeptomail/) açın. Bu servis web formu gibi işlemlere bağlı e-postalar içindir. [Zoho entegrasyon açıklaması](https://www.zoho.com/mail/help/adminconsole/transactional-email-integration.html)

1. Asır Solar için bir Agent oluşturun. Kullanım açıklaması olarak şunu yazabilirsiniz: “Our website contact form sends a confirmation email to the visitor and a notification to two company engineers. We do not send marketing or bulk email.”
2. Gönderen domaini `asirsolar.com` ekleyin. ZeptoMail'in verdiği **DKIM TXT** ve **return-path CNAME** kayıtlarını Vercel DNS'e ekleyin, doğrulayın. Zoho Mail'in MX kayıtları korunur. Hesap/işletme incelemesi istenirse tamamlayın. [Domain doğrulama](https://www.zoho.com/zeptomail/help/domains.html)
3. Agent içindeki **SMTP/API → SMTP** ekranından sunucu, kullanıcı ve SMTP parolasını alın. Genel örnek `smtp.zeptomail.com`, kullanıcı `emailapikey`, port `587`/TLS; **kendi hesabınızdaki sunucu değerini** kullanın. [SMTP ayarları](https://help.zoho.com/portal/en/kb/zeptomail/faqs/sending-emails/articles/how-to-configure-smtp)
4. Vercel → asirsolar projesi → **Settings → Environment Variables → Production** alanına aşağıdakileri girin. SMTP parolasını **Secret/Sensitive** olarak kaydedin; sohbete veya Git'e yazmayın.

| Değişken | Değer |
| --- | --- |
| `CRM_SMTP_HOST` | ZeptoMail SMTP ekranındaki sunucu |
| `CRM_SMTP_PORT` | `587` |
| `CRM_SMTP_USER` | ZeptoMail SMTP ekranındaki kullanıcı |
| `CRM_SMTP_PASSWORD` | Agent SMTP parolası — gizli |
| `CRM_EMAIL_FROM` | `Asır Solar <info@asirsolar.com>` |
| `CRM_EMAIL_REPLY_TO` | `info@asirsolar.com` |
| `CRM_EMAIL_ENABLED` | Doğrulama tamamlanınca `true` |
| `APP_ORIGIN` | `https://www.asirsolar.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.asirsolar.com` |

ZeptoMail kredili çalışır: bir kredi 10.000 alıcı e-postasıdır ve altı ay geçerlidir. Bir form üç e-posta tüketir. Paket fiyatını satın alma ekranında kontrol edin; 2026 fiyat değişikliği duyurulduğundan eski dolar fiyatları bu belgeye sabitlenmedi. [Güncel fiyatlandırma](https://www.zoho.com/zeptomail/pricing.html)

Müşteriye giden örnek metin:

> Merhaba,
>
> Asır Solar ile iletişime geçtiğiniz için teşekkür ederiz. Talebinizi aldık. Mühendislerimiz projenizi inceleyerek en kısa sürede sizinle iletişime geçecek.
>
> Talep numaranız: ASR-…
>
> Eklemek istediğiniz bir bilgi varsa bu e-postayı yanıtlayabilirsiniz.
>
> Saygılarımızla, Asır Solar Ekibi

Müşterinin e-postasında yönetim paneli bağlantısı veya mühendislerin özel bilgileri bulunmaz. Mühendislere giden e-postada form bilgileri, panel bağlantısı ve müşteriye doğrudan yanıt adresi vardır.

## 3. Telefon bildirimleri: Netgsm

1. [Netgsm](https://www.netgsm.com.tr/) üzerinden şirket adına **Toplu SMS / API** hizmeti için başvurun. Başvuru sırasında istenen şirket/yetkili doğrulamasını tamamlayın ve kullanımınıza uygun SMS bakiyesi alın.
2. Portalda **SMS Hizmeti → SMS Ayarları → Başlıklarım** bölümünden `ASIR SOLAR` gibi şirket başlığı için başvurun. Gönderimde sağlayıcının onayladığı başlık aynen kullanılmalıdır.
3. **Kullanıcı İşlemleri → API Talep İşlemleri** üzerinden API erişimini talep edin. **Abonelik İşlemleri → Alt Kullanıcı Hesapları** bölümünde web sitesi için ayrı API alt kullanıcısı oluşturun, gerekli SMS gönderim/rapor yetkilerini tanımlayın ve onayını bekleyin. [Netgsm API dokümanı](https://www.netgsm.com.tr/dokuman/), [alt kullanıcı kurulumu](https://bilgibankasi.netgsm.com.tr/abonelik-islemleri/diger-islemler/alt-kullanici-olusturma)
4. Vercel Production ortamına aşağıdaki değerleri ekleyin. Alt kullanıcı parolasını **Secret/Sensitive** olarak kaydedin.

| Değişken | Değer |
| --- | --- |
| `CRM_SMS_PROVIDER` | `netgsm` |
| `CRM_NETGSM_USERCODE` | Netgsm API alt kullanıcı kodu |
| `CRM_NETGSM_PASSWORD` | API alt kullanıcı parolası — gizli |
| `CRM_NETGSM_HEADER` | Onaylı SMS başlığının birebir aynısı |
| `CRM_SMS_ENABLED` | Hesap, API ve başlık hazır olunca `true` |

SMS alıcıları kodda tanımlıdır: Onur **0541 924 35 45**, Furkan **0543 118 58 61**. Müşteriye SMS gönderilmez.

Örnek: “Asır Solar: Mehmet Şahin, çatı projesi için sizinle iletişime geçmek istiyor. Talep: https://www.asirsolar.com/admin/talepler/…”

Ad ve proje türü SMS'tedir; müşterinin uzun açıklaması, telefonu ve e-postası paneldedir. Türkçe karakterler ve bağlantı nedeniyle bir bildirim birden fazla SMS parçası olarak ücretlendirilebilir; ilk gönderimde Netgsm raporundan kontrol edin.

## 4. Son adım: yeniden yayınla ve teslimatı kontrol et

Vercel ortam değişikliği mevcut dağıtımı değiştirmez: **Deployments → son Production dağıtımı → Redeploy** yapın. E-posta ve SMS bağımsız açılabilir; SMS hesabı beklenirken e-posta kullanılabilir.

Kendi erişiminiz olan müşteri e-posta adresiyle tek test formu doldurun. Panelde tek talep ve beş bildirim görünmeli. Müşterinin teşekkür e-postasını, iki mühendisin e-postalarını ve iki telefondaki SMS'i kontrol edin. E-posta yanıtının `info` grubu üzerinden her iki mühendise ulaştığını da doğrulayın. SMTP kabulü tek başına gelen kutusuna teslimat anlamına gelmez.

Eski bekletilmiş kayıtlar etkinleştirmeyle topluca gönderilmez. Geçmişte oluşturulan taleplere geriye dönük teşekkür e-postası eklenmez. Ayrıntılar: [Bildirim altyapısı](NOTIFICATION_SETUP.md).

Hesap açılışı, telefon doğrulaması, işletme onayı ve ödeme şirket yetkilisi tarafından tamamlanmalıdır. DNS kayıtlarının **ad/tür/değer** bilgilerini paylaşabilirsiniz; bunlar doğrulama için kullanılabilir. SMTP ve Netgsm parolaları yalnızca Vercel'in gizli değişken alanına girilmelidir.
