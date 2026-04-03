function ensureRequiredFields(payload, requiredFields) {
  const missingFields = requiredFields.filter(
    (field) => payload[field] === null || payload[field] === undefined
  );

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

function findBlankStringFields(payload, fieldNames) {
  return fieldNames.filter((field) => {
    const value = payload[field];

    if (value === null || value === undefined) {
      return false;
    }

    return String(value).trim().length === 0;
  });
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}

function hasValidCpfFormat(value) {
  return normalizeCpf(value).length === 11;
}

module.exports = {
  ensureRequiredFields,
  findBlankStringFields,
  normalizeCpf,
  hasValidCpfFormat,
};
