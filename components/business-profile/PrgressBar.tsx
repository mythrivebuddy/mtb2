"use client"

import { useFormContext } from "react-hook-form"
import { BusinessProfileFormValues } from "@/schema/zodSchema"

interface Props {
  step: number
  totalSteps?: number
  onStepClick?: (step: number) => void
}

const STEP_FIELDS: (keyof BusinessProfileFormValues)[][] = [
  ["name", "tagline"],                                    // Step 1
  ["transformation", "typicalResults"],                   // Step 2
  ["methodology", "sessionStyles"],                       // Step 3
  ["yearsOfExperience", "certifications"],                // Step 4
  ["servicesOffered", "coachingDomains"],                 // Step 5
  ["priceMin", "priceMax", "preferredCurrency", "calendlyUrl"], // Step 6
  ["profilePhoto", "linkedin"],                           // Step 7
]

export default function ProgressBar({ step, totalSteps = 7, onStepClick }: Props) {
  const { getValues } = useFormContext<BusinessProfileFormValues>()
  const values = getValues()

  const filledSteps = STEP_FIELDS.filter((fields) =>
    fields.some((field) => {
      const val = values[field]
      if (Array.isArray(val)) return val.length > 0
      return val !== undefined && val !== null && val !== ""
    })
  ).length

  const completionPercentage = Math.round((filledSteps / totalSteps) * 100)

  const stepsArray = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="mb-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-600">
          Step {step} of {totalSteps}
        </h3>
        <span className="text-sm font-semibold text-blue-600">
          {completionPercentage}% Complete
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Step Circles */}
      <div className="flex justify-between items-center">
        {stepsArray.map((item) => {
          const isActive = item === step
          const isCompleted = item < step

          return (
            <div key={item} className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => onStepClick?.(item)}
                disabled={!onStepClick}
                title={`Go to step ${item}`}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                  ${onStepClick ? "cursor-pointer hover:scale-110" : "cursor-default"}
                  ${
                    isCompleted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : isActive
                      ? "bg-blue-100 text-blue-700 border border-blue-600"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                  }
                `}
              >
                {isCompleted ? "✓" : item}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}