import { AdminConsole } from "./admin-console";

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "overview";
  return <AdminConsole initialTab={tab} />;
}
