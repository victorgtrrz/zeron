import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-accent">
      <div className="relative flex max-w-md flex-col items-center">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px w-6 bg-highlight" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-highlight">
            &#47;&#47; Error 404
          </span>
          <div className="h-px w-6 bg-highlight" />
        </div>

        <h1 className="mb-2 font-heading text-8xl tracking-wider sm:text-9xl">
          404
        </h1>

        <h2 className="mb-4 font-heading text-2xl tracking-wider sm:text-3xl">
          Page not found
        </h2>

        <div className="mb-6 h-px w-16 bg-highlight/50" />

        <p className="mb-10 max-w-sm text-sm leading-relaxed text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="border border-highlight bg-highlight/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent transition-all duration-300 hover:bg-highlight/20"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
