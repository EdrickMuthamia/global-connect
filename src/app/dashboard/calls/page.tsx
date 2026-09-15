import { CallsClient } from "./calls-client";

export default async function CallsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const id = Number(sp.incoming ?? sp.outgoing);
  return <CallsClient activeCallId={Number.isInteger(id) && id > 0 ? id : null} />;
}
