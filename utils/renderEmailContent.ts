export function renderEmailTemplate(
  template: string | undefined,
  data: Record<string, any>
): string {
  if (!template) return "";
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const value = data[key.trim()];
    return value !== undefined ? value.toString() : `[${key.trim()}]`;
  });
}

export const defaultPreviewData = {
  username: "John Doe",
  verificationUrl: "https://preview-link.com/verify",
  resetUrl: "https://preview-link.com/reset-password",
  email: "john.doe@example.com",
  // Add more default preview data as needed
};

export function renderEmailTemplateUsingConditionals(template: string, data: Record<string, any>) {
  let output = template;

  // ✅ Handle IF blocks
  output = output.replace(
    /{{#if\s+(\w+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g,
    (_, key, truthyBlock, falsyBlock) => {
      return data[key] ? truthyBlock : falsyBlock;
    }
  );

  // ✅ Handle IF blocks without else
  output = output.replace(
    /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
    (_, key, block) => {
      return data[key] ? block : "";
    }
  );

  // ✅ Replace variables
  output = output.replace(/{{(.*?)}}/g, (_, key) => {
    const value = data[key.trim()];
    return value !== undefined && value !== null ? value : "";
  });

  return output;
}