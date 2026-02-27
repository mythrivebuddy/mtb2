// // // "use client";

// // // import { useState, useEffect } from "react";
// // // import { useSession } from "next-auth/react";
// // // import { useForm, SubmitHandler } from "react-hook-form";
// // // import axios from "axios";
// // // import AppLayout from "@/components/layout/AppLayout";
// // // import { Loader2 } from "lucide-react";
// // // import CompletionBar from "@/components/userBusinessProfile/CompletionBar";
// // // import ProfileDisplay from "@/components/userBusinessProfile/ProfileDisplay";
// // // import ProfileEdit from "@/components/userBusinessProfile/ProfileEdit";
// // // import { toast } from "sonner";
// // // import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// // // import PageLoader from "@/components/PageLoader";
// // // import { type BusinessProfile } from "@/types/client/business-profile";

// // // // Fallback profile object to use when API returns no profile
// // // const defaultProfile: BusinessProfile = {
// // //   name: "",
// // //   businessInfo: "",
// // //   missionStatement: "",
// // //   goals: "",
// // //   keyOfferings: "",
// // //   achievements: "",
// // //   email: "",
// // //   phone: "",
// // //   website: "",
// // //   socialHandles: {
// // //     linkedin: "",
// // //     instagram: "",
// // //     x: "",
// // //     youtube: "",
// // //     facebook: "",
// // //     tiktok: "",
// // //   },
// // //   featuredWorkTitle: "",
// // //   featuredWorkDesc: "",
// // //   featuredWorkImage: "",
// // //   priorityContactLink: "",
// // //   completionPercentage: 0,
// // // };

// // // const BusinessProfile = () => {
// // //   const { data: session, status } = useSession();
// // //   const userId = session?.user?.id;
// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [selectedFile, setSelectedFile] = useState<File | null>(null);
// // //   const [imagePreview, setImagePreview] = useState<string | null>(null);

// // //   const queryClient = useQueryClient();

// // //   // Fetch profile data with useQuery
// // //   const { data: profile, isLoading: queryLoading } = useQuery<BusinessProfile>({
// // //     queryKey: ["profile", userId],
// // //     queryFn: async () => {
// // //       const res = await axios.get(
// // //         `/api/user/profile/getProfile?userId=${userId}`,
// // //       );
// // //       // If API returns no profile, fallback to defaultProfile
// // //       return res.data.profile ?? defaultProfile;
// // //     },
// // //     enabled: !!userId, // Only fetch when userId is available
// // //     placeholderData: defaultProfile,
// // //   });
// // //   console.log({
// // //     profile,
// // //   });

// // //   // Automatically switch to edit mode if profile.name is empty
// // //   useEffect(() => {
// // //     if (queryLoading) return;

// // //     const hasExistingSpotlight =
// // //       !!profile?.featuredWorkTitle ||
// // //       !!profile?.featuredWorkDesc ||
// // //       !!profile?.featuredWorkImage;

// // //     // Requirement:
// // //     // If spotlight exists → open edit with pre-filled data
// // //     // If not → also open edit (new user)
// // //     setIsEditing(hasExistingSpotlight);
// // //   }, [profile, queryLoading]);

// // //   // Update profile data with useMutation
// // //   const mutation = useMutation({
// // //     mutationFn: (formData: FormData) =>
// // //       axios.put(`/api/user/profile/updateProfile?userId=${userId}`, formData, {
// // //         headers: { "Content-Type": "multipart/form-data" },
// // //       }),
// // //     onSuccess: () => {
// // //       queryClient.invalidateQueries({ queryKey: ["profile", userId] }); // Refetch profile data
// // //       toast.success("Profile updated successfully!");
// // //       setIsEditing(false);
// // //       setSelectedFile(null); // Clear selected file after submission
// // //     },
// // //     onError: () => {
// // //       toast.error("Error updating profile. Please try again.");
// // //     },
// // //   });

