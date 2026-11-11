import React from 'react';
import {
  Smartphone,
  Headphones,
  Shirt,
  Sparkles,
  Flame,
  Home,
  UtensilsCrossed,
  Watch,
  Grid,
  Building,
} from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { db } from '../db/database';

interface CategoriesSectionProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone,
  Headphones,
  Shirt,
  Sparkles,
  Flame,
  Home,
  UtensilsCrossed,
  Watch,
  Building,
};

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const liveCategories = db.getCategories();
  const displayCategories = liveCategories.length > 0 ? liveCategories : CATEGORIES;
  return (
    <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 my-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#E6007E] rounded-full inline-block" />
            <h2 className="text-xl sm:text-2xl font-black text-[#0B172E] tracking-tight">
              Product Categories
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 ml-4.5">
            Rukunin Kayayyakin Kasuwar Kano
          </p>
        </div>

        {selectedCategory && selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs font-bold text-[#E6007E] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Show All Categories</span>
          </button>
        )}
      </div>

      {/* Categories Grid (4 cols on mobile/tablet, 8 on desktop or 2 rows) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {displayCategories.map((cat) => {
          const Icon = ICON_MAP[cat.iconName] || Smartphone;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.id)}
              className={`group p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-pink-50 to-pink-100/60 border-[#E6007E] shadow-md ring-2 ring-[#E6007E]/30 scale-102'
                  : 'bg-white border-slate-200/80 hover:border-pink-300 hover:shadow-sm'
              }`}
            >
              {/* Category Icon Capsule */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${
                  isSelected
                    ? 'bg-[#E6007E] text-white shadow-sm'
                    : 'bg-pink-50 text-[#E6007E] group-hover:bg-[#E6007E] group-hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Title & Hausa subtitle */}
              <span
                className={`text-xs font-bold leading-tight line-clamp-2 ${
                  isSelected ? 'text-[#E6007E]' : 'text-slate-800'
                }`}
              >
                {cat.name}
              </span>

              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                {cat.itemCount} Items
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
