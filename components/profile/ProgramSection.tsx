export default function ProgramsSection() {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold">Programs & Offerings</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold text-lg">Discovery Call</h3>
          <p className="text-gray-600 mt-2 text-sm">
            A 20-minute session to explore your challenges.
          </p>
          <p className="mt-4 text-blue-600 font-medium">FREE</p>

          <button className="mt-4 w-full bg-gray-200 py-2 rounded-xl font-medium hover:bg-gray-300">
            Book Free Session
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border p-6 shadow-md">
          <h3 className="font-semibold text-lg">6-Week Challenge</h3>
          <p className="text-gray-600 mt-2 text-sm">
            Intensive sprint to rebuild productivity systems.
          </p>
          <p className="mt-4 text-blue-600 font-medium">From $599</p>

          <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700">
            Enroll Now
          </button>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold text-lg">Mini Mastery</h3>
          <p className="text-gray-600 mt-2 text-sm">
            Focused workshop on emotional regulation.
          </p>
          <p className="mt-4 text-blue-600 font-medium">From $149</p>

          <button className="mt-4 w-full bg-gray-200 py-2 rounded-xl font-medium hover:bg-gray-300">
            View Program
          </button>
        </div>
      </div>
    </section>
  );
}