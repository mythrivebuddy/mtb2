import { useFormContext } from "react-hook-form"
import TimezoneSelect, { ITimezone } from "react-timezone-select"
import { useState, useEffect } from "react"

interface Props {
  next: () => void
  back: () => void
}

export interface FormValues {
  languages: string[]
  timezone: string
  sessionFormat: string
  calendlyUrl: string 
  preferredCurrency: "INR" | "USD"
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
  
  // 1. Watch the timezone from form state (important for edit mode)
  const savedTimezone = watch("timezone")

  // 2. Initialize state with saved value or empty string
  const [timezone, setTimezone] = useState<ITimezone>(savedTimezone || "")

  // 3. Sync state if savedTimezone changes (optional but safer for edit mode)
  useEffect(() => {
    if (savedTimezone) {
      setTimezone(savedTimezone)
    }
  }, [savedTimezone])

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
      "calendlyUrl", 
      "sessionDuration",
      "preferredCurrency", 
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

      <input type="hidden" {...register("languages")} />

      {/* Languages */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Languages You Coach In</h3>
        <div className={`flex flex-wrap gap-2 ${showError("languages") ? "border border-red-500 p-3 rounded-xl" : ""}`}>
          {LANGUAGES.map((lang) => {
            const active = selectedLanguages.includes(lang)
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-4 py-2 rounded-full border transition ${active ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300"}`}
              >
                {lang}
              </button>
            )
          })}
        </div>
        {showError("languages") && <p className="text-red-500 text-sm mt-1">{errors.languages?.message}</p>}
      </div>

      {/* Timezone - FIXED FOR EDIT MODE */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Primary Timezone</label>
        <input type="hidden" {...register("timezone")} />
        <div className={`${showError("timezone") ? "border border-red-500 rounded-lg p-1" : ""}`}>
          <TimezoneSelect
            value={timezone}
            onChange={(tz: ITimezone) => {
              setTimezone(tz)
              const tzValue = typeof tz === "string" ? tz : tz.value
              setValue("timezone", tzValue, {
                shouldValidate: true,
                shouldTouch: true,
                shouldDirty: true,
              })
            }}
          />
        </div>
        {showError("timezone") && <p className="text-red-500 text-sm mt-1">{errors.timezone?.message}</p>}
      </div>

      {/* Session Format */}
      <input type="hidden" {...register("sessionFormat")} />
      <div className="mb-6">
        <h3 className="font-medium mb-2">Preferred Session Format</h3>
        <div className="grid grid-cols-3 gap-3">
          {SESSION_FORMATS.map((format) => {
            const active = selectedFormat === format
            return (
              <button
                key={format}
                type="button"
                onClick={() => selectFormat(format)}
                className={`p-4 rounded-xl border transition ${active ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
              >
                {format}
              </button>
            )
          })}
        </div>
        {showError("sessionFormat") && <p className="text-red-500 text-sm mt-1">{errors.sessionFormat?.message}</p>}
      </div>

      {/* Discovery Call Booking Link */}
<div className="mb-6">
  <label className="block font-medium mb-2">
    Discovery Call Booking Link <span className="text-red-500">*</span>
  </label>
  <input
    {...register("calendlyUrl")}
    placeholder="https://calendly.com/....."
    className={`w-full border p-3 rounded-lg ${showError("calendlyUrl") ? "border-red-500" : "border-gray-300"}`}
  />
  {showError("calendlyUrl") && (
    <p className="text-red-500 text-sm mt-1">{errors.calendlyUrl?.message}</p>
  )}
</div>

      {/* Duration */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Typical Session Duration</label>
        <select
          {...register("sessionDuration")}
          className={`w-full border p-3 rounded-lg ${showError("sessionDuration") ? "border-red-500" : "border-gray-300"}`}
        >
          <option value="">Select Duration</option>
          <option value="30">30 Minutes</option>
          <option value="45">45 Minutes</option>
          <option value="60">60 Minutes</option>
          <option value="90">90 Minutes</option>
        </select>
        {showError("sessionDuration") && <p className="text-red-500 text-sm mt-1">{errors.sessionDuration?.message}</p>}
      </div>

      {/* Preferred Currency */}
<div className="mb-6">
  <label className="block font-medium mb-2">
    Preferred Currency <span className="text-red-500">*</span>
  </label>
  <div className="grid grid-cols-2 gap-3">
    {(["INR", "USD"] as const).map((currency) => {
      const active = watch("preferredCurrency") === currency
      return (
        <button
          key={currency}
          type="button"
          onClick={() => setValue("preferredCurrency", currency, {
            shouldValidate: true,
            shouldTouch: true,
            shouldDirty: true,
          })}
          className={`p-4 rounded-xl border transition flex items-center justify-center gap-2 ${
            active ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold" : "border-gray-200 text-gray-700"
          }`}
        >
          <span className="text-lg">{currency === "INR" ? "₹" : "$"}</span>
          <span>{currency === "INR" ? "INR — Indian Rupee" : "USD — US Dollar"}</span>
        </button>
      )
    })}
  </div>
  {showError("preferredCurrency") && (
    <p className="text-red-500 text-sm mt-1">{errors.preferredCurrency?.message}</p>
  )}
</div>

{/* Pricing */}
<div className="mb-6">
  <label className="block font-medium mb-2">Pricing Range</label>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">
        Min Price {watch("preferredCurrency") === "INR" ? "(₹)" : "($)"}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          {watch("preferredCurrency") === "INR" ? "₹" : "$"}
        </span>
        <input
          type="number"
          {...register("priceMin", { valueAsNumber: true })}
          className={`border p-3 pl-8 rounded-lg w-full ${showError("priceMin") ? "border-red-500" : "border-gray-300"}`}
        />
      </div>
      {showError("priceMin") && <p className="text-red-500 text-sm mt-1">{errors.priceMin?.message}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">
        Max Price {watch("preferredCurrency") === "INR" ? "(₹)" : "($)"}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          {watch("preferredCurrency") === "INR" ? "₹" : "$"}
        </span>
        <input
          type="number"
          {...register("priceMax", { valueAsNumber: true })}
          className={`border p-3 pl-8 rounded-lg w-full ${showError("priceMax") ? "border-red-500" : "border-gray-300"}`}
        />
      </div>
      {showError("priceMax") && <p className="text-red-500 text-sm mt-1">{errors.priceMax?.message}</p>}
    </div>
  </div>
</div>

      <div className="flex justify-between mt-8">
        <button type="button" onClick={back} className="px-5 py-2 rounded-lg border hover:bg-gray-100">
          Back
        </button>
        <button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
          Save & Continue
        </button>
      </div>
    </div>
  )
}