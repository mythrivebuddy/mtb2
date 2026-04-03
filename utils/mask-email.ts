export function maskEmail(email:string) {
  if (!email) return "";

  const [name, domain] = email.split("@");

  if (name.length <= 2) {
    return name[0] + "*****@" + domain;
  }

  const firstChar = name[0];
  const lastChar = name[name.length - 1];

  return `${firstChar}*****${lastChar}@${domain}`;
}