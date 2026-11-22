import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { daysRemaining, getDefaultTrialDays, SUPPORT_PHONE } from "@/lib/access";
import { setUserActive, addUserDays, addUserDaysForm, setDefaultTrialForm } from "./actions";
import { AutoRefresh } from "@/components/layout/AutoRefresh";

export const dynamic = "force-dynamic";

function StatusPill({ active, days }: { active: boolean; days: number }) {
  const ok = active && days > 0;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok
          ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20"
          : !active
          ? "bg-red-400/15 text-red-300 border border-red-400/20"
          : "bg-amber-400/15 text-amber-300 border border-amber-400/20"
      }`}
    >
      {!active ? "Yahagaritswe" : days > 0 ? "Irakora" : "Yarangiye"}
    </span>
  );
}

export default async function AdminUsersPage() {
  const [list, trial] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    getDefaultTrialDays(),
  ]);
  const students = list.filter((u) => u.role !== "admin");
  const activeCount = students.filter((u) => u.isActive && daysRemaining(u.accessExpiresAt) > 0).length;
  const expiredCount = students.length - activeCount;

  return (
    <div className="space-y-6">
      <AutoRefresh />

      {/* Header and stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Abakoresha (Users)</h1>
          <p className="mt-1 text-sm text-cyan-100/65">
            Genzura konti z&apos;abanyeshuri — gufungura/guhagarika no kongera iminsi. Telefoni y&apos;ubufasha: {SUPPORT_PHONE}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm sm:flex sm:gap-3">
          <div className="glass-soft rounded-xl px-3 py-2 sm:px-4">
            <div className="text-lg font-bold text-white">{students.length}</div>
            <div className="text-[11px] text-cyan-100/60">Bose</div>
          </div>
          <div className="glass-soft rounded-xl px-3 py-2 sm:px-4">
            <div className="text-lg font-bold text-emerald-300">{activeCount}</div>
            <div className="text-[11px] text-cyan-100/60">Bakora</div>
          </div>
          <div className="glass-soft rounded-xl px-3 py-2 sm:px-4">
            <div className="text-lg font-bold text-amber-300">{expiredCount}</div>
            <div className="text-[11px] text-cyan-100/60">Barangiye</div>
          </div>
        </div>
      </div>

      {/* Default trial setting */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-white">Iminsi y&apos;igeragezwa (Free trial)</h3>
          <p className="text-xs text-cyan-100/60">
            Iminsi buri konti nshya itangirana nayo (ubu: {trial}). Igihe ubitse, iyi minsi
            yongerwa kuri buri munyeshuri usanzwe uyifite munsi yayo (ntigabanya uyifite hejuru).
          </p>
        </div>
        <form action={setDefaultTrialForm} className="flex items-center gap-2 sm:shrink-0">
          <input
            name="days"
            type="number"
            min={0}
            defaultValue={trial}
            className="h-10 flex-1 sm:w-24 rounded-lg border border-cyan-400/20 bg-white/5 px-3 text-white outline-none focus:border-cyan-400/60"
          />
          <button
            type="submit"
            className="glow-btn h-10 shrink-0 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 px-5 text-sm font-semibold text-white active:scale-95 transition-transform"
          >
            Bika
          </button>
        </form>
      </div>

      {/* MOBILE VIEW: Responsive Cards (NO HORIZONTAL SCROLL) */}
      <div className="space-y-3 md:hidden">
        {students.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-cyan-100/50">
            Nta bakoresha baraboneka.
          </div>
        ) : (
          students.map((u) => {
            const days = daysRemaining(u.accessExpiresAt);
            return (
              <div key={u.id} className="glass space-y-3 rounded-2xl p-4">
                {/* User info & status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{u.name}</div>
                    <div className="truncate text-xs text-cyan-100/60">{u.email}</div>
                  </div>
                  <StatusPill active={!!u.isActive} days={days} />
                </div>

                {/* Days remaining & Expiration info */}
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-cyan-400/10 bg-white/[0.03] p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase text-cyan-100/50">Iminsi isigaye</span>
                    <span className="text-sm font-bold text-cyan-100">
                      {days} {days === 1 ? "umunsi" : "iminsi"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-cyan-100/50">Irangira</span>
                    <span className="font-medium text-cyan-100/80">
                      {u.accessExpiresAt ? new Date(u.accessExpiresAt).toLocaleDateString("en-GB") : "—"}
                    </span>
                  </div>
                </div>

                {/* Actions: Presets & Custom amount */}
                <div className="space-y-2 border-t border-cyan-400/10 pt-2.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-cyan-100/50">
                    Kongera / Kugabanya Iminsi
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <form action={addUserDays.bind(null, u.id, 2)} className="w-full">
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-cyan-400/15 bg-white/5 py-1.5 text-center text-xs font-semibold text-cyan-200 transition-all hover:bg-white/10 active:scale-95"
                      >
                        +2d
                      </button>
                    </form>
                    <form action={addUserDays.bind(null, u.id, 7)} className="w-full">
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-cyan-400/15 bg-white/5 py-1.5 text-center text-xs font-semibold text-cyan-200 transition-all hover:bg-white/10 active:scale-95"
                      >
                        +1w
                      </button>
                    </form>
                    <form action={addUserDays.bind(null, u.id, 30)} className="w-full">
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-cyan-400/15 bg-white/5 py-1.5 text-center text-xs font-semibold text-cyan-200 transition-all hover:bg-white/10 active:scale-95"
                      >
                        +1m
                      </button>
                    </form>
                    <form action={addUserDays.bind(null, u.id, -7)} className="w-full">
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-amber-400/20 bg-amber-500/10 py-1.5 text-center text-xs font-semibold text-amber-200 transition-all hover:bg-amber-500/20 active:scale-95"
                      >
                        -1w
                      </button>
                    </form>
                  </div>

                  {/* Custom days input & Deactivate/Activate button */}
                  <div className="flex items-center gap-2 pt-1">
                    <form action={addUserDaysForm.bind(null, u.id)} className="flex flex-1 items-center gap-1.5">
                      <input
                        name="days"
                        type="number"
                        placeholder="±iminsi"
                        className="h-8.5 min-w-0 flex-1 rounded-lg border border-cyan-400/20 bg-white/5 px-2.5 text-xs text-white outline-none focus:border-cyan-400/60"
                      />
                      <button
                        type="submit"
                        className="h-8.5 shrink-0 rounded-lg bg-cyan-500/20 px-3 text-xs font-semibold text-cyan-100 transition-all hover:bg-cyan-500/30 active:scale-95"
                      >
                        Ongera
                      </button>
                    </form>

                    <form action={setUserActive.bind(null, u.id, !u.isActive)} className="shrink-0">
                      <button
                        type="submit"
                        className={`h-8.5 rounded-lg px-3 text-xs font-semibold transition-all active:scale-95 ${
                          u.isActive
                            ? "border border-red-500/25 bg-red-500/15 text-red-300 hover:bg-red-500/25"
                            : "border border-emerald-500/25 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                        }`}
                      >
                        {u.isActive ? "Hagarika" : "Fungura"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW: Full Data Table (Medium & Large screens) */}
      <div className="glass hidden overflow-hidden rounded-2xl md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-cyan-100/60">
              <tr>
                <th className="px-4 py-3">Umukoresha</th>
                <th className="px-4 py-3">Imiterere</th>
                <th className="px-4 py-3">Iminsi isigaye</th>
                <th className="px-4 py-3">Irangira</th>
                <th className="px-4 py-3">Ibikorwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-400/10">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-cyan-100/50">
                    Nta bakoresha baraboneka.
                  </td>
                </tr>
              ) : (
                students.map((u) => {
                  const days = daysRemaining(u.accessExpiresAt);
                  return (
                    <tr key={u.id} className="align-top hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-cyan-100/55">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill active={!!u.isActive} days={days} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-cyan-100">{days}</td>
                      <td className="px-4 py-3 text-cyan-100/70">
                        {u.accessExpiresAt ? new Date(u.accessExpiresAt).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <form action={addUserDays.bind(null, u.id, 2)}>
                            <button
                              type="submit"
                              className="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-200 transition-colors hover:bg-white/10"
                            >
                              +2d
                            </button>
                          </form>
                          <form action={addUserDays.bind(null, u.id, 7)}>
                            <button
                              type="submit"
                              className="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-200 transition-colors hover:bg-white/10"
                            >
                              +1w
                            </button>
                          </form>
                          <form action={addUserDays.bind(null, u.id, 30)}>
                            <button
                              type="submit"
                              className="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-200 transition-colors hover:bg-white/10"
                            >
                              +1m
                            </button>
                          </form>
                          <form action={addUserDays.bind(null, u.id, -7)}>
                            <button
                              type="submit"
                              className="rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-200 transition-colors hover:bg-amber-500/20"
                            >
                              -1w
                            </button>
                          </form>
                          <form action={addUserDaysForm.bind(null, u.id)} className="flex items-center gap-1">
                            <input
                              name="days"
                              type="number"
                              placeholder="±"
                              className="h-7 w-14 rounded-md border border-cyan-400/20 bg-white/5 px-2 text-xs text-white outline-none focus:border-cyan-400/60"
                            />
                            <button
                              type="submit"
                              className="rounded-md bg-cyan-500/20 px-2 py-1 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/30"
                            >
                              Ongera
                            </button>
                          </form>
                          <form action={setUserActive.bind(null, u.id, !u.isActive)}>
                            <button
                              type="submit"
                              className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                                u.isActive
                                  ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
                                  : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                              }`}
                            >
                              {u.isActive ? "Hagarika" : "Fungura"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
