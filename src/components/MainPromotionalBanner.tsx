import React, { useEffect, useState } from 'react';

export const MainPromotionalBanner: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const assetUrl = `${import.meta.env.BASE_URL}assets/kasuwar-kanawa-redmi-banner.webp.b64`;

    fetch(assetUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Banner asset could not be loaded');
        return response.text();
      })
      .then((encoded) => {
        if (active) setImageSrc(`data:image/webp;base64,${encoded.trim()}`);
      })
      .catch((error) => {
        console.error('Promotional banner load failed:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      aria-label="Kasuwar Kanawa featured promotional advertisement"
      className="mx-auto my-4 w-full max-w-7xl px-3 sm:px-6"
    >
      <a
        href="#all-products-section"
        aria-label="Shop products on Kasuwar Kanawa"
        className="group block overflow-hidden rounded-2xl border border-pink-100 bg-pink-50 shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Kasuwar Kanawa promotion: Redmi Note 12 — powerful, stylish and affordable"
            className="block h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            width="520"
            height="218"
            fetchPriority="high"
          />
        ) : (
          <div className="flex aspect-[520/218] w-full items-center justify-center bg-gradient-to-r from-pink-600 via-fuchsia-600 to-indigo-900 px-4 text-center text-white">
            <span className="text-lg font-black sm:text-2xl">Kasuwar Kanawa — Arewa Sai Dan Arewa</span>
          </div>
        )}
      </a>
    </section>
  );
};
