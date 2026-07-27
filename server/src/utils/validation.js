const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.'-]{1,49}$/;

export function toTitleCase(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("-")
    )
    .join(" ");
}

export function validateMemberName(rawName) {
  const name = (rawName ?? "").trim();
  if (name.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters." };
  }
  if (!NAME_REGEX.test(name)) {
    return { valid: false, error: "Name can only contain letters, spaces, apostrophes, and hyphens." };
  }
  return { valid: true };
}
