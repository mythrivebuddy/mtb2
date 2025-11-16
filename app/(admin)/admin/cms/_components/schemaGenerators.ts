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

export function generateArticleSchema(values: {
  headline: string;
  author: string;
  datePublished: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": values.headline,
    "author": {
      "@type": "Person",
      "name": values.author,
    },
    "datePublished": values.datePublished,
    ...(values.image && { image: values.image }),
  };
}
