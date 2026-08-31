import type { User } from "@/lib/mock-data";

function getMonthDay(dateOfBirth: string) {
  const date = new Date(dateOfBirth);
  return { month: date.getMonth(), day: date.getDate() };
}

export function formatBirthday(dateOfBirth?: string) {
  if (!dateOfBirth) return "—";
  return new Date(dateOfBirth).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

export function isBirthdayToday(dateOfBirth?: string, today = new Date()) {
  if (!dateOfBirth) return false;
  const birthday = getMonthDay(dateOfBirth);
  return birthday.month === today.getMonth() && birthday.day === today.getDate();
}

export function getUpcomingBirthdays(users: User[], days = 30, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const upcoming = users
    .map((user) => {
      if (!user.dateOfBirth) return null;
      const candidate = new Date(
        start.getFullYear(),
        new Date(user.dateOfBirth).getMonth(),
        new Date(user.dateOfBirth).getDate(),
      );
      if (candidate < start) {
        candidate.setFullYear(candidate.getFullYear() + 1);
      }
      const diffMs = candidate.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return { user, diffDays, birthdayDate: candidate };
    })
    .filter((item): item is { user: User; diffDays: number; birthdayDate: Date } => item !== null)
    .filter((item) => item.diffDays >= 0 && item.diffDays < days)
    .sort((a, b) => a.diffDays - b.diffDays)
    .map((item) => item.user);

  return upcoming;
}
