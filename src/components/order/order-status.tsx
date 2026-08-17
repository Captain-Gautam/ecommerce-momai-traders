import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "Order Placed",
  QUOTED: "Quote Ready",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: "bg-sky-50 text-sky-700 ring-sky-200",
  QUOTED: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-violet-50 text-violet-700 ring-violet-200",
  PROCESSING: "bg-blue-50 text-blue-700 ring-blue-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-600 ring-red-200",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const STEPS: OrderStatus[] = ["PLACED", "QUOTED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = status === "DELIVERED" ? STEPS.length : STEPS.indexOf(status);

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((step, i) => {
        const reached = status === "DELIVERED" || (status === "PLACED" ? i === 0 : i <= currentIndex);
        return (
          <li key={step} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                  reached ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"
                )}
              >
                {reached ? "✓" : i + 1}
              </span>
              <span className={cn("text-xs font-medium", reached ? "text-gray-900" : "text-gray-400")}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={cn("h-0.5 w-5 rounded", i < currentIndex ? "bg-brand-600" : "bg-gray-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
