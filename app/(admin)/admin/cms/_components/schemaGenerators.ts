import { ArticleFormData, ArticleSchema } from "@/types/types";

export function generateFAQSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((i) => ({
      "@type": "Question",
      "name": i.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": i.answer,
      },
    })),
  };
}

export function generateHowToSchema(steps: { title: string; description: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "",
    "step": steps.map((s) => ({
      "@type": "HowToStep",
      "name": s.title,
      "text": s.description,
    })),
  };
}

export function generateArticleSchema(form: ArticleFormData): ArticleSchema {
  return {
    "@type": "Article",
    headline: form.headline,
    datePublished: form.datePublished,

    ...(form.description && { description: form.description }),
    ...(form.image && { image: form.image }),

    author: {
      "@type": "Person",
      name: form.author,
    },
  };
}

