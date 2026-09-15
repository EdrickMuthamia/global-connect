import { MemberProfile } from "./member-profile";

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return <p className="py-20 text-center text-sm text-slate-400">Invalid member link.</p>;
  }
  return <MemberProfile userId={userId} />;
}
