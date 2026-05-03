export const embedText = async (text: string) => {
  // placeholder for embeddings (OpenAI / local model)
  return text.split(" ").map((_, i) => i * 0.01);
};