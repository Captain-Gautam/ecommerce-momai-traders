import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { deleteAddress, setDefaultAddress } from "@/actions/account-actions";
import { AddAddressForm } from "@/components/account/address-form";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm-form";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await getSession();
  if (!session) return null;

  const addresses = await prisma.address.findMany({
    where: { userId: session.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
        <p className="mt-1 text-sm text-gray-500">These addresses appear at checkout.</p>
      </div>

      {addresses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
          No addresses saved yet. Add one below.
        </p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm text-gray-800">
                  {a.isDefault && (
                    <span className="mb-2 inline-block rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                      Default
                    </span>
                  )}
                  <p>
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}
                  </p>
                  <p>
                    {a.city}, {a.state} — {a.pincode}
                  </p>
                  {a.phone ? <p className="mt-1 text-xs text-gray-400">{a.phone}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  {!a.isDefault && (
                    <form action={setDefaultAddress}>
                      <input type="hidden" name="id" value={a.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Make default
                      </Button>
                    </form>
                  )}
                  <ConfirmForm message={`Delete address (${a.line1}, ${a.city})? This cannot be undone.`} action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                      Delete
                    </Button>
                  </ConfirmForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">Add a new address</h2>
        <div className="mt-4">
          <AddAddressForm />
        </div>
      </section>
    </div>
  );
}
