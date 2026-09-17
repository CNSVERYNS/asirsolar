import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { readPublicQuote } from "@/lib/quotes/server";
import { CrmError } from "@/lib/crm/validation";
import { clientBucket, limit } from "@/lib/crm/http";
import { QuoteCustomer } from "@/components/quotes/QuoteCustomer";
export const dynamic = "force-dynamic";
export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await limit(`quote-page:${clientBucket(new Request("https://www.asirsolar.com", { headers: await headers() }))}`, 300, 900);
  let initial;
  try { initial = await readPublicQuote(token); }
  catch (error) { if (error instanceof CrmError && error.status === 404) notFound(); throw error; }
  return <QuoteCustomer initial={initial} token={token} />;
}
