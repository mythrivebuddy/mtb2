// import { useFormContext } from "react-hook-form"

// const LANGUAGES = ["English", "Spanish", "French", "German"]

// const SESSION_FORMATS = ["Online", "In-person", "Hybrid"]

// export default function Step5SessionAvailability({ next, back }) {
//   const { register, watch, setValue, trigger } = useFormContext()

//   const selectedLanguages = watch("languages") || []
//   const selectedFormat = watch("sessionFormat")

//   const toggleLanguage = (lang) => {
//     if (selectedLanguages.includes(lang)) {
//       setValue(
//         "languages",
//         selectedLanguages.filter((l) => l !== lang)
//       )
//     } else {
//       setValue("languages", [...selectedLanguages, lang])
//     }
//   }

//   const handleNext = async () => {
//     const valid = await trigger([
//       "languages",
//       "timezone",
//       "sessionFormat",
//       "sessionDuration",
//       "priceMin",
//       "priceMax",
//     ])
//     if (valid) next()
//   }

//   return (
//     <div className="bg-white p-6 rounded-xl shadow">
//       <h2 className="text-xl font-semibold mb-6">
//         Session & Availability Details
//       </h2>

//       {/* Languages */}
//       <div className="mb-6">
//         <h3 className="font-medium mb-2">Languages You Coach In</h3>

//         <div className="flex flex-wrap gap-2">
//           {LANGUAGES.map((lang) => {
//             const active = selectedLanguages.includes(lang)
//             return (
//               <button
//                 key={lang}
//                 type="button"
//                 onClick={() => toggleLanguage(lang)}
//                 className={`px-4 py-2 rounded-full border transition ${
//                   active
//                     ? "bg-blue-500 text-white border-blue-500"
//                     : "bg-white text-gray-700 border-gray-300"
//                 }`}
//               >
//                 {lang}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {/* Timezone */}
//       <select
//         {...register("timezone", { required: true })}
//         className="w-full border p-3 rounded-lg mb-6"
//       >
//         <option value="">Select Timezone</option>
//         <option value="EST">GMT -5 (Eastern Standard Time)</option>
//         <option value="CST">GMT -6 (Central Standard Time)</option>
//         <option value="PST">GMT -8 (Pacific Standard Time)</option>
//       </select>

//       {/* Session Format */}
//       <div className="mb-6">
//         <h3 className="font-medium mb-2">Preferred Session Format</h3>

//         <div className="grid grid-cols-3 gap-3">
//           {SESSION_FORMATS.map((format) => {
//             const active = selectedFormat === format
//             return (
//               <button
//                 key={format}
//                 type="button"
//                 onClick={() => setValue("sessionFormat", format)}
//                 className={`p-4 rounded-xl border transition ${
//                   active
//                     ? "border-blue-500 bg-blue-50"
//                     : "border-gray-200"
//                 }`}
//               >
//                 {format}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {/* Session Duration */}
//       <select
//         {...register("sessionDuration", { required: true })}
//         className="w-full border p-3 rounded-lg mb-6"
//       >
//         <option value="30">30 Minutes</option>
//         <option value="45">45 Minutes</option>
//         <option value="60">60 Minutes</option>
//         <option value="90">90 Minutes</option>
//       </select>

//       {/* Pricing */}
//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <input
//           type="number"
//           {...register("priceMin", { valueAsNumber: true })}
//           placeholder="Min Price"
//           className="border p-3 rounded-lg"
//         />

//         <input
//           type="number"
//           {...register("priceMax", { valueAsNumber: true })}
//           placeholder="Max Price"
//           className="border p-3 rounded-lg"
//         />
//       </div>

//       {/* Navigation */}
//       <div className="flex justify-between">
//         <button type="button" onClick={back}>
//           Back
//         </button>

//         <button
//           type="button"
//           onClick={handleNext}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
//         >
//           Final Review →
//         </button>
//       </div>
//     </div>
//   )
// }

import { useFormContext } from "react-hook-form"

interface Props {
  next: () => void
  back: () => void
}

export interface FormValues {
  languages: string[]
  timezone: string
  sessionFormat: string
  sessionDuration: string
  priceMin: number
  priceMax: number
}

const LANGUAGES = ["English", "Spanish", "French", "German"]
const SESSION_FORMATS = ["Online", "In-person", "Hybrid"]

