import createSlug from "@/lib/createSlug";
import Image from "next/image";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
}

export default function BlogCard({
  title,
  excerpt,
  image,
  date,
  readTime,
}: BlogPost) {
  const slug = createSlug(title);
  return (
    <Link
      href={{
        pathname: `/blog/${slug}`,
      }}
      className="block"
    >
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-48">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 300px)"
            className="object-cover"
          />
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#1E2875] mb-3">{title}</h2>
          <p className="text-gray-600 mb-4">{excerpt}</p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{date}</span>
              <span>{readTime}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
