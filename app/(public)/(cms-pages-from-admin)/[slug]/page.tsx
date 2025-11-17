import React from "react";
import { notFound } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import ReadOnlyTipTapEditor from "@/app/simple/read-only-editor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { RESERVED_PUBLIC_ROUTES } from "@/lib/constant";


export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const page = await fetchPage(slug);

  if (!page || !page.isPublished) {
    return {};
  }

  const finalTitle = `${page.metaTitle || page.title} - MythriveBuddy`;

  return {
    title: finalTitle,
    description: page.metaDescription,
    keywords: page.metaKeywords,
    alternates: {
      canonical:
        page.canonicalUrl || `${process.env.NEXT_URL}/${page.slug}`,
    },
    openGraph: {
      title: page.ogTitle || page.metaTitle || page.title,
      description: page.ogDescription || page.metaDescription,
      images: page.ogImage ? [page.ogImage] : [],
      url: `${process.env.NEXT_URL}/${page.slug}`,
    },
  };
}


async function fetchPage(slug: string) {
  if (RESERVED_PUBLIC_ROUTES.includes(slug)) {
    return null;
  }

  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${process.env.NEXT_URL}/api/pages/${slug}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
    });
    const data = await res.json();

    return data;
  } catch (e) {
    console.log(e);

    return null;
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  const page = await fetchPage(slug);
  const session = await getServerSession(authOptions);
  console.log("session in frontend ", session?.user);

  const isAdmin = session?.user?.role === "ADMIN";
  if (!page) {
    notFound();
  }
  if (!page.isPublished && !isAdmin) {
    notFound();
  }

  return (
    <AppLayout>
      {/* Schema Markup */}
      {page.schemaMarkup && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(page.schemaMarkup),
          }}
        />
      )}

      {/* Page Content */}
      <main className="max-w-4xl mx-auto p-6">
        <section className="p-4 mb-8">
          <ReadOnlyTipTapEditor content={page.content} />
        </section>
      </main>
    </AppLayout>
  );
}
