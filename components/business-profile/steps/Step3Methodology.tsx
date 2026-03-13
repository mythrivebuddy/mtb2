"use client"

import { useFormContext } from "react-hook-form"

interface Props {
  next: () => void
  back: () => void
}

const sessionOptions = [
  "Structured & Goal-Oriented",
  "Deep Reflective Coaching",
  "Action-Driven & Tactical",
  "Holistic & Mindset-Based",
  "Accountability-Focused",
  "Flexible & Client-Led",
]

export default function Step3Methodology({ next, back }: Props) {
  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext()

  const selectedStyles = watch("sessionStyles") || []
  const methodology = watch("methodology") || ""

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setValue(
        "sessionStyles",
        selectedStyles.filter((s: string) => s !== style)
      )
    } else {
      setValue("sessionStyles", [...selectedStyles, style])
    }
  }

  const handleNext = async () => {
    const valid = await trigger([
      "sessionStyles",
      "methodology",
    ])
    if (valid) next()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">

      {/* Heading */}
      <h2 className="text-2xl font-semibold mb-2">
        How Do You Work With Clients?
      </h2>
      <p className="text-gray-500 mb-6">
        Help potential clients understand your coaching style and structure.
      </p>

      {/* Session Style Selection */}
      <div className="mb-8">
        <label className="font-medium block mb-3">
          Session Style <span className="text-red-500">*</span>
        </label>

        <div className="grid md:grid-cols-2 gap-4">
          {sessionOptions.map((style) => {
            const selected = selectedStyles.includes(style)

            return (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`p-4 border rounded-xl text-left transition
                  ${
                    selected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }
                `}
              >
                {style}
              </button>
            )
          })}
        </div>

        {errors.sessionStyles && (
          <p className="text-red-500 text-sm mt-2">
            {errors.sessionStyles.message as string}
          </p>
        )}
      </div>

      {/* Methodology Description */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="font-medium">
            Describe Your Methodology <span className="text-red-500">*</span>
          </label>
          <span className="text-sm text-gray-400">
            {methodology.length}/500
          </span>
        </div>

        <textarea
          {...register("methodology")}
          maxLength={500}
          className="w-full border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl p-4 min-h-[140px]"
          placeholder="Explain your coaching process step-by-step..."
        />

        {errors.methodology && (
          <p className="text-red-500 text-sm mt-1">
            {errors.methodology.message as string}
          </p>
        )}
      </div>

      {/* Optional Tools / Frameworks */}
      <div className="mb-8">
        <label className="font-medium block mb-2">
          Tools / Frameworks You Use (Optional)
        </label>

        <input
          {...register("toolsFrameworks")}
          className="w-full border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl p-3"
          placeholder="e.g., SMART Goals, CBT, OKRs..."
        />
      </div>

      {/* Bottom Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <div className="bg-indigo-50 p-4 rounded-xl">
          <p className="font-medium text-indigo-700 mb-1">
            🧠 Why This Matters
          </p>
          <p className="text-sm text-indigo-600">
            Clients want clarity on how sessions are structured before committing.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <p className="font-medium text-gray-700 mb-1">
            📈 Conversion Tip
          </p>
          <p className="text-sm text-gray-500">
            Clear processes increase booking rates by up to 40%.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={back}
          className="px-5 py-2 rounded-lg border hover:bg-gray-100"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Save & Continue
        </button>
      </div>
    </div>
  )
}