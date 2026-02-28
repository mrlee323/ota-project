import { cn } from "@/lib/utils/tw";

export const Card = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-xl border border-gray-200 bg-white shadow-sm",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6", className)} {...props} />
);
