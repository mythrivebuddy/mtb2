// import React from "react";
// import { Heart, ShoppingCart } from "lucide-react";
// import Link from "next/link";
// import Image from "next/image";
// import { Item, WishlistItem } from "@/types/client/store";

// const CURRENCY_SYMBOLS: Record<string, string> = {
//   INR: "₹",
//   USD: "$",
//   GP: "GP",
// };

// const getCurrencySymbol = (currency?: string): string =>
//   CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

// // ─── SVG Icons ─────────────────────────────────────────────────────────────────
// const RupeeIcon = ({ className }: { className?: string }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M6 3h12" /><path d="M6 8h12" /><path d="M6 13l8.5 8" /><path d="M6 13h3a4 4 0 0 0 0-8" />
//   </svg>
// );

// const DollarIcon = ({ className }: { className?: string }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
//   </svg>
// );

// const GPIcon = ({ className }: { className?: string }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M15 9h-3.5a2.5 2.5 0 1 0 0 5h2a2.5 2.5 0 1 1 0 5H9" />
//   </svg>
// );

// const CurrencyBadge = ({ currency }: { currency: string }) => {
//   const badgeClass =
//     currency === "GP"
//       ? "bg-purple-100 text-purple-700"
//       : currency === "INR"
//       ? "bg-orange-100 text-orange-700"
//       : "bg-green-100 text-green-700";

//   return (
//     <span className={`absolute -top-2 -left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${badgeClass}`}>
//       {currency === "GP" ? (
//         <GPIcon className="w-2.5 h-2.5" />
//       ) : currency === "INR" ? (
//         <RupeeIcon className="w-2.5 h-2.5" />
//       ) : (
//         <DollarIcon className="w-2.5 h-2.5" />
//       )}
//       {currency}
//     </span>
//   );
// };

// interface WishlistSectionProps {
//   wishlist: WishlistItem[];
//   getPriceForMembership: (item: Item) => number;
//   getCurrencySymbol?: (currency?: string) => string;
//   handleAddToCart: (itemId: string) => void;
// }

// const WishlistSection: React.FC<WishlistSectionProps> = ({
//   wishlist,
//   getPriceForMembership,
//   getCurrencySymbol: getCurrencySymbolProp,
//   handleAddToCart,
// }) => {
//   const resolveCurrencySymbol = getCurrencySymbolProp ?? getCurrencySymbol;

//   const formatPrice = (price: number, currency: string) =>
//     currency === "GP"
//       ? `${Math.ceil(price)} GP`
//       : `${resolveCurrencySymbol(currency)}${Number(price).toFixed(2)}`;

//   return (
//     <div className="bg-white shadow-lg rounded-xl p-6 col-span-2">
//       <h3 className="text-xl font-bold mb-4 flex items-center">
//         <Heart className="w-5 h-5 mr-2 text-pink-500" />
//         My Wishlist
//       </h3>

//       {!wishlist.length ? (
//         <div className="text-center py-3">
//           <Heart className="w-8 h-8 mx-auto text-gray-300 mb-2" />
//           <p className="text-gray-500 mb-3 text-sm">Your wishlist is empty</p>
//           <Link
//             href="/dashboard/store"
//             className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-full transition"
//           >
//             Browse Store
//           </Link>
//         </div>
//       ) : (
//         <ul className="space-y-5">
//           {wishlist.map(({ item }) => {
//             if (!item) return null;
//             const itemCurrency = (item as Item & { currency?: string }).currency ?? "INR";
//             const price = getPriceForMembership(item);

//             return (
//               <li
//                 key={item.id}
//                 className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-lg"
//               >
//                 <div className="flex gap-4 items-center">
//                   <div className="relative">
//                     <Image
//                       src={item.imageUrl || "/placeholder-image.jpg"}
//                       alt={item.name}
//                       width={64}
//                       height={64}
//                       className="rounded-md object-cover"
//                     />
//                     <CurrencyBadge currency={itemCurrency} />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold">{item.name}</h4>
//                     <p className={`font-bold ${itemCurrency === "GP" ? "text-purple-600" : "text-green-600"}`}>
//                       {formatPrice(price, itemCurrency)}
//                     </p>
//                     {item.category && (
//                       <p className="text-sm text-gray-500">{item.category.name}</p>
//                     )}
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => handleAddToCart(item.id)}
//                   className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-full transition self-start sm:self-center"
//                 >
//                   <ShoppingCart className="w-4 h-4" />
//                   Add to Cart
//                 </button>
//               </li>
//             );
//           })}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default WishlistSection;


import React from "react";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Item, WishlistItem } from "@/types/client/store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GP: "GP",
};

const getCurrencySymbol = (currency?: string): string =>
  CURRENCY_SYMBOLS[currency ?? "INR"] ?? "₹";

const RupeeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const GPIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12" />
    <path d="M15 9h-3.5a2.5 2.5 0 1 0 0 5h2a2.5 2.5 0 1 1 0 5H9" />
  </svg>
);

const CurrencyBadge = ({ currency }: { currency: string }) => {
  const badgeClass =
    currency === "GP"
      ? "bg-purple-100 text-purple-700"
      : currency === "INR"
      ? "bg-orange-100 text-orange-700"
      : "bg-green-100 text-green-700";

  return (
    <span className={`absolute -top-2 -left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded ${badgeClass}`}>
      {currency === "GP" ? (
        <GPIcon className="w-2.5 h-2.5" />
      ) : currency === "INR" ? (
        <RupeeIcon className="w-2.5 h-2.5" />
      ) : (
        <DollarIcon className="w-2.5 h-2.5" />
      )}
      {currency}
    </span>
  );
};

interface WishlistSectionProps {
  wishlist: WishlistItem[];
  getPriceForMembership: (item: Item) => number;
  getCurrencySymbol?: (currency?: string) => string;
  handleAddToCart: (itemId: string) => void;
}

const WishlistSection: React.FC<WishlistSectionProps> = ({
  wishlist,
  getPriceForMembership,
  getCurrencySymbol: getCurrencySymbolProp,
  handleAddToCart,
}) => {
  const resolveCurrencySymbol = getCurrencySymbolProp ?? getCurrencySymbol;

  const formatPrice = (price: number, currency: string) =>
    currency === "GP"
      ? `${Math.ceil(price)} GP`
      : `${resolveCurrencySymbol(currency)}${Number(price).toFixed(2)}`;

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 col-span-2">
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <Heart className="w-5 h-5 mr-2 text-pink-500" />
        My Wishlist
      </h3>

      {!wishlist.length ? (
        <div className="text-center py-6">
          <Heart className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>

          <Link
            href="/dashboard/store"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-md transition"
          >
            Browse Store
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {wishlist.map(({ item }) => {
            if (!item) return null;

            const itemCurrency = (item as Item & { currency?: string }).currency ?? "INR";
            const price = getPriceForMembership(item);

            return (
              <li
                key={item.id}
                className="flex justify-between items-center border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={item.imageUrl || "/placeholder-image.jpg"}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                    />
                    <CurrencyBadge currency={itemCurrency} />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>

                    <p className={`font-semibold ${itemCurrency === "GP" ? "text-purple-600" : "text-green-600"}`}>
                      {formatPrice(price, itemCurrency)}
                    </p>

                    {item.category && (
                      <p className="text-sm text-gray-500">{item.category.name}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(item.id)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-md transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default WishlistSection;