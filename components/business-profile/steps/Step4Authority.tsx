// // import { useFormContext, useFieldArray } from "react-hook-form"

// // export default function Step4Authority({ next, back }) {
// //   const { register, control, watch, trigger } = useFormContext()

// //   const {
// //     fields: certFields,
// //     append: addCert,
// //     remove: removeCert,
// //   } = useFieldArray({
// //     control,
// //     name: "certifications",
// //   })

// //   const {
// //     fields: testimonialFields,
// //     append: addTestimonial,
// //     remove: removeTestimonial,
// //   } = useFieldArray({
// //     control,
// //     name: "testimonials",
// //   })

// //   const shortBio = watch("shortBio") || ""

// //   const handleNext = async () => {
// //    const valid = await trigger([
// //   "yearsOfExperience",
// //   "certifications",
// //   "shortBio",
// //   "testimonials",
// // ])
// //     if (valid) next()
// //   }

// //   return (
// //     <div className="bg-white p-6 rounded-xl shadow">

// //       <h2 className="text-xl font-semibold mb-6">
// //         Establish Your Authority
// //       </h2>

// //       {/* Years */}
// //       <select
// //   {...register("yearsOfExperience", { valueAsNumber: true })}
// //         className="w-full border p-3 rounded-lg mb-4"
// //       >
// //         <option value={0}>0+ Years</option>
// //         <option value={2}>2+ Years</option>
// //         <option value={5}>5+ Years</option>
// //         <option value={10}>10+ Years</option>
// //       </select>

// //       {/* Certifications */}
// //       <div className="mb-4">
// //         <h3 className="font-medium mb-2">Certifications</h3>

// //         {certFields.map((field, index) => (
// //           <div key={field.id} className="flex gap-2 mb-2">
// //             <input
// //               {...register(`certifications.${index}`)}
// //               className="flex-1 border p-2 rounded"
// //             />
// //             <button
// //               type="button"
// //               onClick={() => removeCert(index)}
// //               className="text-red-500"
// //             >
// //               ✕
// //             </button>
// //           </div>
// //         ))}

// //         <button
// //           type="button"
// //           onClick={() => addCert("")}
// //           className="text-blue-600"
// //         >
// //           + Add More
// //         </button>
// //       </div>

// //       {/* Short Bio */}
// //       <textarea
// //         {...register("shortBio")}
// //         maxLength={250}
// //         className="w-full border p-3 rounded-lg mb-1"
// //         placeholder="Short Bio"
// //       />
// //       <p className="text-sm text-gray-500 mb-4">
// //         {shortBio.length}/250 words
// //       </p>

// //       {/* Testimonials */}
// //       <div>
// //         <h3 className="font-medium mb-2">Testimonials</h3>

// //         {testimonialFields.map((field, index) => (
// //           <div key={field.id} className="border p-3 rounded mb-3">
// //             <input
// //               {...register(`testimonials.${index}.name`)}
// //               placeholder="Client Name"
// //               className="w-full border p-2 rounded mb-2"
// //             />
// //             <input
// //               {...register(`testimonials.${index}.role`)}
// //               placeholder="Client Role"
// //               className="w-full border p-2 rounded mb-2"
// //             />
// //             <textarea
// //               {...register(`testimonials.${index}.content`)}
// //               placeholder="Testimonial"
// //               className="w-full border p-2 rounded"
// //             />
// //             <button
// //               type="button"
// //               onClick={() => removeTestimonial(index)}
// //               className="text-red-500 mt-2"
// //             >
// //               Remove
// //             </button>
// //           </div>
// //         ))}

// //         <button
// //           type="button"
// //           onClick={() =>
// //             addTestimonial({ name: "", role: "", content: "" })
// //           }
// //           className="text-blue-600"
// //         >
// //           + Add New Testimonial
// //         </button>
// //       </div>

// //       <div className="flex justify-between mt-6">
// //         <button onClick={back} type="button">
// //           Previous
// //         </button>

// //         <button
// //           type="button"
// //           onClick={handleNext}
// //           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
// //         >
// //           Save & Continue
// //         </button>
// //       </div>
// //     </div>
// //   )
// // }

// import { useFormContext, useFieldArray } from "react-hook-form"

// export default function Step4Authority({ next, back }) {
//   const {
//     register,
//     control,
//     watch,
//     trigger,
//     formState: { errors },
//   } = useFormContext()

//   const {
//     fields: certFields,
//     append: addCert,
//     remove: removeCert,
//   } = useFieldArray({
//     control,
//     name: "certifications",
//   })

//   const {
//     fields: testimonialFields,
//     append: addTestimonial,
//     remove: removeTestimonial,
//   } = useFieldArray({
//     control,
//     name: "testimonials",
//   })

//   const shortBio = watch("shortBio") || ""

//   const handleNext = async () => {
//     const valid = await trigger([
//       "yearsOfExperience",
//       "certifications",
//       "shortBio",
//       "testimonials",
//     ])
//     if (valid) next()
//   }

