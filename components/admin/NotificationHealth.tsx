import { getDatabase } from "@/lib/crm/database";
import { emailConfigured, emailEnabled, smsConfigured, smsEnabled } from "@/lib/crm/notifications.server";
import { formatDate } from "@/lib/crm/types";

export async function NotificationHealth() {
  const worker = await getDatabase().prepare("SELECT last_finished_at AS finishedAt,last_error AS error,(EXTRACT(EPOCH FROM now())*1000-last_finished_at < 300000) AS recent FROM notification_worker WHERE id='worker'").get() as { finishedAt: number | null; error: string | null; recent: boolean } | undefined;
  const recent = !!worker?.recent;
  return <section className="crm-panel crm-settings-card" style={{ marginTop: 24 }}>
    <h2>Otomatik bildirim bağlantıları</h2>
    {[{ name: "İki mühendise e-posta", configured: emailConfigured(), enabled: emailEnabled() }, { name: "İki mühendise SMS", configured: smsConfigured(), enabled: smsEnabled() }].map(channel => <div className="crm-connection" key={channel.name}>
      <span>{channel.name}</span><strong data-pending={!channel.enabled}>{channel.enabled ? "Gönderim etkin" : channel.configured ? "Bağlantı tanımlı, gönderim kapalı" : "Sağlayıcı bağlantısı bekliyor"}</strong>
      <p>{channel.enabled ? "Gerçek teslimatı müşteri kaydındaki bildirimlerden ve alıcıdan doğrulayın." : "Talepler kaydedilir. Bekletilen bildirimler bağlantı açılınca topluca gönderilmez; kayıt üzerinden tek tek başlatılabilir."}</p>
    </div>)}
    <div className="crm-connection"><span>Otomatik tekrar ve teslim kontrolü</span><strong data-pending={!recent || !!worker?.error}>{recent && !worker?.error ? "Son 5 dakika içinde çalıştı" : "Çalışma kontrolü gerekli"}</strong><p>Son çalışma: {worker?.finishedAt ? formatDate(new Date(worker.finishedAt).toISOString(), true) : "Henüz yok"}. Geçici hatalar zamanlanmış görevle tekrar ele alınır.</p></div>
  </section>;
}
