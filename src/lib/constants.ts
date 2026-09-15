/** Shared constants — safe to import from both server and client code. */

export const SITE = {
  name: "Global Connect",
  tagline: "Speak with the world",
  email: "support@globalconnect.app",
  activationFeeKes: 90,
  paybill: "542542",
  paybillAccount: "01609490286150",
};

export const COUNTRIES = [
  "Kenya", "Tanzania", "Uganda", "Rwanda", "Nigeria", "Ghana", "South Africa", "Ethiopia", "Egypt",
  "United States", "Canada", "United Kingdom", "Ireland", "Germany", "France", "Spain", "Italy",
  "Netherlands", "Sweden", "Norway", "Australia", "New Zealand", "Japan", "South Korea", "China",
  "India", "Pakistan", "Brazil", "Mexico", "Argentina", "Colombia", "United Arab Emirates", "Saudi Arabia",
  "Turkey", "Morocco", "Indonesia", "Philippines", "Vietnam", "Thailand",
];

export const LANGUAGES = [
  "English", "Swahili", "French", "Spanish", "German", "Portuguese", "Arabic", "Hindi",
  "Mandarin", "Japanese", "Korean", "Italian", "Dutch", "Amharic", "Yoruba", "Igbo", "Hausa", "Zulu",
];

export const INTERESTS = [
  "Travel", "Music", "Movies", "Sports", "Cooking", "Technology", "Reading", "Photography",
  "Business", "Fashion", "Gaming", "Fitness", "Art", "Nature", "Culture", "Food", "History",
  "Science", "Education", "Volunteering", "Dance", "Languages",
];

export const AVAILABILITY_PRESETS = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekend mornings",
  "Weekend afternoons",
  "Weekend evenings",
  "Flexible — anytime",
];

/** A small curated emoji set for chat (kept tasteful). */
export const EMOJIS = [
  "😀","😄","😁","😊","🙂","😉","😍","🤩","😎","🤗","🙌","👏","👍","🙏","💪","🔥","✨","🌍",
  "🎉","🎶","☕","🌅","🚀","💙","💚","😂","🤣","😅","😐","🤔","😴","😢","😮","👋","✅","❤️","🇰🇪","🗣️","📚","🤝","💬",
];

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatKes(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function timeAgo(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isOnline(lastActiveAt: string | Date | null | undefined) {
  if (!lastActiveAt) return false;
  const date = typeof lastActiveAt === "string" ? new Date(lastActiveAt) : lastActiveAt;
  return Date.now() - date.getTime() < 5 * 60 * 1000;
}
