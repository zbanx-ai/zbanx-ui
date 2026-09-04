import Link from "next/link";
import { getRegistry } from "@/lib/registry";

export default async function Home() {
  const registry = await getRegistry();

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-bold text-3xl tracking-tight">{registry.name}</h1>
        <p className="text-muted-foreground">
          {registry.items.length} components across {registry.categories.length}{" "}
          categories. Install with the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">shadcn</code>{" "}
          CLI from GitHub — no deploy required.
        </p>
        <div className="flex flex-wrap gap-2">
          <code className="rounded-md border bg-muted/50 px-3 py-1.5 text-sm">
            bunx --bun shadcn@latest add
            zbanx-ai/zbanx-ui/&lt;name&gt;
          </code>
          <a
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            href={registry.homepage}
            rel="noreferrer"
            target="_blank"
          >
            {registry.homepage}
          </a>
        </div>
      </header>

      <main className="flex flex-col gap-10">
        {registry.categories.map((group) => (
          <section key={group.id} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-xl">{group.id}</h2>
              <span className="text-muted-foreground text-sm">
                {group.items.length} items
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <li
                  key={item.name}
                  className="flex flex-col gap-1 rounded-lg border p-4 hover:bg-muted/50"
                >
                  <Link
                    className="font-medium hover:underline"
                    href={`/preview/${item.name}`}
                  >
                    {item.title}
                  </Link>
                  <p className="line-clamp-2 text-muted-foreground text-sm">
                    {item.description}
                  </p>
                  <span className="mt-1 font-mono text-muted-foreground text-xs">
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