// // //   const {
// // //     register,
// // //     handleSubmit,
// // //     reset,
// // //     formState: { errors },
// // //   } = useForm<BusinessProfile>({
// // //     defaultValues: defaultProfile,
// // //   });

// // //   const commonClassName =
// // //     "w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80";

// // //   // Reset form with fetched profile data
// // //   useEffect(() => {
// // //     if (!profile) return;

// // //     reset({
// // //       ...profile,
// // //       socialHandles: Object.fromEntries(
// // //         Object.entries(profile.socialHandles || {}).map(([platform, url]) => [
// // //           platform,
// // //           typeof url === "string" ? url.replace(/^https?:\/\//, "") : "",
// // //         ]),
// // //       ),
// // //       priorityContactLink: profile.priorityContactLink
// // //         ? profile.priorityContactLink.replace(/^https?:\/\//, "")
// // //         : "",
// // //     });

// // //     setImagePreview(profile.featuredWorkImage || null);
// // //   }, [profile, reset]); 

// // //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// // //     if (e.target.files?.[0]) {
// // //       const file = e.target.files[0];
// // //       setSelectedFile(file);
// // //       setImagePreview(URL.createObjectURL(file));
// // //     }
// // //   };

// // //   const onSubmit: SubmitHandler<BusinessProfile> = (data) => {
// // //     const formData = new FormData();
// // //     Object.entries(data).forEach(([key, value]) => {
// // //       if (key === "socialHandles") {
// // //         const normalizedHandles: Record<string, string> = {};
// // //         Object.entries(value || {}).forEach(([platform, url]) => {
// // //           if (typeof url === "string" && url.trim()) {
// // //             normalizedHandles[platform] =
// // //               url.startsWith("http://") || url.startsWith("https://")
// // //                 ? url
// // //                 : `https://${url}`;
// // //           }
// // //         });
// // //         formData.append(key, JSON.stringify(normalizedHandles));
// // //       } else if (
// // //         key === "priorityContactLink" &&
// // //         typeof value === "string" &&
// // //         value.trim()
// // //       ) {
// // //         const normalizedLink =
// // //           value.startsWith("http://") || value.startsWith("https://")
// // //             ? value
// // //             : `https://${value}`;
// // //         formData.append(key, normalizedLink);
// // //       } else if (
// // //         key !== "featuredWorkImage" &&
// // //         value !== undefined &&
// // //         value !== null
// // //       ) {
// // //         formData.append(key, value.toString());
// // //       }
// // //     });
// // //     if (selectedFile) {
// // //       formData.append("featuredWorkImage", selectedFile, selectedFile.name);
// // //     }
// // //     mutation.mutate(formData);
// // //   };

// // //   // Use mutation.isPending for React Query v5
// // //   const loading = queryLoading || mutation.isPending;

// // //   if (status === "loading") {
// // //     return <PageLoader />;
// // //   }

// // //   if (!session) {
// // //     return (
// // //       <div className="p-6 text-center">
// // //         <AppLayout>Please log in to view your profile.</AppLayout>
// // //       </div>
// // //     );
// // //   }
// // //   const safeProfile: BusinessProfile | null = profile ?? null;

// // //   return (
// // //     <div className="flex-1 px-4 md:py-8">
// // //       <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
// // //         Business Profile
// // //       </h1>
// // //       <CompletionBar percentage={profile?.completionPercentage ?? 0} />
// // //       {loading && (
// // //         <div className="mb-4 flex justify-center items-center">
// // //           <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
// // //         </div>
// // //       )}
// // //       {!isEditing ? (
// // //         <ProfileDisplay
// // //           profileData={safeProfile}
// // //           onEditClick={() => setIsEditing(true)}
// // //         />
// // //       ) : (
// // //         <ProfileEdit
// // //           onCancel={() => setIsEditing(false)}
// // //           onSubmit={handleSubmit(onSubmit)}
// // //           register={register}
// // //           errors={errors}
// // //           commonClassName={commonClassName}
// // //           handleFileChange={handleFileChange}
// // //           imagePreview={imagePreview}
// // //         />
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default BusinessProfile;

