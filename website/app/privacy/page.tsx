import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy | No LLM Sites",
  description: "Privacy Policy for the No LLM Sites Chrome extension.",
};

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <a className="flex items-center gap-2" href="/">
            <Image src="/icon-128.png" alt="No LLM Sites icon" width={28} height={28} />
            <span className="font-semibold tracking-tight">No LLM Sites</span>
          </a>
          <a href="/" className="text-sm font-medium text-muted transition-colors hover:text-accent">
            Back to home
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20 sm:py-28">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">
          No LLM Sites
        </p>
        <h1 className="text-[clamp(32px,6vw,52px)] font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted">Effective July 14, 2026</p>

        <div className="mt-12 max-w-2xl space-y-10 text-[16px] leading-7 text-muted">
          <p>
            No LLM Sites is a Chrome extension designed to block selected LLM websites and display a quieter alternative page. This policy explains what the extension stores, requests, and does not collect.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Information stored locally</h2>
            <p className="mt-3">Your custom blocklist is stored locally in Chrome extension storage. It is used only to create the redirect rules for websites you choose to block.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Information we do not collect</h2>
            <p className="mt-3">No LLM Sites does not create accounts, collect names or email addresses, read browsing history, inspect page content, capture form entries, or transmit your blocklist to the developer.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Network requests on blocked pages</h2>
            <p className="mt-3">When a blocked page is shown, the gallery may request public-domain artwork metadata and images from the Art Institute of Chicago and The Metropolitan Museum of Art. The optional radio player connects directly to Radio Swiss Classic when you choose to play it. Those services may receive standard technical information associated with a web request, such as your IP address, under their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Permissions</h2>
            <p className="mt-3">The extension uses Chrome’s declarative network request permission only to redirect websites on the default or user-created blocklist. Its storage permission is used only for the local blocklist. It does not inject scripts into unrelated pages or collect their contents.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Changes to this policy</h2>
            <p className="mt-3">If this policy changes materially, the updated version will be posted here with a new effective date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Questions</h2>
            <p className="mt-3">For questions about this policy, please use the support contact listed on the No LLM Sites Chrome Web Store page.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>No LLM Sites — a Chrome extension.</p>
          <a href="/privacy" aria-current="page" className="font-medium underline underline-offset-4">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
