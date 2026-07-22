import Link from 'next/link'

const modules = [
  ['Contact capture', '/contacts/new', 'Create customer records with address autocomplete.'],
  ['Contact directory', '/contacts', 'Review account-scoped contacts from Supabase.'],
  ['Tenant setup', '/admin/tenancies', 'Provision an account and owner with a secure password.'],
]

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">STREAMLINE</p>
      <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight">Recovered workflows, runnable as one focused CRM surface.</h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-300">
        This recovery turns the donor source into a buildable application while keeping customer exports,
        credentials, generated state, and agent-governance files outside the published tree.
      </p>
      <section className="mt-12 grid gap-5 md:grid-cols-3">
        {modules.map(([title, href, description]) => (
          <Link key={href} href={href} className="rounded-xl border border-slate-700 bg-slate-900/80 p-6 transition hover:border-sky-400">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
