"use client";

import Image from "next/image";
import { useState } from "react";

export function ClientLogo({
  src,
  name,
  category,
}: {
  src: string;
  name: string;
  category: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex h-16 items-center justify-center">
        {failed ? (
          <span className="text-sm font-bold text-gray-300">{name}</span>
        ) : (
          <Image
            src={src}
            alt={name}
            width={120}
            height={56}
            className="max-h-14 w-auto object-contain"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-gray-800">{name}</p>
      <p className="text-xs text-gray-400">{category}</p>
    </div>
  );
}
