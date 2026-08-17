"use client";

import { type FormEvent, type ReactNode } from "react";

export function ConfirmForm({
  message,
  action,
  children,
  className,
}: {
  message: string;
  action: (formData: FormData) => Promise<void> | void;
  children: ReactNode;
  className?: string;
}) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) e.preventDefault();
  };

  return (
    <form action={action} onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}
