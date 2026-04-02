"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import BlogForm from "@/components/adminDashboard/BlogForm";

export default function BlogEditor() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;
  const isNew = id === "new";

  // Fetch blog data if editing
  const { data: blog, isLoading: isBlogLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: async () => {
      const response = await axios.get(`/api/blogs/getParticularBlog/${id}`);
      return response.data;
    },
    enabled: !isNew,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch categories (used by BlogForm)

  const handleSuccess = async () => {
    // await queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false });
    router.push("/admin/blog");
  };
  if (isBlogLoading && !isNew) {
    return <div>Loading...</div>;
  }

  return (
    <div className="md:container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? "Create New Blog" : "Edit Blog"}
      </h1>
      <BlogForm
        blogString={id}
        blogId={isNew ? undefined : blog?.id}
        onSuccess={handleSuccess}
        initialData={blog}
      />
    </div>
  );
}
