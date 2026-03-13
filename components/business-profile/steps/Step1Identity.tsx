"use client"

import { useFormContext } from "react-hook-form"

interface Props {
  next: () => void
}

const domains = [
  "Productivity",
  "Career Growth",
  "Mindset",
  "Health & Wellness",
  "Leadership",
]

const audiences = [
  "Corporate Professionals",
  "Remote Workers",
  "Entrepreneurs",
  "Students",
  "Parents",
]

export default function Step1Identity({ next }: Props) {
  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext()

  const selectedDomains = watch("coachingDomains") || []
  const selectedAudience = watch("targetAudience") || []
  const tagline = watch("tagline") || ""

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setValue(
        "coachingDomains",
        selectedDomains.filter((d: string) => d !== domain)
      )
    } else {
      if (selectedDomains.length < 2) {
        setValue("coachingDomains", [...selectedDomains, domain])
      }
    }
  }

  const toggleAudience = (audience: string) => {
    if (selectedAudience.includes(audience)) {
      setValue(
        "targetAudience",
        selectedAudience.filter((a: string) => a !== audience)
      )
    } else {
      setValue("targetAudience", [...selectedAudience, audience])
    }
  }

  const handleNext = async () => {
    const valid = await trigger([
      "name",
      "tagline",
      "coachingDomains",
      "targetAudience",
    ])
    if (valid) next()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">

      <h2 className="text-2xl font-semibold mb-2">
        Who You Are & Who You Help
      </h2>
      <p className="text-gray-500 mb-6">
        This information will be displayed on your public profile card.
      </p>

      {/* Professional Name */}
      <div className="mb-6">
        <label className="font-medium block mb-2">
          Professional Display Name <span className="text-red-500">*</span>
        </label>

        <input
          {...register("name")}
          className="w-full border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl p-3"
        />

        {errors.name && (
          <p className="text-red-500 text-sm mt-1">
            {errors.name.message as string}
          </p>
        )}
      </div>

      {/* Tagline */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="font-medium">
            Tagline <span className="text-red-500">*</span>
          </label>
          <span className="text-sm text-gray-400">
            {tagline.length}/120
          </span>
        </div>

        <input
          {...register("tagline")}
          maxLength={120}
          className="w-full border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl p-3"
        />

        {errors.tagline && (
          <p className="text-red-500 text-sm mt-1">
            {errors.tagline.message as string}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-1">
          Example: Helping professionals build calm productivity.
        </p>
      </div>

      {/* Coaching Domains */}
      <div className="mb-6">
        <label className="font-medium block mb-2">
          Primary Coaching Domains <span className="text-red-500">*</span>
          <span className="text-sm text-gray-400 ml-2">(Max 2)</span>
        </label>

        <div className="flex flex-wrap gap-3">
          {domains.map((domain) => {
            const selected = selectedDomains.includes(domain)

            return (
              <button
                key={domain}
                type="button"
                onClick={() => toggleDomain(domain)}
                className={`px-4 py-2 rounded-full border transition
                  ${
                    selected
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300"
                  }
                `}
              >
                {domain}
              </button>
            )
          })}
        </div>

        {errors.coachingDomains && (
          <p className="text-red-500 text-sm mt-2">
            {errors.coachingDomains.message as string}
          </p>
        )}
      </div>

      {/* Who You Primarily Help */}
      <div className="mb-8">
        <label className="font-medium block mb-2">
          Who You Primarily Help <span className="text-red-500">*</span>
        </label>

        <div className="flex flex-wrap gap-3">
          {audiences.map((audience) => {
            const selected = selectedAudience.includes(audience)

            return (
              <button
                key={audience}
                type="button"
                onClick={() => toggleAudience(audience)}
                className={`px-4 py-2 rounded-full border transition
                  ${
                    selected
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300"
                  }
                `}
              >
                {audience}
              </button>
            )
          })}
        </div>

        {errors.targetAudience && (
          <p className="text-red-500 text-sm mt-2">
            {errors.targetAudience.message as string}
          </p>
        )}
      </div>

      {/* Continue */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
        >
          Save & Continue
        </button>
      </div>
    </div>
  )
}