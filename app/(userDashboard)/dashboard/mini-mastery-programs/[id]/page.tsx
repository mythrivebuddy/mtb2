import { Metadata } from "next";
import axios from "axios";
import ProgramDetailViewClient from "@/components/mini-mastery-program/ProgramDetailViewClient";

type Props = {
  params: { id: string };
};

async function getProgram(id: string) {
  try {
    const res = await axios.get(
      `${process.env.NEXT_URL}/api/mini-mastery-programs/public/${id}`,
    );
    return res.data.program;
  } catch {
    return null;
  }
}

// ✅ Dynamic Metadata (OG tags)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const paramsContext = await params;
  const program = await getProgram(paramsContext.id);
  const baseUrl = process.env.NEXT_URL || "https://www.mythrivebuddy.com";

  const logoUrl = `${baseUrl}/logo.png`;
  if (!program) {
    return {
      title: "Program Not Found",
      description: "This program does not exist",
    };
  }
  const description =
    program.description?.trim() || "Explore this program on MyThriveBuddy";
  return {
    metadataBase: new URL(baseUrl),
    title: program.name
      ? `${program.name} | MythriveBuddy`
      : "Mini Mastery Program | MythriveBuddy",
    description,

    openGraph: {
      title: program.name
        ? `${program.name} | MythriveBuddy`
        : "Mini Mastery Program | MythriveBuddy",
      description,
      url: `${baseUrl}/dashboard/mini-mastery-programs/${program.id}`,
      siteName: "MyThriveBuddy",
      images: [
        {
          url: program.thumbnailUrl || logoUrl,
          width: 1200,
          height: 630,
          alt: program.name || "Mini Mastery Program | MythriveBuddy",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: program.name
        ? `${program.name} | MythriveBuddy`
        : "Mini Mastery Program | MythriveBuddy",
      description,
      images: [program.thumbnailUrl || logoUrl],
    },
  };
}

export default async function Page({ params }: Props) {
  const paramsContext = await params;
  const program = await getProgram(paramsContext.id);

  if (!program) {
    return <div>Program not found</div>;
  }

  return <ProgramDetailViewClient program={program} />;
}
