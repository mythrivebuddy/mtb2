import { useFormContext } from "react-hook-form"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export interface Step6TrustValues {
  profilePhoto: File | string
  introVideo?: string
  linkedin?: string
}

interface Step6TrustProps {
  back: () => void
  submit: () => void
  isLoading: boolean
}

export default function Step7Trust({
  back,
  submit,
  isLoading
}: Step6TrustProps) {
  const {
    register,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useFormContext<Step6TrustValues>()

  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    const storedData = localStorage.getItem(
      process.env.LOCALSTORAGE_PROFILE_KEY || "business_profile_draft"
    )
    if (storedData) {
      const data = JSON.parse(storedData)
      if (data.profilePhoto) {
        setPreview(data.profilePhoto)
        setValue("profilePhoto", data.profilePhoto)
      }
    }
  }, [setValue])

  /* =========================
     YOUTUBE → EMBED CONVERTER
  ==========================*/
  const convertToEmbedUrl = (url: string) => {
    if (!url) return url

    try {
      const parsed = new URL(url)

      // Already embed link
      if (parsed.pathname.includes("/embed/")) {
        return url
      }

      // Standard youtube link
      if (parsed.hostname.includes("youtube.com")) {
        const videoId = parsed.searchParams.get("v")
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`
        }
      }

      // Short youtu.be link
      if (parsed.hostname.includes("youtu.be")) {
        const videoId = parsed.pathname.replace("/", "")
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`
        }
      }

      return url
    } catch {
      return url
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValue("profilePhoto", file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPreview(null)
    setValue("profilePhoto", "")
  }

  /* =========================
     SUBMIT HANDLER UPDATED
  ==========================*/
  const handleSubmit = async () => {
    const valid = await trigger(["profilePhoto", "introVideo", "linkedin"])
    if (!valid) return

    const introVideoValue = getValues("introVideo")

    if (introVideoValue) {
      const embedUrl = convertToEmbedUrl(introVideoValue)
      setValue("introVideo", embedUrl)
    }

    submit()
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Build Trust Faster</h2>
        <p className="text-gray-500 mt-1">
          Coaches with photos and videos get 3x more inquiries.
          Let your personality shine through!
        </p>
      </div>

      {/* Profile Photo Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium">
            Profile Photo <span className="text-red-500">*</span>
          </label>

          <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
            REQUIRED
          </span>
        </div>

        <div className="border border-gray-200 rounded-xl p-6 flex items-center gap-6">
          <div className="relative w-24 h-24">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No Photo
                </div>
              )}
            </div>

            {preview && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-blue-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div className="flex-1">
            <p className="font-medium mb-1">
              Upload a professional headshot
            </p>
            <p className="text-sm text-gray-500 mb-3">
              JPG, PNG or GIF. Max size 5MB.
            </p>

            <div className="flex items-center gap-4">
              <div className="relative inline-block">
                <span className="text-blue-600 font-medium cursor-pointer">
                  Change Photo
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {preview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-red-500 font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            {errors.profilePhoto && (
              <p className="text-red-500 text-sm mt-2">
                {errors.profilePhoto.message as string}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Intro Video */}
      <div className="mb-4">
        <label className="block font-medium mb-1">
          Intro Video URL <span className="text-gray-400 text-sm">OPTIONAL</span>
        </label>

        <input
          {...register("introVideo")}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full border border-gray-200 p-3 rounded-lg"
        />

        {errors.introVideo && (
          <p className="text-red-500 text-sm mt-1">
            {errors.introVideo.message as string}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-1">
          Example: A 60-second video introducing your coaching style.
        </p>
      </div>

      {/* LinkedIn */}
      <div className="mb-6">
        <label className="block font-medium mb-1">
          Primary Social Link <span className="text-gray-400 text-sm">OPTIONAL</span>
        </label>

        <input
          {...register("linkedin")}
          placeholder="https://linkedin.com/in/username"
          className="w-full border border-gray-200 p-3 rounded-lg"
        />

        {errors.linkedin && (
          <p className="text-red-500 text-sm mt-1">
            {errors.linkedin.message as string}
          </p>
        )}
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
          onClick={handleSubmit}
          className="flex bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Submit
          {isLoading && (
            <Loader2 className="ml-2 h-4 w-4 my-1 animate-spin" />
          )}
        </button>
      </div>
    </div>
  )
}