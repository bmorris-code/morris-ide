export const scanProject = (files: string[]) => {
  return {
    filesCount: files.length,
    status: "scanned",
  };
};