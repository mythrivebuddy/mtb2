import Link from "next/link";

export default function CTA() {
  return (
    <section className=" mt-16 mb-32">
      <div className="">
        <div className="max-w-3xl mx-auto text-center ">
          <h2 className="text-3xl sm:text-4xl font-bold dark:text-white">
            Ready to Make Growth Feel Lighter?
          </h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
            Join an ecosystem that helps you grow as a human — and as a business if you’re a coach or solopreneur.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup?user-type=coach-solopreneur" >
            <button className="h-12 px-5 bg-brand hover:bg-brand/90 text-white rounded-2xl  py-1 font-bold">
              Sign Up as Coach/Solopreneur
            </button>
            </Link>
            <Link href="/signup?user-type=enthusiast">
            <button className="h-12 px-5 bg-slate-200 dark:bg-slate-700 rounded-2xl py-1 font-bold">
              Sign up as Growth Enthusiast
            </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
