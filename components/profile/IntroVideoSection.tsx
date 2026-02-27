import { BusinessProfile } from "@/types/client/business-profile"

interface Props {
  profile: BusinessProfile
}

export default function IntroVideoSection({ profile }: Props) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
        Meet Me
      </h2>

      <div className="relative rounded-2xl overflow-hidden shadow-md">
        <iframe
          src={profile?.introVideo}
          className="w-full aspect-video"
          allowFullScreen
        />
      </div>
    </section>
  )
}