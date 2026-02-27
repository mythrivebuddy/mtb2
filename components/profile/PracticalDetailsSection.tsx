import { BusinessProfile } from "@/types/client/business-profile"
import { useState } from "react"

interface Props {
  profile: BusinessProfile
}

export default function PracticalDetailsSection({ profile }: Props) {
  const [open, setOpen] = useState<number | null>(0)

  const items = [
    {
      title: "Session Duration & Format",
      content: profile?.sessionDuration,
    },
    {
      title: "Languages Supported",
      content: profile?.languages?.join(", "),
    },
    {
      title: "Pricing Range",
      content: `₹${profile?.priceMin} - ₹${profile?.priceMax}`,
    },
  ]

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">
          Practical Details
        </h2>

        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-4 font-medium text-gray-900 flex justify-between"
              >
                {item.title}
                <span>{open === i ? "-" : "+"}</span>
              </button>

              {open === i && (
                <div className="px-6 pb-4 text-gray-600 text-sm">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}