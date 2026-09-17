import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/crm/http";
import { getLead } from "@/lib/crm/repository";
import { getQuoteDetail, quoteCapabilities } from "@/lib/quotes/server";
import { QuoteEditor } from "@/components/admin/QuoteEditor";
import { CrmError } from "@/lib/crm/validation";
import "@/app/teklif/quote.css";
export default async function NewQuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ revisionOf?: string }> }) {
  await requireAdminPage();
  const { id } = await params, { revisionOf } = await searchParams;
  let lead, revision;
  try {
    lead = (await getLead(id)).lead;
    revision = typeof revisionOf === "string" ? (await getQuoteDetail(revisionOf)).quote : undefined;
    if (revision && revision.leadId !== id) notFound();
  } catch (error) { if (error instanceof CrmError && error.status === 404) notFound(); throw error; }
  return <QuoteEditor key={revisionOf || "new"} lead={lead} revision={revision} capabilities={quoteCapabilities()} />;
}
