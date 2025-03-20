"use client";

import { useState, ChangeEvent, FormEvent } from "react";

export default function CreateBlogPost() {
  const [title, setTitle] = useState<string>("");
  const [excerpt, setExcerpt] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [readTime, setReadTime] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Create FormData to send image file
    const formData = new FormData();
    formData.append("title", title);
    formData.append("excerpt", excerpt);
    formData.append("content", content);
    formData.append("readTime", readTime);
    formData.append("category", category);
    if (imageFile) formData.append("imageFile", imageFile);

    const response = await fetch("/api/blogs/createBlogs", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      alert("Blog post created successfully!");
    } else {
      alert("Error creating blog post");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setTitle(e.target.value)
        }
        required
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setCategory(e.target.value)
        }
        required
      />
      <textarea
        placeholder="Excerpt"
        value={excerpt}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setExcerpt(e.target.value)
        }
        required
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setContent(e.target.value)
        }
        required
      />
      <input
        type="text"
        placeholder="Read Time (e.g., 5 min read)"
        value={readTime}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setReadTime(e.target.value)
        }
        required
      />

      {/* Image Upload */}
      <input type="file" accept="image/*" onChange={handleFileChange} />

      <button type="submit">Create Blog Post</button>
    </form>
  );
}