//   return (
//     <div className="bg-white p-6 rounded-xl shadow">

//       <h2 className="text-xl font-semibold mb-6">
//         Establish Your Authority
//       </h2>

//       {/* Years */}
//       <div className="mb-4">
//         <select
//           {...register("yearsOfExperience", { valueAsNumber: true })}
//           className={`w-full border p-3 rounded-lg
//             ${errors.yearsOfExperience ? "border-red-500" : "border-gray-300"}
//           `}
//         >
//           <option value="">Select Experience</option>
//           <option value={0}>0+ Years</option>
//           <option value={2}>2+ Years</option>
//           <option value={5}>5+ Years</option>
//           <option value={10}>10+ Years</option>
//         </select>

//         {errors.yearsOfExperience && (
//           <p className="text-red-500 text-sm mt-1">
//             {errors.yearsOfExperience.message as string}
//           </p>
//         )}
//       </div>

//       {/* Certifications */}
//       <div className="mb-6">
//         <h3 className="font-medium mb-2">Certifications</h3>

//         {certFields.map((field, index) => (
//           <div key={field.id} className="mb-2">
//             <div className="flex gap-2">
//               <input
//                 {...register(`certifications.${index}`)}
//                 className={`flex-1 border p-2 rounded
//                   ${
//                     errors.certifications?.[index]
//                       ? "border-red-500"
//                       : "border-gray-300"
//                   }
//                 `}
//                 placeholder="Enter certification"
//               />

//               <button
//                 type="button"
//                 onClick={() => removeCert(index)}
//                 className="text-red-500"
//               >
//                 ✕
//               </button>
//             </div>

//             {errors.certifications?.[index] && (
//               <p className="text-red-500 text-sm mt-1">
//                 {errors.certifications[index]?.message as string}
//               </p>
//             )}
//           </div>
//         ))}

//         <button
//           type="button"
//           onClick={() => addCert("")}
//           className="text-blue-600 text-sm mt-2"
//         >
//           + Add More
//         </button>
//       </div>

//       {/* Short Bio */}
//       <div className="mb-6">
//         <textarea
//           {...register("shortBio")}
//           maxLength={250}
//           placeholder="Short Bio"
//           className={`w-full border p-3 rounded-lg
//             ${errors.shortBio ? "border-red-500" : "border-gray-300"}
//           `}
//         />

//         <div className="flex justify-between">
//           {errors.shortBio ? (
//             <p className="text-red-500 text-sm">
//               {errors.shortBio.message as string}
//             </p>
//           ) : (
//             <div />
//           )}

//           <p className="text-sm text-gray-500">
//             {shortBio.length}/250
//           </p>
//         </div>
//       </div>

//       {/* Testimonials */}
//       <div className="mb-6">
//         <h3 className="font-medium mb-2">Testimonials</h3>

//         {/* Root array error */}
//         {errors.testimonials && !Array.isArray(errors.testimonials) && (
//           <p className="text-red-500 text-sm mb-2">
//             {errors.testimonials.message as string}
//           </p>
//         )}

//         {testimonialFields.map((field, index) => (
//           <div key={field.id} className="border p-4 rounded mb-4">

//             {/* Name */}
//             <input
//               {...register(`testimonials.${index}.name`)}
//               placeholder="Client Name"
//               className={`w-full border p-2 rounded mb-1
//                 ${
//                   errors.testimonials?.[index]?.name
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 }
//               `}
//             />
//             {errors.testimonials?.[index]?.name && (
//               <p className="text-red-500 text-sm mb-2">
//                 {errors.testimonials[index]?.name?.message as string}
//               </p>
//             )}

//             {/* Role */}
//             <input
//               {...register(`testimonials.${index}.role`)}
//               placeholder="Client Role"
//               className={`w-full border p-2 rounded mb-1
//                 ${
//                   errors.testimonials?.[index]?.role
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 }
//               `}
//             />
//             {errors.testimonials?.[index]?.role && (
//               <p className="text-red-500 text-sm mb-2">
//                 {errors.testimonials[index]?.role?.message as string}
//               </p>
//             )}

//             {/* Content */}
//             <textarea
//               {...register(`testimonials.${index}.content`)}
//               placeholder="Testimonial"
//               className={`w-full border p-2 rounded mb-1
//                 ${
//                   errors.testimonials?.[index]?.content
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 }
//               `}
//             />
//             {errors.testimonials?.[index]?.content && (
//               <p className="text-red-500 text-sm mb-2">
//                 {errors.testimonials[index]?.content?.message as string}
//               </p>
//             )}

//             <button
//               type="button"
//               onClick={() => removeTestimonial(index)}
//               className="text-red-500 text-sm mt-2"
//             >
//               Remove
//             </button>
//           </div>
//         ))}

//         <button
//           type="button"
//           onClick={() =>
//             addTestimonial({ name: "", role: "", content: "" })
//           }
//           className="text-blue-600 text-sm"
//         >
//           + Add New Testimonial
//         </button>
//       </div>

