"use client"

import { useEffect } from "react"
import { useFormContext, useFieldArray } from "react-hook-form"

interface Props {
  next: () => void
  back: () => void
}

export default function Step2Transformation({ next, back }: Props) {
  const {
    register,
    control,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext()

  // Dynamic Typical Results
  const { fields, append, remove } = useFieldArray({
    control,
    name: "typicalResults",
  })
useEffect(() => {
  if (fields.length === 0) {
    append("")
  }
}, [fields, append])
  const handleNext = async () => {
    const valid = await trigger(["transformation", "typicalResults"])
    if (!valid) return

    // ✅ CLEAN EMPTY STRINGS BEFORE GOING NEXT
    const values = getValues("typicalResults")

    if (Array.isArray(values)) {
      const cleaned = values.filter(
        (item: string) => item && item.trim() !== ""
      )

      setValue("typicalResults", cleaned, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }

    next()
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">

      <h2 className="text-xl font-semibold mb-2">
        What Transformation Do You Create?
      </h2>

      <p className="text-gray-500 mb-6">
        Be specific about the shift your clients undergo.
      </p>

      {/* Transformation Promise */}
      <div className="mb-6">
        <textarea
          {...register("transformation")}
          placeholder="After working with me, you will..."
          className="w-full border p-3 rounded-lg min-h-[120px]"
        />

        {errors.transformation && (
          <p className="text-red-500 text-sm mt-1">
            {errors.transformation.message as string}
          </p>
        )}
      </div>

      {/* Typical Results */}
      <div>
        <h3 className="font-medium mb-2">
          Typical Results Clients Experience
        </h3>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-3 mb-3"
          >
            <input
              {...register(`typicalResults.${index}`)}
              placeholder={`Result ${index + 1}`}
              className="flex-1 border p-2 rounded-lg"
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}

        {errors.typicalResults && (
          <p className="text-red-500 text-sm mb-3">
            {errors.typicalResults.message as string}
          </p>
        )}

        <button
          type="button"
          onClick={() => append("")}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add Another Result
        </button>
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