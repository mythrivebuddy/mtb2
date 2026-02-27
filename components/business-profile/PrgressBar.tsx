"use client"

interface Props {
  step: number
  totalSteps?: number
}

export default function ProgressBar({ step, totalSteps = 7 }: Props) {
  const percentage = Math.round((step / totalSteps) * 100)

  const stepsArray = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="mb-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-600">
          Step {step} of {totalSteps}
        </h3>

        <span className="text-sm font-semibold text-blue-600">
          {percentage}% Complete
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step Circles */}
      <div className="flex justify-between items-center">
        {stepsArray.map((item) => {
          const isActive = item === step
          const isCompleted = item < step

          return (
            <div key={item} className="flex flex-col items-center flex-1">

              <div
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                  ${
                    isCompleted
                      ? "bg-blue-600 text-white"
                      : isActive
                      ? "bg-blue-100 text-blue-700 border border-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }
                `}
              >
                {item}
              </div>

              {item !== totalSteps && (
                <div className="hidden md:block w-full h-0.5 bg-gray-200 absolute top-4 left-1/2 -z-10" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}