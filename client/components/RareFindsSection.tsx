import Image from "next/image";
import Link from "next/link";

// Server Component: Rare Finds section
// Uses images placed in public/rarefinds with original filenames.
// Clicking an item routes to the shop with the Rare Finds category filtered.
export function RareFindsSection() {
  // Tweak these constants to control the overall look.
  // To make images bigger inside the circle, reduce padding (e.g., p-2 -> p-1 -> p-0).
  // To make the circles themselves larger, increase the h-*/w-* classes.
  const MOBILE_CIRCLE = "h-28 w-28"; // e.g., change to "h-32 w-32" for bigger circles on mobile
  const DESKTOP_CIRCLE = "h-36 w-36 xl:h-40 xl:w-40"; // e.g., change to "h-40 w-40 xl:h-44 xl:w-44"
  const PADDING_MOBILE = "p-2"; // e.g., p-1 or p-0 to enlarge image inside the circle
  const PADDING_DESKTOP = "p-4"; // e.g., p-3 or p-2
  // Keep exact filenames (with spaces and casing) and derive labels from them
  const files = [
    "Sport memorabilia.jpeg",
    "Antiques.jpeg",
    "Board games.jpeg",
    "Manga and Comics.jpeg",
    "figurines.jpeg",
    "Funko.jpeg",
    "WallArt.jpeg",
  ] as const;

  const items = files.map((file) => {
    const name = file.replace(/\.[^/.]+$/, "");
    return {
      src: `/rarefinds/${file}`,
      label: name, // Display name exactly as file name without extension
      alt: name, // SEO-friendly alt text
    };
  });

  // Link to products page with Rare Finds category slug. The products page
  // performs robust matching by id/slug/name; "rare-finds" should map to
  // a category named "Rare Finds" if present.
  // Include a query fallback so that if the category doesn't exist yet,
  // the products page will still show relevant items via search.
  const targetHref = "/products?category=rare-finds&query=Rare%20Finds";

  return (
    <section aria-labelledby="rare-finds-heading" className="py-8 sm:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 id="rare-finds-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Discover rare finds
          </h2>
          <Link
            href={targetHref}
            className="hidden md:inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
            aria-label="View all Rare Finds products"
          >
            View all
          </Link>
        </div>

        {/* Responsive layout: horizontal scroll on mobile, grid on larger screens */}
        <div className="md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 md:gap-6 -mx-4 md:mx-0">
          {/* Mobile horizontal scroller */}
          <div className="md:hidden px-4">
            <div className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory" role="list">
              {items.map((item) => (
                <Link
                  key={item.src}
                  href={targetHref}
                  className="min-w-[116px] snap-start group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
                  aria-label={`Filter Rare Finds by ${item.label}`}
                >
                  <div className={`relative ${MOBILE_CIRCLE} rounded-full bg-gray-100 ring-1 ring-gray-200 shadow-sm grid place-items-center transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0`}>
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className={`object-contain ${PADDING_MOBILE} rounded-full`}
                      loading="lazy"
                      sizes="(max-width: 768px) 112px, 160px"
                    />
                  </div>
                  <div className="mt-2 text-center text-sm font-medium text-gray-900">
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop/Grid */}
          <div className="hidden md:contents" role="list">
            {items.map((item) => (
              <Link
                key={item.src}
                href={targetHref}
                className="group flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
                aria-label={`Filter Rare Finds by ${item.label}`}
              >
                <div className={`relative ${DESKTOP_CIRCLE} rounded-full bg-gray-100 ring-1 ring-gray-200 shadow-sm grid place-items-center transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:ring-blue-200 group-hover:shadow-md`}>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className={`object-contain ${PADDING_DESKTOP} rounded-full`}
                    loading="lazy"
                    sizes="160px"
                  />
                </div>
                <div className="mt-3 text-sm font-semibold text-gray-900">
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary CTA visible on mobile */}
        <div className="mt-6 md:hidden">
          <Link
            href={targetHref}
            className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all Rare Finds
          </Link>
        </div>
      </div>
    </section>
  );
}

export default RareFindsSection;
