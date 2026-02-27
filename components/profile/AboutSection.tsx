export default function AboutSection() {
  return (
    <section className="grid md:grid-cols-2 gap-10">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">About Erika</h2>
        <p className="text-gray-600">
          With over 8 years in behavioral science and performance coaching,
          I help high-achievers navigate productivity and mental wellbeing.
        </p>

        <div className="bg-blue-50 p-4 rounded-xl border">
          <p className="font-semibold text-blue-600">
            The Clarity-Momentum Loop™
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-6 text-center">
          <h3 className="text-3xl font-bold text-blue-600">8+</h3>
          <p className="text-sm text-gray-600">Years Experience</p>
        </div>

        <div className="bg-white border rounded-xl p-6 text-center">
          <h3 className="text-3xl font-bold text-blue-600">250+</h3>
          <p className="text-sm text-gray-600">Clients Helped</p>
        </div>
      </div>
    </section>
  );
}