"use client";

import { useActionState, useState } from "react";
import {
  recordOutstandingPayment,
  updateOutstandingPayment,
  deleteOutstandingPayment,
  type PaymentFormState,
} from "@/actions/outstanding-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui";
import { formatINR, formatDate } from "@/lib/utils";

const MODES = [
  { value: "CHEQUE", label: "Cheque" },
  { value: "NEFT_RTGS_UPI", label: "NEFT / RTGS / UPI" },
  { value: "CASH", label: "Cash" },
];

export type OutstandingPaymentData = {
  id: string;
  amount: number;
  mode: string;
  referenceNo: string | null;
  bankName: string | null;
  branch: string | null;
  chequeDate: string | null;
  paymentDate: string | null;
  note: string | null;
  receivedOn: string;
};

function modeLabel(mode: string): string {
  return MODES.find((m) => m.value === mode)?.label ?? mode.replaceAll("_", " ");
}

function StateMessage({ state }: { state: PaymentFormState | undefined }) {
  if (!state) return null;
  if (state.error) {
    return <div className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{state.error}</div>;
  }
  if (state.success) {
    return <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">Saved.</div>;
  }
  return null;
}

function PaymentFields({ defaults }: { defaults?: OutstandingPaymentData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Amount">
          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            defaultValue={defaults?.amount}
          />
        </Field>
        <Field label="Mode">
          <Select name="mode" defaultValue={defaults?.mode ?? "CHEQUE"}>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Cheque / UTR no.">
          <Input name="referenceNo" placeholder="Optional" defaultValue={defaults?.referenceNo ?? ""} />
        </Field>
        <Field label="Bank name">
          <Input name="bankName" placeholder="Optional" defaultValue={defaults?.bankName ?? ""} />
        </Field>
        <Field label="Branch">
          <Input name="branch" placeholder="Optional" defaultValue={defaults?.branch ?? ""} />
        </Field>
        <Field label="Cheque date">
          <Input name="chequeDate" type="date" defaultValue={defaults?.chequeDate ?? ""} />
        </Field>
        <Field label="Payment date">
          <Input name="paymentDate" type="date" defaultValue={defaults?.paymentDate ?? ""} />
        </Field>
      </div>
      <Field label="Note">
        <Input name="note" placeholder="Optional" defaultValue={defaults?.note ?? ""} />
      </Field>
    </>
  );
}

function AddPaymentForm({ outstandingId, balance }: { outstandingId: string; balance: number }) {
  const [state, formAction, pending] = useActionState(recordOutstandingPayment, undefined);
  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <input type="hidden" name="id" value={outstandingId} />
      <StateMessage state={state} />
      <p className="text-xs font-medium text-gray-500">Balance due: {formatINR(balance)}</p>
      <PaymentFields />
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? <Spinner /> : null} Save payment
      </Button>
    </form>
  );
}

function EditPaymentForm({ payment }: { payment: OutstandingPaymentData }) {
  const [state, formAction, pending] = useActionState(updateOutstandingPayment, undefined);
  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-lg border border-brand-100 bg-brand-50/50 p-3">
      <input type="hidden" name="id" value={payment.id} />
      <StateMessage state={state} />
      <PaymentFields defaults={payment} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Spinner /> : null} Update payment
      </Button>
    </form>
  );
}

function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const [state, formAction, pending] = useActionState(deleteOutstandingPayment, undefined);
  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm("Delete this payment? This cannot be undone.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={paymentId} />
        <button
          type="submit"
          disabled={pending}
          className="font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </form>
      {state?.error ? (
        <div className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{state.error}</div>
      ) : null}
    </div>
  );
}

function PaymentCard({ payment }: { payment: OutstandingPaymentData }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-gray-900">{formatINR(payment.amount)}</span>
        <span>Paid on {formatDate(payment.paymentDate ?? payment.receivedOn)}</span>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span>
          {modeLabel(payment.mode)}
          {payment.referenceNo ? ` · ${payment.referenceNo}` : ""}
          {payment.bankName ? ` · ${payment.bankName}` : ""}
          {payment.branch ? ` · ${payment.branch}` : ""}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="font-medium text-brand-600 hover:underline"
          >
            {editing ? "Cancel" : "Modify"}
          </button>
          <DeletePaymentButton paymentId={payment.id} />
        </div>
      </div>
      {editing ? <EditPaymentForm payment={payment} /> : null}
    </div>
  );
}

export function OutstandingPayments({
  outstandingId,
  balance,
  settled,
  payments,
}: {
  outstandingId: string;
  balance: number;
  settled: boolean;
  payments: OutstandingPaymentData[];
}) {
  return (
    <div className="mt-2 space-y-3">
      {payments.length > 0 && (
        <div className="space-y-2">
          {payments.map((p) => (
            <PaymentCard key={p.id} payment={p} />
          ))}
        </div>
      )}
      {!settled && (
        <AddPaymentForm key={payments.length} outstandingId={outstandingId} balance={balance} />
      )}
    </div>
  );
}
