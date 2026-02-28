import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/tw";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        outline:
          "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700",
        ghost: "hover:bg-gray-100 text-gray-700",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
export const Button = ({ className, variant, size, ...props }: ButtonProps) => (
  <button
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
);
