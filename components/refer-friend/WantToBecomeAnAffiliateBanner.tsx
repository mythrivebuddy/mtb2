import { Star } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export default function WantToBecomeAnAffiliateBanner() {
  return (
    <section className="flex items-center justify-between gap-4 flex-wrap rounded-lg border border-blue-200 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-gray-800 dark:text-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Star className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium ">Want to become an affiliate?</p>
          <p className="text-xs ">
            Earn rewards by referring users and growing the platform.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="max-sm:w-full border-blue-300 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500 whitespace-nowrap"
      >
        <Link href="/contact?type=want-to-become-an-affiliate" target="_blank">
          Contact us
        </Link>
      </Button>
    </section>
  );
}
