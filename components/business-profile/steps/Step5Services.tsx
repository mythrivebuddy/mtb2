import { useFormContext } from "react-hook-form"

interface FormValues {
  servicesOffered: string[]
}

interface Step5Props {
  next: () => void
  back: () => void
}

const services = [
  "Discovery Calls",
  "1:1 Coaching",
  "Group Coaching",
  "Challenges",
  "Webinars",
  "Mini Mastery Programs",
]

export default function Step5Services({
  next,
  back,
}: Step5Props) {
  const {
    watch,
    setValue,
    trigger,
    register,
    formState: { errors },
  } = useFormContext<FormValues>()

  const selected = watch("servicesOffered") || []

  // const isTouched = touchedFields.servicesOffered
  const hasError = errors.servicesOffered

  const toggleService = (service: string) => {
    const updated = selected.includes(service)
      ? selected.filter((s) => s !== service)
      : [...selected, service]

    setValue("servicesOffered", updated, {
      shouldValidate: true,
      // shouldTouch: true,   // 👈 VERY IMPORTANT
      shouldDirty: true,
    })
  }

  const handleNext = async () => {
    const valid = await trigger("servicesOffered")
    if (valid) next()
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      <h2 className="text-xl font-semibold mb-2">
        What Do You Offer?
      </h2>

      <p className="text-gray-500 text-sm mb-6">
        Select at least one service
      </p>

      <input
        type="hidden"
        {...register("servicesOffered", {
          validate: (value) =>
            value && value.length > 0 || "Please select at least one service",
        })}
      />

      <div
        className={`grid grid-cols-2 gap-4 mb-2
          ${hasError ? "border border-red-500 p-3 rounded-xl" : ""}
        `}
      >
        {services.map((service) => {
          const isSelected = selected.includes(service)

          return (
            <button
              key={service}
              type="button"
              onClick={() => toggleService(service)}
              className={`p-4 border rounded-xl text-left transition
                ${isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
                }
              `}
            >
              {service}
            </button>
          )
        })}
      </div>

      {/* Show error ONLY if touched */}
      {hasError && (
        <p className="text-red-500 text-sm mb-4">
          {errors.servicesOffered?.message}
        </p>
      )}

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