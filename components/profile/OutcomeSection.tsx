import { BusinessProfile } from "@/types/client/business-profile"

interface Props {
  profile: BusinessProfile
}

export default function OutcomeSection({ profile }: Props) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      <div className="bg-white rounded-2xl p-10 shadow-sm border-t-4 border-blue-600">

        <h2 className="text-sm tracking-widest text-blue-600 font-semibold mb-4">
          THE OUTCOME
        </h2>

        <h3 className="text-3xl font-bold text-gray-900 max-w-3xl leading-snug">
          {profile?.transformation}
        </h3>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {profile?.typicalResults?.map((result: string, i: number) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                ✓
              </div>
              <p className="text-gray-700">{result}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}