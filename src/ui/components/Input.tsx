import { cn } from "@/lib/utils/tw";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ className, label, error, ...props }: InputProps) => (
  <div className="w-full space-y-1.5">
    {label && (
      <label className="text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500 focus:border-red-500",
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);