// // "use client"

// // import { useEffect, useState } from "react"
// // import { useForm, FormProvider } from "react-hook-form"
// // import { zodResolver } from "@hookform/resolvers/zod"
// // import { useMutation } from "@tanstack/react-query"

// // import {
// //   businessProfileSchema,
// //   BusinessProfileFormValues,
// // } from "@/schema/zodSchema"

// // import Step1Identity from "./steps/Step1Identity"
// // import Step2Transformation from "./steps/Step2Transformation"
// // import ProgressBar from "./PrgressBar"
// // import Step3Methodology from "./steps/Step3Methodology"
// // import Step4Authority from "./steps/Step4Authority"
// // import Step5Services from "./steps/Step5Services"
// // import Step6Pricing from "./steps/Step6Pricing"
// // import Step7Review from "./steps/Step7Review"

// // const STORAGE_KEY = "business_profile_draft"

// // export default function BusinessProfileLayout() {
// //   const [step, setStep] = useState(1)

// //   const methods = useForm<BusinessProfileFormValues>({
// //     resolver: zodResolver(businessProfileSchema),
// //     defaultValues: {
// //       coachingDomains: [],
// //       targetAudience: [],
// //       sessionStyles: [],
// //       typicalResults: [],
// //     },
// //     mode: "onChange",
// //   })

// //   const { watch, reset, handleSubmit } = methods

// //   // 🔹 Load Draft
// //   useEffect(() => {
// //     const saved = localStorage.getItem(STORAGE_KEY)
// //     if (saved) {
// //       reset(JSON.parse(saved))
// //     }
// //   }, [reset])

// //   // 🔹 Auto Save Draft
// //   useEffect(() => {
// //     const subscription = watch((value) => {
// //       localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
// //     })
// //     return () => subscription.unsubscribe()
// //   }, [watch])

// //   // 🔹 React Query Mutation
// //   const mutation = useMutation({
// //     mutationFn: async (data: BusinessProfileFormValues) => {
// //       const res = await fetch("/api/business-profile", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(data),
// //       })
// //       if (!res.ok) throw new Error("Failed to save")
// //       return res.json()
// //     },
// //     onSuccess: () => {
// //       localStorage.removeItem(STORAGE_KEY)
// //       alert("Profile Saved 🎉")
// //     },
// //   })

// //   const onSubmit = (data: BusinessProfileFormValues) => {
// //     mutation.mutate(data)
// //   }

// //   return (
// //     <FormProvider {...methods}>
// //       <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6">

// //         <ProgressBar step={step} />

// //         {step === 1 && <Step1Identity next={() => setStep(2)} />}
// //         {step === 2 && <Step2Transformation next={() => setStep(3)} back={() => setStep(1)} />}
// //         {step === 3 && <Step3Methodology next={() => setStep(4)} back={() => setStep(2)} />}
// //         {step === 4 && <Step4Authority next={() => setStep(5)} back={() => setStep(3)} />}
// //         {step === 5 && <Step5Services next={() => setStep(6)} back={() => setStep(4)} />}
// //         {step === 6 && <Step6Pricing next={() => setStep(7)} back={() => setStep(5)} />}
// //         {step === 7 && <Step7Review back={() => setStep(6)} isLoading={mutation.isPending} />}

// //       </form>
// //     </FormProvider>
// //   )
// // }

// "use client"

// import { useEffect, useState } from "react"
// import { useSession } from "next-auth/react"
// import { useForm, FormProvider } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useMutation, useQueryClient } from "@tanstack/react-query"
// import { toast } from "sonner"

// import {
//   businessProfileSchema,
//   BusinessProfileFormValues,
// } from "@/schema/zodSchema"

// import Step1Identity from "./steps/Step1Identity"
// import Step2Transformation from "./steps/Step2Transformation"
// import Step3Methodology from "./steps/Step3Methodology"
// import Step4Authority from "./steps/Step4Authority"
// import Step5Services from "./steps/Step5Services"
// import Step6Pricing from "./steps/Step6Pricing"
// import Step7Review from "./steps/Step7Review"
// import ProgressBar from "./PrgressBar"
// import PageLoader from "@/components/PageLoader"

