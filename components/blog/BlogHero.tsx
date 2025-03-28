"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import BlogCard from "./BlogCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Skeleton from "../Skeleton";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

// Define interfaces based on backend response
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  content: string;
  readTime: string;
  date: string;
}

interface BlogResponse {
  message: string;
  blogs: BlogPost[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

const BlogHero = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const postsPerPage = 6; // Matches backend default

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch categories
  const { data: categories = ["All"], isLoading: categoriesLoading } = useQuery(
    {
      queryKey: ["categories"],
      queryFn: async () => {
        const response = await axios.get("/api/blogs/getCategories");
        return ["All", ...response.data.categories] as string[];
      },
    }
  );

  // Fetch blogs with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<BlogResponse>({
    queryKey: ["blogs", selectedCategory],
    queryFn: async ({ pageParam = 1 }) => {
      const categoryQuery =
        selectedCategory !== "All"
          ? `&category=${encodeURIComponent(selectedCategory)}`
          : "";
      const response = await axios.get(
        `/api/blogs/getBlogs?page=${pageParam}&limit=${postsPerPage}${categoryQuery}`
      );
      return response.data as BlogResponse;
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten blog posts from all fetched pages
  const blogPosts = data?.pages.flatMap((page) => page.blogs) || [];

  // Scroll handlers for category carousel
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft -= 300;
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += 300;
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (isFetchingNextPage || !hasNextPage) return;
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Category change handler
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Render skeleton placeholders during loading
  const renderSkeletons = () => {
    return Array(postsPerPage)
      .fill(0)
      .map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="relative h-48">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="p-6">
            <Skeleton className="h-7 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </div>
      ));
  };

  return (
    <div>
      {/* Category Filter Carousel */}
      <div className="relative w-full mb-4">
        <button
          onClick={handleScrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 z-10 hidden sm:block hover:bg-gray-200"
          aria-label="Scroll left"
        >
          <ChevronLeft />
        </button>
        <div
          ref={scrollContainerRef}
          className="no-scrollbar flex overflow-x-auto whitespace-nowrap space-x-3 py-2 px-2 rounded-md mx-8"
        >
          {categoriesLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))
          )}
        </div>
        <button
          onClick={handleScrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 z-10 hidden sm:block hover:bg-gray-200"
          aria-label="Scroll right"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading
          ? renderSkeletons()
          : blogPosts.map((post) => <BlogCard key={post.id} {...post} />)}
      </div>

      {/* Loading Indicator for Next Pages */}
      {isFetchingNextPage && (
        <div className="flex justify-center mt-12">
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
      )}

      {/* Error Message */}
      {isError && (
        <div className="flex justify-center mt-12 text-red-500">
          Error fetching blogs. Please try again later.
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default BlogHero;
