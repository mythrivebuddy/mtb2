"use client";

import { useParams } from "next/navigation";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  content: string;
  readTime: string;
  date: string;
}

const fetchBlog = async (slug: string) => {
  const res = await axios.get(`/api/blogs/getParticularBlog/${slug}`);
  return res.data as BlogPost;
};

export default function Page() {
  const params = useParams();
  const slug = params.blogname as string;

  const {
    data: blog,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["particularBlog", slug],
    queryFn: () => fetchBlog(slug),
    enabled: !!slug,
  });

  // Loading state
  if (isLoading)
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
        </div>
      </AppLayout>
    );

  // Error state
  if (error)
    return (
      <AppLayout>
        <div className="text-center text-2xl text-red-500 p-10">
          Error loading blog
        </div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="p-8 m-2">
        <h1 className="text-4xl font-bold text-gray-900 mb-5">{blog?.title}</h1>
        <Image
          src={blog?.image as string}
          alt={blog?.title as string}
          width={800}
          height={200}
          className="rounded-lg w-full h-[300px] object-cover"
        />
        <div className="flex justify-between text-gray-500 text-base my-5">
          <span className="italic">Read time: {blog?.readTime}</span>
        </div>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: blog?.content ?? "" }}
        />
      </div>
      <div>
        <p>Ready to transform your solopreneurship journey?</p>
        <br />
        <p>
          <Link href={"/signin"}>
            <span className="font-bold">Join MyThriveBuddy today</span>
          </Link>{" "}
          and be part of a supportive ecosystem that empowers solopreneurs to
          thrive, grow, and succeed. Together, we’re building a future where
          solopreneurship is not just a career choice but a fulfilling and
          joyful way of life.
        </p>
      </div>
    </AppLayout>
  );
}
