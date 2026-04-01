"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  businessProfileSchema,
  BusinessProfileFormValues,
} from "@/schema/zodSchema"

import Step1Identity from "./steps/Step1Identity"
import Step2Transformation from "./steps/Step2Transformation"
import Step3Methodology from "./steps/Step3Methodology"
import Step4Authority from "./steps/Step4Authority"
import Step5Services from "./steps/Step5Services"
import Step6Pricing from "./steps/Step6Pricing"
import Step7Review from "./steps/Step7Review"
import ProgressBar from "./PrgressBar"
import { Loader2 } from "lucide-react"

const STORAGE_KEY = process.env.LOCALSTORAGE_PROFILE_KEY || "business_profile_draft"

export default function BusinessProfileLayout() {
  const { data: session, status } = useSession()
  const userId = session?.user?.id

  const [step, setStep] = useState(1)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const queryClient = useQueryClient()

  const methods = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    mode: "onSubmit",
    defaultValues: {
      coachingDomains: [],
      targetAudience: [],
      sessionStyles: [],
      typicalResults: [],
      servicesOffered: [],
      languages: [],
      certifications: [],
      testimonials: [],
      profilePhoto: undefined,
    },
  })

  const { watch, reset, getValues } = methods

  function cleanNulls<T>(obj: T): T {
    if (Array.isArray(obj)) {
      return obj.map((item) => cleanNulls(item)) as unknown as T
    }
    if (obj !== null && typeof obj === "object") {
      const cleaned = {} as Record<string, unknown>
      Object.keys(obj as Record<string, unknown>).forEach((key) => {
        const value = (obj as Record<string, unknown>)[key]
        cleaned[key] = value === null ? undefined : cleanNulls(value)
      })
      return cleaned as T
    }
    return obj
  }

  /* ---------------- FETCH PROFILE ON LOAD ---------------- */

  useEffect(() => {
    if (!userId || status !== "authenticated") return

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/user/profile/getProfile?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            const cleanedProfile = cleanNulls(data.profile)
            methods.reset({
              ...cleanedProfile,
              testimonials: Array.isArray(cleanedProfile.testimonials)
                ? cleanedProfile.testimonials
                : [],
              certifications: Array.isArray(cleanedProfile.certifications)
                ? cleanedProfile.certifications
                : [],
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setProfileLoaded(true)
      }
    }

    fetchProfile()
  }, [userId, status])

  /* ---------------- LOAD DRAFT (SAFE) ---------------- */

  useEffect(() => {
    if (profileLoaded) return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const parsed = JSON.parse(saved)
    delete parsed.profilePhoto
    reset(parsed)
  }, [reset, profileLoaded])

  /* ---------------- AUTO SAVE (SAFE) ---------------- */

  useEffect(() => {
    const subscription = watch((value) => {
      const safeData = { ...value }
      if (safeData.profilePhoto instanceof File) {
        delete safeData.profilePhoto
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  /* ---------------- MUTATION ---------------- */

  const mutation = useMutation({
    mutationFn: async (data: BusinessProfileFormValues) => {
      if (!userId) throw new Error("User not authenticated")

      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return
        if (value instanceof File) { formData.append(key, value); return }
        if (key === "profilePhoto" && typeof value === "string") { formData.append(key, value); return }
        if (Array.isArray(value)) { formData.append(key, JSON.stringify(value)); return }
        if (typeof value === "object") { formData.append(key, JSON.stringify(value)); return }
        formData.append(key, String(value))
      })

      formData.append("userId", userId)
      formData.append("calendlyUrl", data.calendlyUrl)
      formData.append("preferredCurrency", data.preferredCurrency)
      const res = await fetch(`/api/user/profile/updateProfile?userId=${userId}`, {
        method: "PUT",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to save profile")
      return res.json()
    },

    onSuccess: () => {
      localStorage.removeItem(STORAGE_KEY)
      queryClient.invalidateQueries({ queryKey: ["profile", userId] })
      toast.success("Profile saved successfully 🎉")
      window.open(`/profile/${userId}`, "_blank")
    },

    onError: () => {
      toast.error("Something went wrong. Please try again.")
    },
  })

  /* ---------------- FINAL SUBMIT ---------------- */
  // Directly calls mutation with getValues() — skips RHF handleSubmit
  // because handleSubmit validates ALL fields including earlier steps,
  // which silently blocks submission if any step has an issue.
  const handleFinalSubmit = () => {
    const data = getValues()
    console.log("handleFinalSubmit called", data)
    mutation.mutate(data as BusinessProfileFormValues)
  }

  /* ---------------- SESSION GUARD ---------------- */

  if (status === "loading") return <div className="h-[700px] py-16 flex justify-center items-center">
        <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
      </div>

  if (!session) {
    return (
      <div className="p-6 text-center">
        Please log in to create your business profile.
      </div>
    )
  }

  /* ---------------- RENDER ---------------- */

  if (!profileLoaded) return <div className="h-[700px] py-16 flex justify-center items-center">
          <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
        </div>

  return (
    <FormProvider {...methods}>
      <div className="max-w-8xl mx-auto p-6">
        <ProgressBar step={step} onStepClick={(s) => setStep(s)} />

        {step === 1 && <Step1Identity next={() => setStep(2)} />}
        {step === 2 && (
          <Step2Transformation next={() => setStep(3)} back={() => setStep(1)} />
        )}
        {step === 3 && (
          <Step3Methodology next={() => setStep(4)} back={() => setStep(2)} />
        )}
        {step === 4 && (
          <Step4Authority next={() => setStep(5)} back={() => setStep(3)} />
        )}
        {step === 5 && (
          <Step5Services next={() => setStep(6)} back={() => setStep(4)} />
        )}
        {step === 6 && (
          <Step6Pricing next={() => setStep(7)} back={() => setStep(5)} />
        )}
        {step === 7 && (
          <Step7Review
            back={() => setStep(6)}
            submit={handleFinalSubmit}
            isLoading={mutation.isPending}
          />
        )}
      </div>
    </FormProvider>
  )
}