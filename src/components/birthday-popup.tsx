import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { type User } from "@/lib/mock-data";
import { toast } from "sonner";

interface BirthdayPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  birthdaysToday: User[];
}

export function BirthdayPopup({ open, onOpenChange, birthdaysToday }: BirthdayPopupProps) {
  const primaryBirthday = birthdaysToday[0];
  const hasMultiple = birthdaysToday.length > 1;

  const titleText = useMemo(() => {
    if (!primaryBirthday) return "Happy Birthday!";
    if (hasMultiple) {
      return `🎉 Happy Birthday ${primaryBirthday.name} + ${birthdaysToday.length - 1} more! 🎉`;
    }
    return `🎉 Happy Birthday ${primaryBirthday.name}! 🎉`;
  }, [birthdaysToday, hasMultiple, primaryBirthday]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl p-6">
        <DialogHeader className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 text-white p-6 shadow-xl">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.55),_transparent_40%)]" />
          <div className="absolute -left-8 top-2 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute right-3 top-8 h-12 w-12 rounded-full bg-white/30 blur-2xl" />
          <div className="relative z-10 space-y-3 text-center">
            <DialogTitle className="text-2xl font-bold tracking-tight">{titleText}</DialogTitle>
            <DialogDescription className="text-sm text-white/85">
              {hasMultiple
                ? `Send warm wishes to ${birthdaysToday.length} colleagues celebrating today.`
                : `Celebrate ${primaryBirthday?.name}'s birthday with a thoughtful wish!`}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mt-4 rounded-3xl border border-border bg-background p-5 text-center shadow-sm">
          <div className="mb-4 text-sm text-muted-foreground">
            {hasMultiple
              ? `There are ${birthdaysToday.length} birthdays today.`
              : `${primaryBirthday?.name} is celebrating today.`}
          </div>
          <div className="grid gap-3">
            {birthdaysToday.map((birthday) => (
              <div
                key={birthday.id}
                className="rounded-2xl border border-border bg-card p-3 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{birthday.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {birthday.designation ?? "Employee"}
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Today
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button
            className="w-full"
            onClick={() => {
              toast.success("Wish sent!");
              onOpenChange(false);
            }}
          >
            Send Wish
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
