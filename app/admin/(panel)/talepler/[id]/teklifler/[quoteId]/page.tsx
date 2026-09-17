import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/crm/http";
import { getLead } from "@/lib/crm/repository";
import { getQuoteDetail, quoteCapabilities } from "@/lib/quotes/server";
import { QuoteEditor } from "@/components/admin/QuoteEditor";
import { CrmError } from "@/lib/crm/validation";
import "@/app/teklif/quote.css";
export default async function QuotePage({ params }: { params: Promise<{ id: string; quoteId: string }> }) {
  await requireAdminPage(); const { id, quoteId } = await params;
  let initial, lead;
  try {
    initial = await getQuoteDetail(quoteId);
    if (initial.quote.leadId !== id) notFound();
    lead = (await getLead(id)).lead;
  } catch (error) { if (error instanceof CrmError && error.status === 404) notFound(); throw error; }
  return <QuoteEditor key={quoteId} lead={lead} initial={initial} capabilities={quoteCapabilities()} />;
}
