import { BusinessProfile } from "@/types/client/business-profile"

interface Props {
  profile: BusinessProfile
}

export default function TestimonialsSection({ profile }: Props) {
  return (
    <section className="bg-gray-50 py-14">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Client Feedback
        </h2>

        <div className="space-y-6">
          {profile?.testimonials?.map((t: any, i: number) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-sm border"
            >
              <p className="text-gray-700 italic leading-relaxed">
                {/* "{t.quote}" */}
              </p>

              <p className="mt-4 text-sm font-semibold text-gray-900">
                — {t.author}, {t.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}