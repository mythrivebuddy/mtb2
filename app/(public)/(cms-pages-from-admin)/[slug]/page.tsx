import React from "react";
import { notFound } from "next/navigation";
import RenderTiptapContent from "@/components/RenderTiptapContent";
import AppLayout from "@/components/layout/AppLayout";

// ... (your generateMetadata function remains the same) ...
export async function generateMetadata({ params }:{params:{slug:string}}) {
    const {slug} = await params
  const page = await fetchPage(slug);

  if (!page || !page.isPublished) {
    return {};
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
    keywords: page.metaKeywords,
    alternates: {
      canonical: page.canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/${page.slug}`,
    },
    openGraph: {
      title: page.ogTitle || page.metaTitle || page.title,
      description: page.ogDescription || page.metaDescription,
      images: page.ogImage ? [page.ogImage] : [],
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${page.slug}`,
    },
  };
}


// ... (your fetchPage function remains the same) ...
async function fetchPage(slug:string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_URL}/api/pages/${slug}`,
      { cache: "force-cache" }
    );
    return await res.json();
  } catch (e) {
    return null;
  }
}


export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const page = await fetchPage(slug);

  if (!page || !page.isPublished) {
    notFound();
  }

  return (
    <AppLayout>
      {/* Schema Markup */}
      {page.schemaMarkup && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.schemaMarkup) }}
        />
      )}

      {/* Page Content */}
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">{page.title}</h1>

        {/* BLOCK 1: RENDERED CONTENT
          This will now work because of our fix in RenderTiptapContent.tsx
        */}
        <div className="border p-4 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Rendered Content</h2>
          <RenderTiptapContent content={page.content} />
        </div>
        
      </main>
    </AppLayout>
  );
}