// const STORAGE_KEY = "business_profile_draft"

// export default function BusinessProfileLayout() {
//   const { data: session, status } = useSession()
//   const userId = session?.user?.id

//   const [step, setStep] = useState(1)
//   const queryClient = useQueryClient()

//   const methods = useForm<BusinessProfileFormValues>({
//     resolver: zodResolver(businessProfileSchema),
//     mode: "onSubmit", // only validate on submit per step
//     defaultValues: {
//       coachingDomains: [],
//       targetAudience: [],
//       sessionStyles: [],
//       typicalResults: [],
//       servicesOffered: [],
//       languages: [],
//       certifications: [],
//       testimonials: [],
//     },
//   })

//   const { watch, reset } = methods

//   /* ---------------- LOAD DRAFT ---------------- */
//   useEffect(() => {
//     const saved = localStorage.getItem(STORAGE_KEY)
//     if (saved) {
//       reset(JSON.parse(saved))
//     }
//   }, [reset])

//   /* ---------------- AUTO SAVE ---------------- */
//   useEffect(() => {
//     const subscription = watch((value) => {
//       localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
//     })
//     return () => subscription.unsubscribe()
//   }, [watch])

//   /* ---------------- SUBMIT MUTATION ---------------- */
//   // const mutation = useMutation({
//   //   mutationFn: async (data: BusinessProfileFormValues) => {
//   //     const res = await fetch(`/api/user/profile/updateProfile?userId=${userId}`, {
//   //       method: "put",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({
//   //         ...data,
//   //         userId,
//   //       }),
//   //     })

//   //     if (!res.ok) throw new Error("Failed to save profile")

//   //     return res.json()
//   //   },
//   //   onSuccess: () => {
//   //     localStorage.removeItem("business_profile_draft")
//   //     queryClient.invalidateQueries({ queryKey: ["profile", userId] })
//   //     toast.success("Profile saved successfully 🎉")
//   //   },
//   //   onError: () => {
//   //     toast.error("Something went wrong. Please try again.")
//   //   },
//   // })
// const mutation = useMutation({
//   mutationFn: async (data: BusinessProfileFormValues) => {
//     if (!userId) throw new Error("User not authenticated")

//     // const formData = new FormData()

//     // Object.entries(data).forEach(([key, value]) => {
//     //   if (value === undefined || value === null) return

//     //   // If it's a File → append directly
//     //   if (value instanceof File) {
//     //     formData.append(key, value)
//     //   }

//     //   // If array or object → stringify
//     //   else if (Array.isArray(value) || typeof value === "object") {
//     //     formData.append(key, JSON.stringify(value))
//     //   }

//     //   else {
//     //     formData.append(key, String(value))
//     //   }
//     // })

// const formData = new FormData()

// Object.entries(data).forEach(([key, value]) => {
//   if (!value) return
//   // 🔥 ONLY treat it as file if it actually is one
//   if (value instanceof File) {
//     console.log("Is File:", values.profilePhoto instanceof File);
//     formData.append(key, value)
//   }

//   // Skip empty object (this is your current issue)
//   else if (
//     typeof value === "object" &&
//     !(value instanceof File)
//   ) {
//     // If it's empty object, skip it
//     if (Object.keys(value).length === 0) return

//     formData.append(key, JSON.stringify(value))
//   }

//   else {
//     formData.append(key, String(value))
//   }
// })

//     formData.append("userId", userId)

//     const res = await fetch(
//       `/api/user/profile/updateProfile?userId=${userId}`,
//       {
//         method: "PUT",
//         body: formData,
//       }
//     )

