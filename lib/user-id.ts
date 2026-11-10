// A user is identified by their name, so "Grey" and "grey " are the same person.
export function getUserId(userName: string): string {
  return userName.trim().toLowerCase()
}
