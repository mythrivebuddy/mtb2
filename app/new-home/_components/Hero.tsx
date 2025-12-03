export default function Hero() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-24  bg-background-light dark:bg-background-dark">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
          {/* LEFT */}
          <div className="flex flex-col gap-8 text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white">
              One Complete Growth Ecosystem
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              For Coaches, Solopreneurs & Self-Growth Enthusiasts. The ecosystem that grows you
              and your business. <br />
              <br />
              One ecosystem. Endless momentum.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 lg:justify-start mt-3">
              <button className="h-12 px-5 bg-brand hover:bg-brand/90 text-white rounded-xl font-bold py-1">
                I am a Coach/Solopreneur
              </button>
              <button className="h-12 px-5 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold py-1">
                I am a Self Growth Enthusiast
              </button>
            </div>

            <p className="text-sm text-slate-500">Start with curiosity. Grow without hustle.</p>
          </div>

          {/* RIGHT */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 py-8 px-6 shadow-lg">
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cover shadow-sm bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA5CVeg1JhXqpgJCJV184ej4rdDH-rPjca0Erk9kOOSlVGasub4oke8HeLTM6hFYatLeB55jZcqoQur00azEtBCwaLQ-FathwfyDr7-pQjVSyy5rTIXQFqfu_mkmPYQOf_XIQAdyA4G4wo7SoeqCra2tFS-MwiZSp4HiMDWZiIm3fVEDmTxnNzym53YPKZJz4lnuk3y21XkhFWUiqVu4KASb7d28UoHNjUlmkcOXqy39TAxBgiQB71rND7wbTjVgGiLZG6ftR0p3Zj0')",
                }}
              />
              <div className="absolute -bottom-10 -left-10 h-20 w-20 rounded-full bg-brand/10 dark:bg-brand/20"></div>

              <div className="relative flex flex-col items-center text-center">
                <h3 className="text-xl font-bold">Jenna Matthews</h3>
                <p className="text-sm text-brand">Mindset & Productivity Coach</p>
                <p className="mt-4 text-slate-600 text-xl  dark:text-slate-400">
                  "MyThriveBuddy helped me streamline my client management and focus on what truly
                  matters - coaching."
                </p>
                <button className="mt-6 h-10 px-4 bg-brand text-white rounded-2xl font-bold">
                  Connect with me
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
