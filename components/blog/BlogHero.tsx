"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import BlogCard from "./BlogCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  content: string;
  date: string;
  readTime: string;
}

const BlogHero = () => {
  // State for blogs, loading, pagination, category filter, and fetched categories
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [postsPerPage] = useState<number>(6);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);

  // Reference for the carousel scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch categories from the backend
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await axios.get("/api/blogs/getCategories");
        // Expecting response.data.categories to be an array of strings.
        setFetchedCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Combine "All" with fetched categories
  const categories = ["All", ...fetchedCategories];

  // Function to fetch blogs with optional category filtering
  const fetchBlogs = async (page: number, category?: string) => {
    setLoading(true);
    try {
      const categoryQuery = category
        ? `&category=${encodeURIComponent(category)}`
        : "";
      const response = await axios.get(
        `/api/blogs/getBlogs?page=${page}&limit=${postsPerPage}${categoryQuery}`
      );
      if (page === 1) {
        setBlogPosts(response.data.blogs);
      } else {
        setBlogPosts((prev) => [...prev, ...response.data.blogs]);
      }
      const totalCount = response.data.totalCount || response.data.blogs.length;
      setTotalPages(Math.ceil(totalCount / postsPerPage));
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch blogs when currentPage or selectedCategory changes
  useEffect(() => {
    // When category changes, reset currentPage to 1 and clear the blogPosts list.
    fetchBlogs(
      currentPage,
      selectedCategory === "All" ? undefined : selectedCategory
    );
  }, [currentPage, selectedCategory]);

  // Handle category change from the filter buttons
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setBlogPosts([]);
  };

  // Scroll container left/right by a set amount (for carousel arrows)
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

  // Infinite scroll auto-loading: auto-load next page when near the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (loading) return;
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        if (currentPage < totalPages && currentPage < 2) {
          setCurrentPage((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPage, loading, totalPages]);

  // Handler for the "Load More" button
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Custom skeleton component for loading states
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  // Render skeletons while loading
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
        {/* Left Arrow */}
        <button
          onClick={handleScrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 z-10 hidden sm:block hover:bg-gray-200"
          aria-label="Scroll left"
        >
          <ChevronLeft />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="no-scrollbar flex overflow-x-auto whitespace-nowrap space-x-3 py-2 px-2 rounded-md mx-8"
        >
          {categories.map((category) => (
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
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleScrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 z-10 hidden sm:block hover:bg-gray-200"
          aria-label="Scroll right"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Blog Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && currentPage === 1
          ? renderSkeletons()
          : blogPosts.map((post: BlogPost) => (
              <BlogCard key={post.id} {...post} />
            ))}
      </div>

      {/* "Load More" Button for manual loading */}
      {!loading && currentPage >= 2 && currentPage < totalPages && (
        <div className="flex justify-center mt-12">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Load More
          </button>
        </div>
      )}

      {/* Loading indicator for subsequent page loads */}
      {loading && currentPage > 1 && (
        <div className="flex justify-center mt-12">
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
      )}

      {/* Global CSS for hiding scrollbar */}
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
