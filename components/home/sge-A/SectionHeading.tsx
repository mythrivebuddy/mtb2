import { cormorant, instrument } from "@/lib/new-home/fonts/fonts";
import { theme } from "@/lib/new-home/theme/theme";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle?: string;
  isSingleLine?: boolean;
};
export  const SectionHeading = ({
  eyebrow,
  title,
  highlight,
  isSingleLine = false,
  subtitle,
}: SectionHeadingProps) => (
  <div className="text-center mb-10 sm:mb-16 max-w-6xl mx-auto">
    <div className="flex items-center justify-center gap-4 mb-3 sm:mb-6">
      <div className={"h-px " + theme.highLightBgColor + "  w-[750px]"}></div>
      <span
        className={
          theme.highLightTextColor +
          " text-base sm:text-[24px] uppercase whitespace-nowrap"
        }
      >
        {eyebrow}
      </span>
      <div className={theme.highLightBgColor + " h-px w-[750px]"}></div>
    </div>
    <div
      className={`max-w-5xl  text-center flex flex-col items-center mx-auto`}
    >
      <h2
        className={`${instrument.className} text-[24px] sm:text-5xl ${cormorant.className} text-center  font-medium  mb-3 sm:mb-6`}
      >
        {title}
        {isSingleLine ? null : <br />}{" "}
        <span
          className={`${cormorant.className} italic ${theme.highLightTextColor}`}
        >
          {highlight}
        </span>
      </h2>
      <div className="max-w-lg">
        {subtitle && <p className="text-xs sm:text-base">{subtitle}</p>}
      </div>
    </div>
  </div>
);
