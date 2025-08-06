// export async function addUserToBrevoList({
//   email,
//   firstName,
//   lastName,
// }: {
//   email: string;
//   firstName?: string;
//   lastName?: string;
// }) {
//   try {
//     const response = await fetch("https://api.brevo.com/v3/contacts", {
//       method: "POST",
//       headers: {
//         "api-key": process.env.BREVO_API_KEY!, // make sure this is in your .env.local
//         "Content-Type": "application/json",
//         "Accept": "application/json",
//       },
//       body: JSON.stringify({
//         email,
//         attributes: {
//           FIRSTNAME: firstName,
//           LASTNAME: lastName,
//         },
//         listIds: [7], // ✅ Make sure this is correct
//         updateEnabled: true, // update existing contact if found
//       }),
//     });

//     const responseData = await response.json();

//     if (!response.ok) {
//       console.error("❌ Brevo error:", JSON.stringify(responseData, null, 2));
//     } else {
//       console.log("✅ Contact added to Brevo list:", JSON.stringify(responseData, null, 2));
//     }
//   } catch (error) {
//     console.error("❌ Error adding to Brevo list:", error);
//   }
// }
