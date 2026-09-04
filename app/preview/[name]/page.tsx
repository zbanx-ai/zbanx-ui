import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegistry, getRegistryItem } from "@/lib/registry";

export async function generateStaticParams() {
  const registry = await getRegistry();
  return registry.items.map((item) => ({ name: item.name }));
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const item = await getRegistryItem(name);
  if (!item) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <nav className="text-muted-foreground text-sm">
        <Link className="hover:underline" href="/">
          {item.category}
        </Link>{" "}
        / <span className="text-foreground">{item.name}</span>
      </nav>

      <header className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">{item.title}</h1>
        <p className="text-muted-foreground">{item.description}</p>
        <span className="font-mono text-muted-foreground text-xs">
          {item.type}
        </span>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Install</h2>
        <code className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
          bunx --bun shadcn@latest add github.com/zbanx-ai/zbanx-ui/{item.name}
        </code>
        <code className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
          bunx --bun shadcn@latest add @zbanx/{item.name}
        </code>
        <p className="text-muted-foreground text-sm">
          Namespace form requires{" "}
          <code className="rounded bg-muted px-1 text-xs">
            {'"@zbanx": "https://zbanx-ai.github.io/zbanx-ui/r/{name}.json"'}
          </code>{" "}
          in the consumer&apos;s components.json.
        </p>
      </section>

      {(item.dependencies?.length ?? 0) > 0 ||
      (item.registryDependencies?.length ?? 0) > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg">Dependencies</h2>
          {item.dependencies && item.dependencies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.dependencies.map((d) => (
                <span
                  key={d}
                  className="rounded-full border px-2.5 py-0.5 font-mono text-xs"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
          {item.registryDependencies &&
            item.registryDependencies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.registryDependencies.map((d) => (
                  <Link
                    key={d}
                    className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs hover:underline"
                    href={`/preview/${d}`}
                  >
                    {d}
                  </Link>
                ))}
              </div>
            )}
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Files ({item.files.length})</h2>
        {item.files.map((f) => (
          <div key={f.path} className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm">{f.path}</span>
              {f.target && (
                <span className="font-mono text-muted-foreground text-xs">
                  → {f.target}
                </span>
              )}
            </div>
            {f.content != null ? (
              <pre className="max-h-[480px] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
                {f.content}
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm">
                Source not available for preview.
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
