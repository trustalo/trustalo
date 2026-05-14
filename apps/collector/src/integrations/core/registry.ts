import type { IntegrationProvider, ProviderCategory } from "./types.js";

class ProviderRegistry {
  private providers = new Map<string, IntegrationProvider>();

  register(slug: string, provider: IntegrationProvider): void {
    if (this.providers.has(slug)) {
      throw new Error(`Provider '${slug}' is already registered`);
    }
    this.providers.set(slug, provider);
    console.log(
      `[registry] registered provider: ${slug} v${provider.version} (${provider.category})`,
    );
  }

  get(slug: string): IntegrationProvider | undefined {
    return this.providers.get(slug);
  }

  getAll(): Map<string, IntegrationProvider> {
    return new Map(this.providers);
  }

  getByCategory(category: ProviderCategory): IntegrationProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.category === category);
  }

  getCatalog(): Record<ProviderCategory, IntegrationProvider[]> {
    const catalog: Record<string, IntegrationProvider[]> = {};
    for (const provider of this.providers.values()) {
      const cat = provider.category;
      if (!catalog[cat]) catalog[cat] = [];
      catalog[cat]!.push(provider);
    }
    return catalog as Record<ProviderCategory, IntegrationProvider[]>;
  }

  has(slug: string): boolean {
    return this.providers.has(slug);
  }

  get size(): number {
    return this.providers.size;
  }
}

export const providerRegistry = new ProviderRegistry();