//       {/* Navigation */}
//       <div className="flex justify-between mt-6">
//         <button
//           onClick={back}
//           type="button"
//           className="text-gray-600"
//         >
//           Previous
//         </button>

//         <button
//           type="button"
//           onClick={handleNext}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
//         >
//           Save & Continue
//         </button>
//       </div>
//     </div>
//   )
// }

import { useFormContext, useFieldArray } from "react-hook-form"

export interface Step4AuthorityFormValues {
  yearsOfExperience: number | ""
  certifications: {
    value: string
  }[]
  shortBio: string
  testimonials: {
    name: string
    role: string
    content: string
  }[]
}
interface Step4AuthorityProps {
  next: () => void
  back: () => void
}

export default function Step4Authority({
  next,
  back,
}: Step4AuthorityProps) {
  const {
    register,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext<Step4AuthorityFormValues>()

  const {
    fields: certFields,
    append: addCert,
    remove: removeCert,
  } = useFieldArray<Step4AuthorityFormValues>({
  control,
  name: "certifications",
})

  const {
    fields: testimonialFields,
    append: addTestimonial,
    remove: removeTestimonial,
  } = useFieldArray<Step4AuthorityFormValues, "testimonials">({
    control,
    name: "testimonials",
  })

  const shortBio = watch("shortBio") || ""

  const handleNext = async () => {
    const valid = await trigger([
      "yearsOfExperience",
      "certifications",
      "shortBio",
      "testimonials",
    ])
     console.log("Is Valid:", valid)
  console.log("Errors:", errors)
    if (valid) next()
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-6">
        Establish Your Authority
      </h2>

      {/* Years */}
      <div className="mb-4">
        <select
          {...register("yearsOfExperience", { valueAsNumber: true })}
          className={`w-full border p-3 rounded-lg ${
            errors.yearsOfExperience ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select Experience</option>
          <option value={0}>0+ Years</option>
          <option value={2}>2+ Years</option>
          <option value={5}>5+ Years</option>
          <option value={10}>10+ Years</option>
        </select>

        {errors.yearsOfExperience && (
          <p className="text-red-500 text-sm mt-1">
            {errors.yearsOfExperience.message}
          </p>
        )}
      </div>

      {/* Certifications */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Certifications</h3>

        {certFields.map((field, index) => (
          <div key={field.id} className="mb-2">
            <div className="flex gap-2">
              <input
                {...register(`certifications.${index}.value`)}
                className={`flex-1 border p-2 rounded ${
                  errors.certifications?.[index]?.value
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter certification"
              />

              <button
                type="button"
                onClick={() => removeCert(index)}
                className="text-red-500"
              >
                ✕
              </button>
            </div>

            {errors.certifications?.[index]?.value && (
              <p className="text-red-500 text-sm mt-1">
                {errors.certifications[index]?.value?.message}
              </p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => addCert({ value: "" })}
          className="text-blue-600 text-sm mt-2"
        >
          + Add More
        </button>
      </div>

      {/* Short Bio */}
      <div className="mb-6">
        <textarea
          {...register("shortBio")}
          maxLength={250}
          placeholder="Short Bio"
          className={`w-full border p-3 rounded-lg ${
            errors.shortBio ? "border-red-500" : "border-gray-300"
          }`}
        />

        <div className="flex justify-between">
          {errors.shortBio ? (
            <p className="text-red-500 text-sm">
              {errors.shortBio.message}
            </p>
          ) : (
            <div />
          )}

          <p className="text-sm text-gray-500">
            {shortBio.length}/250
          </p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Testimonials</h3>

        {testimonialFields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded mb-4">
            {/* Name */}
            <input
              {...register(`testimonials.${index}.name`)}
              placeholder="Client Name"
              className={`w-full border p-2 rounded mb-1 ${
                errors.testimonials?.[index]?.name
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.testimonials?.[index]?.name && (
              <p className="text-red-500 text-sm mb-2">
                {errors.testimonials[index]?.name?.message}
              </p>
            )}

            {/* Role */}
            <input
              {...register(`testimonials.${index}.role`)}
              placeholder="Client Role"
              className={`w-full border p-2 rounded mb-1 ${
                errors.testimonials?.[index]?.role
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.testimonials?.[index]?.role && (
              <p className="text-red-500 text-sm mb-2">
                {errors.testimonials[index]?.role?.message}
              </p>
            )}

            {/* Content */}
            <textarea
              {...register(`testimonials.${index}.content`)}
              placeholder="Testimonial"
              className={`w-full border p-2 rounded mb-1 ${
                errors.testimonials?.[index]?.content
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.testimonials?.[index]?.content && (
              <p className="text-red-500 text-sm mb-2">
                {errors.testimonials[index]?.content?.message}
              </p>
            )}

            <button
              type="button"
              onClick={() => removeTestimonial(index)}
              className="text-red-500 text-sm mt-2"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            addTestimonial({ name: "", role: "", content: "" })
          }
          className="text-blue-600 text-sm"
        >
          + Add New Testimonial
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