//     if (!res.ok) throw new Error("Failed to save profile")
//     return res.json()
//   },
// })
//   const onSubmit = () => {
//     // console.log("Submitting data:", localStorage.getItem("business_profile_draft"))
//     if (!userId) {
//       toast.error("User not authenticated")
//       return
//     }
//     mutation.mutate(JSON.parse(localStorage.getItem("business_profile_draft")!))
//   }

//   /* ---------------- SESSION GUARD ---------------- */

//   if (status === "loading") return <PageLoader />

//   if (!session) {
//     return (
//       <div className="p-6 text-center">
//         Please log in to create your business profile.
//       </div>
//     )
//   }

//   /* ---------------- RENDER ---------------- */

//   return (
//     <FormProvider {...methods}>
//       <form
//         // onSubmit={handleSubmit(onSubmit)}
//         className="max-w-4xl mx-auto p-6"
//       >
//         <ProgressBar step={step} />

//         {step === 1 && <Step1Identity next={() => setStep(2)} />}

//         {step === 2 && (
//           <Step2Transformation
//             next={() => setStep(3)}
//             back={() => setStep(1)}
//           />
//         )}

//         {step === 3 && (
//           <Step3Methodology
//             next={() => setStep(4)}
//             back={() => setStep(2)}
//           />
//         )}

//         {step === 4 && (
//           <Step4Authority
//             next={() => setStep(5)}
//             back={() => setStep(3)}
//           />
//         )}

//         {step === 5 && (
//           <Step5Services
//             next={() => setStep(6)}
//             back={() => setStep(4)}
//           />
//         )}

//         {step === 6 && (
//           <Step6Pricing
//             next={() => setStep(7)}
//             back={() => setStep(5)}
//           />
//         )}

//         {step === 7 && (
//           <Step7Review
//             back={() => setStep(6)}
//             submit={onSubmit}
//             isLoading={mutation.isPending}
//           />
//         )}
//       </form>
//     </FormProvider>
//   )
// }

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
import PageLoader from "@/components/PageLoader"

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
      profilePhoto: undefined, // IMPORTANT
    },
  })

  const { watch, reset, handleSubmit } = methods

//   function cleanNulls(obj: any) {
//   if (Array.isArray(obj)) {
//     return obj.map(cleanNulls)
//   }

//   if (obj !== null && typeof obj === "object") {
//     const cleaned: any = {}
//     Object.keys(obj).forEach((key) => {
//       const value = obj[key]

//       if (value === null) {
//         cleaned[key] = undefined
//       } else {
//         cleaned[key] = cleanNulls(value)
//       }
//     })
//     return cleaned
//   }

