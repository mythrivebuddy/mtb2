
/* eslint-disable react/no-unescaped-entities */


export default function Philosophy() {
  return (
    <section className="  bg-white dark:bg-slate-800/50">
      <div className="">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-12 items-center">

          {/* LEFT ILLUSTRATION BOX */}
          <div className="relative  py-12 lg:h-full w-full overflow-hidden ">
            <img  src="/homepage_grow_together.png" alt="Grow Together Illustration" loading="lazy"  className="object-cover rounded-md"/>
          </div>

          {/* RIGHT TEXT BLOCK */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold dark:text-white">
              Built So You Don’t Have to Grow Alone.
            </h2>
            <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 leading-8">
             MyThriveBuddy was born from a simple belief: growth is better together. We saw countless coaches and creators juggling a dozen apps, feeling isolated and overwhelmed. We wanted to create a single, supportive home—a place where planning your progress feels as joyful as achieving it. It’s more than tools; it's an ecosystem designed to give you clarity, connection, and momentum on your unique journey.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
