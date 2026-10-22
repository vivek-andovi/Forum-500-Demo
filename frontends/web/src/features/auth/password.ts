/** Mirrors the API password policy so members see problems before submitting. */
export function passwordProblems(pw: string): string[] {
  const out: string[] = [];
  if (pw.length < 10) out.push("at least 10 characters");
  if (!/[A-Za-z]/.test(pw)) out.push("a letter");
  if (!/\d/.test(pw)) out.push("a number");
  return out;
}
