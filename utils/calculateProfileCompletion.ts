export default function calculateProfileCompletion(profileData: any): number {
  const fieldsToCheck = [
    "name",
    "businessInfo",
    "missionStatement",
    "goals",
    "keyOfferings",
    "achievements",
    "email",
    "phone",
    "website",
    "featuredWorkTitle",
    "featuredWorkDesc",
    "featuredWorkImage",
    "priorityContactLink",
  ];
  const totalFields = fieldsToCheck.length + 1; // +1 for socialHandles

  const filledFields = fieldsToCheck.filter(
    (field) => profileData[field] && profileData[field] !== ""
  ).length;

  const socialFilled =
    profileData.socialHandles &&
    Object.values(profileData.socialHandles).some(
      (value) => value && value !== ""
    );

  return Math.round(
    ((filledFields + (socialFilled ? 1 : 0)) / totalFields) * 100
  );
}
export  function calculateRequiredProfileCompletion(profileData: any): number {
  if (!profileData) return 0;

  // These are the exact fields required to hit 100% based on your new schema.
  // You can add or remove fields from this array if you want to make certain things optional.
  const requiredFields = [
    "name",
    "tagline",
    "coachingDomains",
    "targetAudience",
    "transformation",
    "typicalResults",
    "sessionStyles",
    "methodology",
    "toolsFrameworks",
    "servicesOffered",
    "languages",
    "timezone",
    "sessionFormat",
    "sessionDuration",
    "preferredCurrency",
    "priceMin",
    "priceMax",
    "yearsOfExperience",
    "shortBio",
    "profilePhoto",
    "introVideo",
    "linkedin",
    "calendlyUrl"
  ];

  let filledCount = 0;

  requiredFields.forEach((field) => {
    const value = profileData[field];

    // 1. Check for null or undefined
    if (value === null || value === undefined) {
      return; 
    }

    // 2. Check for Strings
    if (typeof value === "string") {
      // Ensure it's not an empty string and not a stringified empty array (like testimonials: "[]")
      if (value.trim() !== "" && value.trim() !== "[]") {
        filledCount++;
      }
    } 
    // 3. Check for Arrays (e.g., coachingDomains, targetAudience)
    else if (Array.isArray(value)) {
      if (value.length > 0) {
        filledCount++;
      }
    } 
    // 4. Check for Numbers (e.g., priceMin, priceMax, yearsOfExperience)
    else if (typeof value === "number") {
      // As long as it's a valid number (even 0), it counts as filled
      if (!isNaN(value)) {
        filledCount++;
      }
    }
  });

  // Calculate percentage and round it
  return Math.round((filledCount / requiredFields.length) * 100);
}