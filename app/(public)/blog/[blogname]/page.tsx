// "use client";

// import { useParams } from "next/navigation";
// import axios from "axios";
// import { useQuery } from "@tanstack/react-query";
// import Image from "next/image";
// import Link from "next/link";
// import { Loader2 } from "lucide-react";
// import AppLayout from "@/components/layout/AppLayout";
// import { Metadata } from "next";

// interface BlogPost {
//   id: string;
//   title: string;
//   excerpt: string;
//   image: string;
//   content: string;
//   readTime: string;
//   date: string;
// }

// const fetchBlog = async (slug: string) => {
//   const res = await axios.get(`/api/blogs/getParticularBlog/${slug}`);
//   return res.data as BlogPost;
// };

// // Generate metadata for the page
// export async function generateMetadata({ params }: { params: { blogname: string } }): Promise<Metadata> {
//   const blog = await fetchBlog(params.blogname);

//   return {
//     title: `${blog.title} - MyThriveBuddy`,
//     description: blog.excerpt,
//     openGraph: {
//       title: blog.title,
//       description: blog.excerpt,
//       url: `https://mythrivebuddy.com/blog/${params.blogname}`,
//       siteName: "MyThriveBuddy",
//       images: [
//         {
//           url: blog.image,
//           width: 1200,
//           height: 630,
//           alt: blog.title,
//         },
//       ],
//       locale: "en_US",
//       type: "article",
//       publishedTime: blog.date,
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: blog.title,
//       description: blog.excerpt,
//       images: [blog.image],
//     },
//   };
// }

// export default function Page() {
//   const params = useParams();
//   const slug = params.blogname as string;

//   const {
//     data: blog,
//     isLoading,
//     error,
//   } = useQuery({
//     queryKey: ["particularBlog", slug],
//     queryFn: () => fetchBlog(slug),
//     enabled: !!slug,
//   });

//   // Loading state
//   if (isLoading)
//     return (
//       <AppLayout>
//         <div className="flex items-center justify-center h-screen">
//           <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
//         </div>
//       </AppLayout>
//     );

//   // Error state
//   if (error)
//     return (
//       <AppLayout>
//         <div className="text-center text-2xl text-red-500 p-10">
//           Error loading blog
//         </div>
//       </AppLayout>
//     );

//   return (
//     <AppLayout>
//       <div className="p-8 m-2">
//         <h1 className="text-4xl font-bold text-gray-900 mb-5">{blog?.title}</h1>
//         <div className="relative w-full aspect-[16/5] mb-6 rounded-lg overflow-hidden">
//           <Image
//             src={blog?.image as string}
//             alt={blog?.title as string}
//             fill
//             className="object-cover"
//           />
//         </div>
//         <div className="flex justify-between text-gray-500 text-base my-5">
//           <span className="italic">Read time: {blog?.readTime}</span>
//         </div>
//         <div
//           className="prose prose-lg max-w-none"
//           dangerouslySetInnerHTML={{ __html: blog?.content ?? "" }}
//         />
//       </div>
//       <div>
//         <p>Ready to transform your solopreneurship journey?</p>
//         <br />
//         <p>
//           <Link href={"/signin"}>
//             <span className="font-bold">Join MyThriveBuddy today</span>
//           </Link>{" "}
//           and be part of a supportive ecosystem that empowers solopreneurs to
//           thrive, grow, and succeed. Together, we're building a future where
//           solopreneurship is not just a career choice but a fulfilling and
//           joyful way of life.
//         </p>
//       </div>
//     </AppLayout>
//   );
// }

// app/(public)/blog/[blogname]/page.tsx
import { Metadata } from "next";
import ClientBlogPage from "./BlogData";
import { BlogPost } from "@/types/client/blog";


type PageProps = {
  params: Promise<{ blogname: string }>;
};

const fetchBlog = async (id: string): Promise<BlogPost> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/blogs/getParticularBlog/${id}`,
    {
      cache: "force-cache",
    }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch blog");
  }
  return res.json();
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { blogname } = await params; // Await the params Promise
  console.log(blogname);
  const id = blogname.split("-")[0];
  console.log(id);
  const blog = await fetchBlog(id);
  return {
    title: `${blog.title} - MyThriveBuddy`,
    description: blog.excerpt,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      url: `https://mythrivebuddy.com/blog/${blogname}`,
      siteName: "MyThriveBuddy",
      images: [
        {
          url: blog.image,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: blog.date,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt,
      images: [blog.image],
    },
  };
}

export default async function Page({ params }: PageProps) {
  try {
    const { blogname } = await params; // Await the params Promise
    const blog = await fetchBlog(blogname);
    return <ClientBlogPage blog={blog} />;
  } catch (error) {
    return (
      <div className="text-center text-2xl text-red-500 p-10">
        Error loading blog:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }
}
