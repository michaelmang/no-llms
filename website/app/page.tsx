import Image from "next/image";

const blockedSites = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Copilot",
  "Perplexity",
  "Poe",
  "Grok",
  "DeepSeek",
];

const steps = [
  {
    title: "Enable protection",
    body: "Click Enable protection in the extension popup. Chrome asks for access only to the sites on the default blocklist.",
  },
  {
    title: "Customize the blocklist",
    body: "Add any domain, enable the reviewed LLM/chat collection, and choose whether related subdomains are included.",
  },
  {
    title: "Set your focus hours",
    body: "Block during the weekday hours you choose, then let the rules pause automatically for evenings and weekends.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <Image src="/icon-128.png" alt="No LLM Sites icon" width={28} height={28} />
            <span className="font-semibold tracking-tight">No LLM Sites</span>
          </div>
          <a
            href="https://github.com/michaelmang/no-llms"
            className="text-sm font-medium text-muted transition-colors hover:text-accent"
          >
            View on GitHub
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pb-20 pt-20 sm:pt-28">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">
            Chrome extension
          </p>
          <h1 className="max-w-xl text-[clamp(32px,6vw,52px)] leading-[1.05] font-semibold tracking-tight">
            Block LLM sites. See art instead.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-7 text-muted">
            No LLM Sites blocks ChatGPT, Claude, Gemini, and other AI chat
            websites in Chrome, redirecting you to a gallery of public-domain
            art from the Art Institute of Chicago and the Met.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="https://github.com/michaelmang/no-llms"
              className="flex h-12 items-center justify-center rounded-full bg-accent px-6 font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get the extension
            </a>
            <a
              href="#how-it-works"
              className="flex h-12 items-center justify-center rounded-full border border-border px-6 font-medium transition-colors hover:bg-black/[.03]"
            >
              How it works
            </a>
          </div>
        </section>

        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-accent">
              Ready to block
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {blockedSites.map((site) => (
                <span
                  key={site}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted"
                >
                  {site}
                </span>
              ))}
              <span className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted">
                + a reviewed LLM/chat collection
              </span>
              <p className="w-full pt-2 text-[15px] leading-6 text-muted">
                The default list becomes active only when you click Enable protection. Add a focus schedule, related subdomains, or the optional community-maintained LLM/chat collection whenever you need them.
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-accent">
            How it works
          </h2>
          <ol className="mt-6 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-accent">
              A quieter corner
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-6 text-muted">
              Instead of a dead end, blocked pages open onto rotating
              public-domain works of art.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <Image
                src="/art-1.jpg"
                alt="Public-domain artwork sample"
                width={300}
                height={300}
                className="aspect-square rounded-xl object-cover"
              />
              <Image
                src="/art-4.jpg"
                alt="Public-domain artwork sample"
                width={300}
                height={300}
                className="aspect-square rounded-xl object-cover"
              />
              <Image
                src="/art-9.jpg"
                alt="Public-domain artwork sample"
                width={300}
                height={300}
                className="aspect-square rounded-xl object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted">
            <strong className="text-foreground">Scope: </strong>
            this is a browser-level blocker. Anyone with access to Chrome can
            disable or remove the extension. For an enforced restriction,
            install it via enterprise Chrome policies, or block it at the
            DNS/firewall level.
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>No LLM Sites — a Chrome extension.</p>
          <div className="flex items-center gap-4">
            <p>Artworks from public-domain museum collections.</p>
            <a href="/privacy" className="font-medium underline underline-offset-4 transition-colors hover:text-accent">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
