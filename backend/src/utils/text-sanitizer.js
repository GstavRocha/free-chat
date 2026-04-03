function removeUnsafeControlCharacters(value) {
  return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function sanitizeSingleLineText(value) {
  return removeUnsafeControlCharacters(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeOptionalSingleLineText(value) {
  const sanitized = sanitizeSingleLineText(value);
  return sanitized || null;
}

function sanitizeMultilineText(value) {
  const sanitized = removeUnsafeControlCharacters(value)
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return sanitized;
}

function sanitizeOptionalMultilineText(value) {
  const sanitized = sanitizeMultilineText(value);
  return sanitized || null;
}

module.exports = {
  sanitizeMultilineText,
  sanitizeOptionalMultilineText,
  sanitizeOptionalSingleLineText,
  sanitizeSingleLineText,
};
