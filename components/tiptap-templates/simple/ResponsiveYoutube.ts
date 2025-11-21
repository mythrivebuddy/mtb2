import Youtube from "@tiptap/extension-youtube";

export const ResponsiveYoutube = Youtube.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "youtube-wrapper" },
      [
        "iframe",
        {
          ...HTMLAttributes,
          width: "100%",
          height: "100%",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen",
          allowfullscreen: "true",
          frameborder: "0",
        },
      ],
    ];
  },
});
