"use client";

const baseRecipes = [
  { name: "Mild", desc: "2 cups Southern & 2 cups liquid margarine." },
  { name: "Medium", desc: "3 cups Southern & 1 cup liquid margarine." },
];

const creativeRecipes = [
  { name: "Garlic-Q", desc: "1 cup Garlic & 1 cup BBQ." },
  { name: "Honey Garlic", desc: "2 cup Garlic and 1 tablespoon of honey." },
  { name: "Hot & Spicy Garlic", desc: "2 cups Garlic & 1 cup Hot. If you want it super spicy, replace Hot sauce with Nuclear." },
  { name: "Garlic Parmesan", desc: "Sprinkle Parmesan cheese over sauced wings." },
  { name: "Garlic Ranch Parmesan", desc: "1 cup Garlic Sauce and 1 Cup Ranch Dressing. Sprinkle Parmesan cheese over sauced wings." },
  { name: "Buttery Garlic", desc: "2 cups Garlic & 1 cup liquid margarine." },
  { name: "Honey BBQ", desc: "2 cups BBQ & 1 tablespoon of honey." },
  { name: "Mexican", desc: "1 cups Southern & 1 cup Nuclear." },
  { name: "Ranch", desc: "1 cup Ranch dressing & 1 cup BBQ." },
  { name: "Spicy Ranch", desc: "1 cup Ranch dressing & 1 cup Kamakaze." },
];

function RecipeCard({ name, desc, highlight = false }: { name: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`card ${highlight ? "card-solid border-[color:var(--color-rooster)]" : ""}`}>
      <div className="card-body">
        <div className="font-bold text-lg mb-2">{name}</div>
        <div className="text-base">{desc}</div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent mb-6 text-center">
        Sauce Recipes
      </h1>
      <p className="mb-8 inline-block px-4 py-2 rounded-full bg-[color:var(--color-maroon)]/10 text-[color:var(--color-rooster)] font-semibold text-lg text-center shadow-sm">
        Discover our favorite chicken wing sauce combinations! Multiply the amounts for larger batches.
      </p>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-center bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
          Base Recipes
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {baseRecipes.map((r) => (
            <RecipeCard key={r.name} name={r.name} desc={r.desc} highlight />
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-center bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
          Creative Favorites
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {creativeRecipes.map((r) => (
            <RecipeCard key={r.name} name={r.name} desc={r.desc} />
          ))}
        </div>
      </div>

      <p className="text-center" style={{ color: "var(--foreground)" }}>
        As for the other 5 chicken wing sauces, you’ll just have to come visit us in Sayre, Pennsylvania to try them.
      </p>
    </section>
  );
}