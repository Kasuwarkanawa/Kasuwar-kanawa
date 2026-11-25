import React from 'react';
import { Smartphone, Headphones, Shirt, Sparkles, Flame, Home, UtensilsCrossed, Watch, Grid, Building } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { db } from '../db/database';

interface CategoriesSectionProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  products: import('../types').Product[];
}

const ICON_MAP: Record<string, React.ElementType> = { Smartphone, Headphones, Shirt, Sparkles, Flame, Home, UtensilsCrossed, Watch, Building };
const PALETTES = [
  'bg-sky-100 text-sky-700','bg-pink-100 text-pink-700','bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700','bg-orange-100 text-orange-700','bg-cyan-100 text-cyan-700','bg-rose-100 text-rose-700'
];

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({ selectedCategory, onSelectCategory }) => {
  const liveCategories = db.getCategories();
  const allCategories = liveCategories.length > 0 ? liveCategories : CATEGORIES;
  return (
    <section id="categories-section" className="mx-auto my-5 w-full max-w-7xl px-3 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">Shop by Category</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Browse products from Kano and across Arewa</p>
        </div>
        <button onClick={() => onSelectCategory('all')} className="text-xs font-bold text-emerald-700">See All →</button>
      </div>
      <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {allCategories.map((cat, index) => {
          const Icon = ICON_MAP[cat.iconName] || Smartphone;
          const selected = selectedCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => onSelectCategory(selected ? 'all' : cat.id)} className="group flex min-w-0 flex-col items-center text-center">
              <span className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full shadow-sm ring-1 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md sm:h-16 sm:w-16 ${PALETTES[index % PALETTES.length]} ${selected ? 'outline outline-2 outline-offset-2 outline-emerald-600' : ''}`}>
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.8} />
              </span>
              <span className={`max-w-full text-[10px] font-bold leading-tight sm:text-xs ${selected ? 'text-emerald-700' : 'text-slate-800'}`}>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
