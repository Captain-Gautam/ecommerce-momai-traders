import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PincodeLookup = { city: string; state: string };

const CACHE_MAX = 200;
const CACHE = new Map<string, PincodeLookup | null>();

function setCache(pin: string, value: PincodeLookup | null) {
  if (CACHE.size >= CACHE_MAX) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
  CACHE.set(pin, value);
}

type PostalPincodeResponse = Array<{
  Status: string;
  Message: string;
  PostOffice?: Array<{
    Name?: string;
    District?: string;
    State?: string;
  }>;
}>;

export async function GET(req: Request) {
  const pin = new URL(req.url).searchParams.get("pin") ?? "";

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Invalid PIN code" }, { status: 400 });
  }

  if (CACHE.has(pin)) {
    const cached = CACHE.get(pin);
    if (cached) return NextResponse.json(cached);
    return NextResponse.json({ error: "No details found for this PIN code" }, { status: 404 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`postalpincode.in responded with ${res.status}`);
    }
    const data = (await res.json()) as PostalPincodeResponse;
    const first = data?.[0]?.PostOffice?.[0];

    if (first?.District && first?.State) {
      const result = { city: first.District, state: first.State };
      setCache(pin, result);
      return NextResponse.json(result);
    }

    setCache(pin, null);
    return NextResponse.json({ error: "No details found for this PIN code" }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "Could not look up this PIN code. Please enter the city and state manually." },
      { status: 502 }
    );
  }
}
