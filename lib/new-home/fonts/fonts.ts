import { Cormorant_Garamond, Instrument_Serif } from "next/font/google";

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
});