export default function Step6SessionAvailability({
  next,
  back,
}: Props) {
  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext<FormValues>()

  const selectedLanguages = watch("languages") ?? []
  const selectedFormat = watch("sessionFormat")

  const toggleLanguage = (lang: string) => {
    const updated = selectedLanguages.includes(lang)
      ? selectedLanguages.filter((l) => l !== lang)
      : [...selectedLanguages, lang]

    setValue("languages", updated, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    })
  }

  const selectFormat = (format: string) => {
    setValue("sessionFormat", format, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    })
  }

  const handleNext = async () => {
    const valid = await trigger([
      "languages",
      "timezone",
      "sessionFormat",
      "sessionDuration",
      "priceMin",
      "priceMax",
    ])

    if (valid) next()
  }

  const showError = <K extends keyof FormValues>(field: K) =>
    errors[field]

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-6">
        Session & Availability Details
      </h2>

      {/* Hidden register for languages */}
      <input type="hidden" {...register("languages")} />

      {/* Languages */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">
          Languages You Coach In
        </h3>

        <div
          className={`flex flex-wrap gap-2 ${
            showError("languages")
              ? "border border-red-500 p-3 rounded-xl"
              : ""
          }`}
        >
          {LANGUAGES.map((lang) => {
            const active = selectedLanguages.includes(lang)

            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-4 py-2 rounded-full border transition ${
                  active
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {lang}
              </button>
            )
          })}
        </div>

        {showError("languages") && (
          <p className="text-red-500 text-sm mt-1">
            {errors.languages?.message}
          </p>
        )}
      </div>

      {/* Timezone */}
      <div className="mb-6">
        <label className="block font-medium mb-2">
          Primary Timezone
        </label>

        <select
          {...register("timezone")}
          className={`w-full border p-3 rounded-lg ${
            showError("timezone")
              ? "border-red-500"
              : "border-gray-300"
          }`}
        >
          <option value="">Select Timezone</option>
          <option value="EST">GMT -5 (Eastern)</option>
          <option value="CST">GMT -6 (Central)</option>
          <option value="PST">GMT -8 (Pacific)</option>
        </select>

        {showError("timezone") && (
          <p className="text-red-500 text-sm mt-1">
            {errors.timezone?.message}
          </p>
        )}
      </div>

      {/* Hidden register for sessionFormat */}
      <input type="hidden" {...register("sessionFormat")} />

      {/* Session Format */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">
          Preferred Session Format
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {SESSION_FORMATS.map((format) => {
            const active = selectedFormat === format

            return (
              <button
                key={format}
                type="button"
                onClick={() => selectFormat(format)}
                className={`p-4 rounded-xl border transition ${
                  active
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                {format}
              </button>
            )
          })}
        </div>

        {showError("sessionFormat") && (
          <p className="text-red-500 text-sm mt-1">
            {errors.sessionFormat?.message}
          </p>
        )}
      </div>

      {/* Duration */}
      <div className="mb-6">
        <label className="block font-medium mb-2">
          Typical Session Duration
        </label>

        <select
          {...register("sessionDuration")}
          className={`w-full border p-3 rounded-lg ${
            showError("sessionDuration")
              ? "border-red-500"
              : "border-gray-300"
          }`}
        >
          <option value="">Select Duration</option>
          <option value="30">30 Minutes</option>
          <option value="45">45 Minutes</option>
          <option value="60">60 Minutes</option>
          <option value="90">90 Minutes</option>
        </select>

        {showError("sessionDuration") && (
          <p className="text-red-500 text-sm mt-1">
            {errors.sessionDuration?.message}
          </p>
        )}
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <label className="block font-medium mb-2">
          Pricing Range
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Min Price
            </label>

            <input
              type="number"
              {...register("priceMin", { valueAsNumber: true })}
              className={`border p-3 rounded-lg w-full ${
                showError("priceMin")
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />

            {showError("priceMin") && (
              <p className="text-red-500 text-sm mt-1">
                {errors.priceMin?.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Max Price
            </label>

            <input
              type="number"
              {...register("priceMax", { valueAsNumber: true })}
              className={`border p-3 rounded-lg w-full ${
                showError("priceMax")
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />

            {showError("priceMax") && (
              <p className="text-red-500 text-sm mt-1">
                {errors.priceMax?.message}
              </p>
            )}
          </div>
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