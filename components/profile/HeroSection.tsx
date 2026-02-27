export default function HeroSection() {
  return (
    <section className="grid md:grid-cols-2 gap-10 items-start">
      {/* Left */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-3xl font-bold">Erika Smith</h1>
            <p className="text-gray-600">
              Helping professionals build calm productivity and emotional clarity
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
            Mindset
          </span>
          <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
            Productivity
          </span>
        </div>
      </div>

      {/* Right Card */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <p className="text-blue-600 font-medium">● Online Now</p>

        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
          Book Discovery Call
        </button>

        <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition">
          Message
        </button>

        <p className="text-sm text-gray-500">
          Typical response time: Under 2 hours
        </p>
      </div>
    </section>
  );
}