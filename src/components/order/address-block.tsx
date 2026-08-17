import type { OrderAddress } from "@/lib/order-address";
import { cn } from "@/lib/utils";

export function AddressBlock({
  title,
  address,
  className,
}: {
  title: string;
  address: OrderAddress;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-gray-200 bg-white p-5", className)}>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="mt-3 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">
          {address.businessName ? `${address.name} (${address.businessName})` : address.name}
        </p>
        <p className="mt-1">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} — {address.pincode}
        </p>
        {address.phone ? <p className="mt-1 text-gray-500">{address.phone}</p> : null}
        {address.email ? <p className="mt-1 text-gray-500">{address.email}</p> : null}
      </div>
    </section>
  );
}
