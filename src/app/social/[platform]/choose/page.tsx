import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { isSocialPlatform, SOCIAL_PLATFORM_LABELS, type ConnectableAccount } from "@/lib/social";
import { confirmSocialAccount } from "./actions";

const PENDING_COOKIE = "social_oauth_pending";

export default async function ChooseAccountPage({ params }: { params: Promise<{ platform: string }> }) {
  const { platform: platformParam } = await params;
  if (!isSocialPlatform(platformParam)) redirect("/dashboard/redes-sociales?error=unknown_platform");
  const platform = platformParam;

  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get(PENDING_COOKIE)?.value;
  if (!pendingCookie) redirect("/dashboard/redes-sociales?error=oauth_failed");

  let pending: { businessId: string; platform: string; accounts: ConnectableAccount[] };
  try {
    pending = JSON.parse(pendingCookie);
  } catch {
    redirect("/dashboard/redes-sociales?error=oauth_failed");
  }
  if (pending.platform !== platform) redirect("/dashboard/redes-sociales?error=oauth_failed");

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <PageHeader
        title={`Conectar ${SOCIAL_PLATFORM_LABELS[platform]}`}
        description="Elige qué cuenta quieres conectar a Frames."
      />
      <form action={confirmSocialAccount} className="flex flex-col gap-3">
        {pending.accounts.map((account, index) => (
          <label
            key={account.externalAccountId}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 has-[:checked]:border-zinc-950"
          >
            <input type="radio" name="accountIndex" value={index} defaultChecked={index === 0} className="h-4 w-4" />
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={account.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="h-10 w-10 rounded-full bg-zinc-200" />
            )}
            <span className="text-sm font-medium text-zinc-800">{account.name}</span>
          </label>
        ))}
        <Button type="submit" className="mt-2">
          Confirmar
        </Button>
      </form>
    </div>
  );
}
