import { BusinessProfile } from "@/types/client/business-profile"

interface Props {
  profile: BusinessProfile
}

export default function ProfileHero({ profile }: Props) {
  return (
    <section className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-10">

        {/* LEFT */}
        <div className="flex gap-6">
          <img
            src={profile?.profilePhoto || "/avatar.png"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-4 border-blue-600"
          />

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {profile?.name || "Your Name"}
            </h1>

            <p className="text-gray-600 mt-2 max-w-xl">
              {profile?.tagline}
            </p>

            <div className="flex gap-2 mt-4 flex-wrap">
              {profile?.coachingDomains?.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="bg-gray-50 p-6 rounded-xl shadow-sm w-full md:w-80">
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Edit Profile
          </button>

          <button className="w-full mt-3 border border-gray-300 py-3 rounded-lg">
            Preview Public Profile
          </button>
        </div>
      </div>
    </section>
  )
}