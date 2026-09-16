export function readResetLink(fragment: unknown) {
  if (typeof fragment !== "string") return null;
  const params = new URLSearchParams(fragment);
  const uid = params.get("uid");
  const token = params.get("token");
  if (
    !uid ||
    !token ||
    uid.length > 128 ||
    token.length > 128 ||
    params.getAll("uid").length !== 1 ||
    params.getAll("token").length !== 1
  )
    return null;
  return { uid, token };
}
