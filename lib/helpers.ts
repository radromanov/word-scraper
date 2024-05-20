export function isValid(word: string) {
  return (
    // Word cannot be of more than 1 set of characters, hyphens are allowed
    word.split(" ").length === 1 &&
    // word cannot include any brackets
    !word.includes("(") &&
    !word.includes(")")
  );
}
