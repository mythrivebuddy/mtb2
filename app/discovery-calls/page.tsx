// DiscoveryCallMarketplaceContent.tsx
import AppLayout from '@/components/layout/AppLayout';
import React from 'react';
import {
  CheckCircle,
  MessageSquare,
  LockOpen,
  Search,
  Star,
  TrendingUp,
  Clock,
  Phone,
  UserSearch,
  Calendar,
  IndianRupee,
  Globe,
  Award,
  Info,
} from 'lucide-react';

const DiscoveryCallMarketplaceContent: React.FC = () => {
  return (
    <AppLayout>
      <main>
        {/* Hero + Intro */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tighter text-slate-900 dark:text-white">
                Find Your Coach. Book Your Discovery Call.
              </h1>

              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                For Coaches, Solopreneurs & Self-Growth Enthusiasts.
                <br />
                One ecosystem. Endless momentum.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <div className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 shadow-sm dark:bg-slate-800/70">
                  <CheckCircle className="text-brand h-4 w-4" />
                  <span>Verified Coaches</span>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 shadow-sm dark:bg-slate-800/70">
                  <MessageSquare className="text-brand h-4 w-4" />
                  <span>Ratings & Reviews</span>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 shadow-sm dark:bg-slate-800/70">
                  <LockOpen className="text-brand h-4 w-4" />
                  <span>Open to non-members</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search + Filters */}
        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto px-4">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
              <div className="flex flex-col gap-6">
                {/* Search */}
                <div className="w-half">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                      id="coach-search"
                      type="text"
                      placeholder="Search by coach name, niche, or keywords…"
                      className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none ring-brand/10 focus:border-brand focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    Categories
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {[
                      'Mindset',
                      'Business Coaching',
                      'Life Coaching',
                      'Habits & Productivity',
                      'Career',
                      'Health & Wellness',
                      'Accountability',
                    ].map((cat) => (
                      <button
                        key={cat}
                        className="px-4 py-1.5 rounded-full border border-slate-300 bg-white text-sm text-slate-700 hover:border-brand hover:text-brand dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:border-brand"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    Price
                  </h4>

                  <div className="flex gap-4 items-center">
                    {['Free', 'Paid', 'All'].map((label) => (
                      <label key={label} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          defaultChecked={label === 'All'}
                          className="h-4 w-4 text-brand border-slate-300 focus:ring-brand dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Coaches */}
            <div className="mt-10">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Featured Coaches (Paid Members)
                </h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Paid members appear here for maximum visibility
                </span>
              </div>

              <div className="mt-4 overflow-x-auto pb-2">
                <div className="flex gap-4 min-w-full">
                  {/* Example card */}
                  <article className="min-w-[260px] max-w-xs flex-1 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm ring-2 ring-amber-300/60 dark:border-amber-500/40 dark:bg-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        <Star className="h-3 w-3" />
                        Featured
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <TrendingUp className="h-3 w-3 text-amber-500" />
                        <span>High Booking Rate</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Coach Name</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Business & Mindset Coach</p>

                        <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                          <Star className="h-3 w-3" />
                          <span>4.9</span>
                          <span className="text-slate-400 dark:text-slate-500">(82 reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {['Mindset', 'Business Growth', 'Accountability'].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-brand" />
                        <span>30 min discovery</span>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">Free</span>
                    </div>

                    <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90">
                      <Phone className="h-4 w-4" />
                      Book Discovery Call
                    </button>
                  </article>
                </div>
              </div>
            </div>

            {/* All Coaches */}
            <div className="mt-12 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">All Discovery Calls</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse coaches. Create a free account to book and save your favorites.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Example coach card */}
              <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Coach Name</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Life & Mindset Coach</p>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-amber-500">
                        <Star className="h-3 w-3" />
                        <span>4.8</span>
                        <span className="text-slate-400 dark:text-slate-500">(45)</span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {['Mindset', 'Self-Growth'].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-brand" />
                    <span>20–30 min call</span>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <IndianRupee className="h-4 w-4 text-brand" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">₹0 / Free</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-brand" />
                    <span>Slots this week</span>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <Globe className="h-4 w-4 text-brand" />
                    <span>English · Hindi</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg h-10 bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90">
                    <Phone className="h-4 w-4" />
                    Book Discovery Call
                  </button>

                  <button className="inline-flex items-center justify-center gap-1 rounded-lg h-10 border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    <UserSearch className="h-4 w-4" />
                    View Profile
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                  Create a free account to see full reviews, notes, and live availability.
                </p>
              </article>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <nav className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  Previous
                </button>

                <button className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">
                  1
                </button>

                <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  2
                </button>

                <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  3
                </button>

                <span className="px-1">…</span>

                <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  Next
                </button>
              </nav>
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Are You a Coach or Solopreneur?
              </h2>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Get featured at the top, receive more discovery call bookings, and grow your visibility inside MyThriveBuddy.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row  sm:justify-center gap-3">
                <a className="inline-flex items-center gap-2 rounded-lg h-11 bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90">
                  <Award className="h-4 w-4" />
                  Join as a Coach
                </a>

                <a className="inline-flex items-center gap-2 rounded-lg h-11 border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                  <Info className="h-4 w-4" />
                  Learn about Discovery Calls
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  );
};

export default DiscoveryCallMarketplaceContent;