//   return obj
// }
function cleanNulls<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanNulls(item)) as unknown as T
  }

  if (obj !== null && typeof obj === "object") {
    const cleaned = {} as Record<string, unknown>

    Object.keys(obj as Record<string, unknown>).forEach((key) => {
      const value = (obj as Record<string, unknown>)[key]

      if (value === null) {
        cleaned[key] = undefined
      } else {
        cleaned[key] = cleanNulls(value)
      }
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
        const res = await fetch(
          `/api/user/profile/getProfile?userId=${userId}`
        )
        // console.log(res)
        if (res.ok) {
          const data = await res.json()
          console.log("data.profile", data.profile)
          if (data.profile) {
            const cleanedProfile = cleanNulls(data.profile)
  // methods.reset(cleanedProfile)
  methods.reset({
  ...cleanedProfile,
  testimonials: Array.isArray(cleanedProfile.testimonials)
    ? cleanedProfile.testimonials
    : [],
  certifications: Array.isArray(cleanedProfile.certifications)
    ? cleanedProfile.certifications
    : [],
})
  setProfileLoaded(true)
            // localStorage.setItem(
            //   STORAGE_KEY,
            //   JSON.stringify(data.profile)
            // )

            // const cleanedProfile = cleanNulls(data.profile)

            // methods.reset(cleanedProfile)

          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
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
  // useEffect(() => {
  //   const saved = localStorage.getItem(STORAGE_KEY)
  //   if (!saved) return

  //   const parsed = JSON.parse(saved)

  //   // ⚠️ Never restore file from localStorage
  //   delete parsed.profilePhoto

  //   reset(parsed)
  // }, [reset])

  /* ---------------- AUTO SAVE (SAFE) ---------------- */

  useEffect(() => {
    const subscription = watch((value) => {
      const safeData = { ...value }

      // ⚠️ Never save File to localStorage
      if (safeData.profilePhoto instanceof File) {
        delete safeData.profilePhoto
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(safeData)
      )
    })

    return () => subscription.unsubscribe()
  }, [watch])

  /* ---------------- MUTATION ---------------- */

  const mutation = useMutation({
    mutationFn: async (data: BusinessProfileFormValues) => {
      if (!userId) throw new Error("User not authenticated")

      const formData = new FormData()

      // Object.entries(data).forEach(([key, value]) => {
      //   if (
      //     value === undefined ||
      //     value === null ||
      //     value === ""
      //   ) return

      //   if (value instanceof File) {
      //     formData.append(key, value)
      //   }

      //   else if (Array.isArray(value)) {
      //     formData.append(key, JSON.stringify(value))
      //   }

      //   else if (typeof value === "object") {
      //     formData.append(key, JSON.stringify(value))
      //   }

      //   else {
      //     formData.append(key, String(value))
      //   }
      // })
      Object.entries(data).forEach(([key, value]) => {
  if (value === undefined || value === null || value === "") return

  // 1️⃣ File → upload
  if (value instanceof File) {
    formData.append(key, value)
    return
  }

  // 2️⃣ Existing photo URL (string)
  if (key === "profilePhoto" && typeof value === "string") {
    formData.append(key, value)
    return
  }

  // 3️⃣ Arrays
  if (Array.isArray(value)) {
    formData.append(key, JSON.stringify(value))
    return
  }

  // 4️⃣ Objects
  if (typeof value === "object") {
    formData.append(key, JSON.stringify(value))
    return
  }

  // 5️⃣ Everything else
  formData.append(key, String(value))
})

      formData.append("userId", userId)

      const res = await fetch(
        `/api/user/profile/updateProfile?userId=${userId}`,
        {
          method: "PUT",
          body: formData,
        }
      )

      if (!res.ok) throw new Error("Failed to save profile")

      return res.json()
    },

    onSuccess: () => {
      localStorage.removeItem(STORAGE_KEY)
      queryClient.invalidateQueries({
        queryKey: ["profile", userId],
      })
      toast.success("Profile saved successfully 🎉")
    },

    onError: () => {
      toast.error("Something went wrong. Please try again.")
    },
  })

  /* ---------------- SUBMIT ---------------- */

  const onSubmit = (data: BusinessProfileFormValues) => {
    mutation.mutate(data) // 🔥 submit directly from RHF
  }

  /* ---------------- SESSION GUARD ---------------- */

  if (status === "loading") return <PageLoader />

  if (!session) {
    return (
      <div className="p-6 text-center">
        Please log in to create your business profile.
      </div>
    )
  }

  /* ---------------- RENDER ---------------- */

  if (!profileLoaded) return <PageLoader />

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)} // 🔥 IMPORTANT
        className="max-w-4xl mx-auto p-6"
      >
        <ProgressBar step={step} />

        {step === 1 && <Step1Identity next={() => setStep(2)} />}
        {step === 2 && (
          <Step2Transformation
            next={() => setStep(3)}
            back={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Methodology
            next={() => setStep(4)}
            back={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Authority
            next={() => setStep(5)}
            back={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Step5Services
            next={() => setStep(6)}
            back={() => setStep(4)}
          />
        )}
        {step === 6 && (
          <Step6Pricing
            next={() => setStep(7)}
            back={() => setStep(5)}
          />
        )}
        {step === 7 && (
          <Step7Review
            back={() => setStep(6)}
            submit={handleSubmit(onSubmit)}
            isLoading={mutation.isPending}
          />
        )}
      </form>
    </FormProvider>
  )
}