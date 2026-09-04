import { promises as fs } from "node:fs";
import path from "node:path";

export interface RegistryFile {
  path: string;
  type: string;
  target?: string;
  content?: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  category: string;
}

export interface Registry {
  name: string;
  homepage: string;
  items: RegistryItem[];
  categories: { id: string; items: RegistryItem[] }[];
}

const ROOT = process.cwd();

function categoryOf(includePath: string): string {
  const parts = includePath.split("/");
  // registry/zbanx/<category>/registry.json
  return parts[2] ?? "misc";
}

export async function getRegistry(): Promise<Registry> {
  const rootRaw = await fs.readFile(path.join(ROOT, "registry.json"), "utf8");
  const root = JSON.parse(rootRaw) as {
    name: string;
    homepage: string;
    include?: string[];
    items?: unknown[];
  };

  const items: RegistryItem[] = [];
  for (const inc of root.include ?? []) {
    const category = categoryOf(inc);
    const shardDir = path.join(ROOT, path.dirname(inc));
    const shardRaw = await fs.readFile(path.join(ROOT, inc), "utf8");
    const shard = JSON.parse(shardRaw) as { items: RegistryItem[] };
    for (const item of shard.items ?? []) {
      const files: RegistryFile[] = [];
      for (const f of item.files ?? []) {
        // file path is relative to the shard registry.json
        const abs = path.join(shardDir, f.path);
        let content: string | undefined;
        try {
          content = await fs.readFile(abs, "utf8");
        } catch {
          content = undefined;
        }
        files.push({ ...f, content });
      }
      items.push({ ...item, files, category });
    }
  }

  const categories = [...new Set(items.map((i) => i.category))].map((id) => ({
    id,
    items: items.filter((i) => i.category === id),
  }));

  return { name: root.name, homepage: root.homepage, items, categories };
}

export async function getRegistryItem(
  name: string
): Promise<RegistryItem | null> {
  const registry = await getRegistry();
  return registry.items.find((i) => i.name === name) ?? null;
}
