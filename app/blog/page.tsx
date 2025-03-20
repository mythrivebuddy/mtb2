import { Metadata } from "next";
import Navbar from "@/components/common/Navbar";
import BlogHero from "@/components/blog/BlogHero";

export const metadata: Metadata = {
  title: "Blog - MyThriveBuddy",
  description: "Latest insights and stories from our community of solopreneurs",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#4A90E2] via-[#F8F2FF] to-[#FF69B4] py-4 sm:py-6 md:py-8 px-4">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-4 sm:p-6 md:p-8">
          <Navbar />
          <div className="mt-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-[#1E2875] mb-4">
                Our Blog
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover insights, stories, and tips from successful
                solopreneurs in our community
              </p>
            </div>
            <BlogHero />
          </div>
        </div>
      </div>
    </main>
  );
}

// function BlogCard({ title, excerpt, image, author, date, readTime }: BlogPost) {
//   return (
//     <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
//       <div className="relative h-48">
//         <Image src={image} alt={title} fill className="object-cover" />
//       </div>
//       <div className="p-6">
//         <h2 className="text-xl font-bold text-[#1E2875] mb-3">{title}</h2>
//         <p className="text-gray-600 mb-4">{excerpt}</p>
//         <div className="flex items-center justify-between text-sm text-gray-500">
//           <span>{author}</span>
//           <div className="flex items-center space-x-4">
//             <span>{date}</span>
//             <span>{readTime}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// const blogPosts: BlogPost[] = [
//   {
//     id: 1,
//     title: "Building a Successful Solo Business",
//     excerpt:
//       "Learn the key strategies that successful solopreneurs use to build and grow their businesses.",
//     image: "/images/blog/post-1.jpg",
//     author: "Sarah Johnson",
//     date: "Mar 15, 2024",
//     readTime: "5 min read",
//   },
//   {
//     id: 2,
//     title: "Finding Work-Life Balance",
//     excerpt:
//       "Discover how to maintain a healthy work-life balance while running your solo business.",
//     image: "/images/blog/post-2.jpg",
//     author: "Mike Chen",
//     date: "Mar 12, 2024",
//     readTime: "4 min read",
//   },
//   {
//     id: 3,
//     title: "Marketing Tips for Solopreneurs",
//     excerpt:
//       "Effective marketing strategies that you can implement on your own to grow your business.",
//     image: "/images/blog/post-3.jpg",
//     author: "Emily Davis",
//     date: "Mar 10, 2024",
//     readTime: "6 min read",
//   },
// ];
