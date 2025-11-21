import React from "react";
import { notFound } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import ReadOnlyTipTapEditor from "@/app/simple/read-only-editor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RESERVED_PUBLIC_ROUTES } from "@/lib/constant";
import type { JSONContent } from "@tiptap/react";
/* --------------------------------------------
   DIRECT DATABASE FETCH (NO API CALL)
---------------------------------------------*/
async function fetchPage(slug: string) {
  if (RESERVED_PUBLIC_ROUTES.includes(slug)) {
    return null;
  }

  const page = await prisma.page.findUnique({
    where: { slug },
  });

  return page;
}

/* --------------------------------------------
   METADATA (SSR)
---------------------------------------------*/
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
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
        page.canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/${page.slug}`,
    },
    openGraph: {
      title: page.ogTitle || page.metaTitle || page.title,
      description: page.ogDescription || page.metaDescription,
      images: page.ogImage ? [page.ogImage] : [],
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${page.slug}`,
    },
  };
}

/* --------------------------------------------
   PAGE COMPONENT
---------------------------------------------*/
export default async function Page({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  // Direct DB query
  const page = await fetchPage(slug);

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  if (!page) {
    notFound();
  }

  // If page unpublished, only admin can see it
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
      <main className="w-full px-0">
        <section className="w-full px-0">
          <ReadOnlyTipTapEditor
            content={
              (page.content ?? { type: "doc", content: [] }) as JSONContent
            }
          />
        </section>
      </main>
    </AppLayout>
  );
}
