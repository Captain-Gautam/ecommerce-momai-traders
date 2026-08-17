import { forwardRef, cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "whatsapp"
  | "danger"
  | "dark";
type Size = "xs" | "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-sm focus-visible:outline-brand-600",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-brand-600",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  whatsapp: "bg-whatsapp-600 text-white hover:bg-whatsapp-700 shadow-sm",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  dark: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
      "disabled:opacity-50 disabled:pointer-events-none",
      "focus-visible:outline-2 focus-visible:outline-offset-2",
      variants[variant],
      sizes[size],
      className
    );

    if (asChild && isValidElement(props.children)) {
      const child = props.children as ReactElement<{ className?: string }>;
      const childProps: Partial<{ className?: string }> = {
        className: cn(classes, child.props.className),
      };
      return cloneElement(child, childProps);
    }

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
