import Link from "next/link";

export default function CTA() {
  return (
    <section className="mt-12 sm:mt-6 mb-20">
      <div className="">
        <div className="max-w-3xl mx-auto text-center ">
          <h2 className="text-3xl sm:text-4xl font-bold dark:text-white">
            Ready to Make Growth Feel Lighter?
          </h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
            Join an ecosystem that helps you grow as a human — and as a business
            if you’re a coach or solopreneur.
          </p>

          <div className="mt-8 flex flex-col items-center sm:flex-row sm:justify-center gap-4">
            {/* Sign up as Self Growth Enthusiast */}
            <Link
              href="/signup?user-type=enthusiast"
              className="w-full sm:w-auto"
            >
              <button className="w-full sm:w-auto max-sm:text-sm h-12 px-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-colors ease-in-out py-1 font-bold">
                Sign Up as Self Growth Enthusiast
              </button>
            </Link>

            {/* Sign Up as Coach/Solopreneur */}
            <Link
              href="/signup?user-type=coach-solopreneur"
              className="w-full sm:w-auto"
            >
              <button className="w-full sm:w-auto max-sm:text-sm h-12 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors ease-in-out py-1 font-bold">
                Sign Up as Coach/Solopreneur
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
