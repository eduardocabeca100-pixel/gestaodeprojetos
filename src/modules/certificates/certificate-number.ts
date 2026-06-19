export function formatCertificateNumber(
  prefix: string,
  year: number,
  sequence: number,
) {
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

export function nextCertificateNumber(
  prefix: string,
  existingNumbers: string[],
  year = new Date().getFullYear(),
) {
  const prefixPattern = `${prefix}-${year}-`;
  const maxSequence = existingNumbers.reduce((max, value) => {
    if (!value.startsWith(prefixPattern)) return max;

    const sequence = Number(value.slice(prefixPattern.length));
    if (Number.isNaN(sequence)) return max;

    return Math.max(max, sequence);
  }, 0);

  return formatCertificateNumber(prefix, year, maxSequence + 1);
}
