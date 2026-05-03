export const parseCode = (code: string) => {
  return {
    functions: code.match(/function/g)?.length || 0,
  };
};