type CourierEntry = {
  match: RegExp;
  url: (trackingNumber: string) => string;
};

const COURIER_TRACKING_URLS: CourierEntry[] = [
  {
    match: /delhivery/,
    url: (n) => `https://www.delhivery.com/track/package/${encodeURIComponent(n)}`,
  },
  {
    match: /blue\s*dart|bluedart/,
    url: (n) => `https://www.bluedart.com/domestic/consignment-tracking?consignmentNo=${encodeURIComponent(n)}`,
  },
  {
    match: /dtdc/,
    url: (n) => `https://www.dtdc.in/tracking/shipment-tracking/${encodeURIComponent(n)}`,
  },
  {
    match: /india\s*post|speed\s*post/,
    url: (n) =>
      `https://www.indiapost.gov.in/_layouts/15/DOP.Tracking.TrackConsignment.aspx?PostNumber=${encodeURIComponent(n)}`,
  },
  {
    match: /shiprocket/,
    url: (n) => `https://www.shiprocket.in/tracking/${encodeURIComponent(n)}`,
  },
  {
    match: /ecom\s*express/,
    url: (n) => `https://ecomexpress.in/track-your-shipment/?awb=${encodeURIComponent(n)}`,
  },
  {
    match: /fedex/,
    url: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  },
  {
    match: /xpress\s*bees|xpressbees/,
    url: (n) => `https://www.xpressbees.com/track/${encodeURIComponent(n)}`,
  },
];

export function buildTrackingUrl(
  courierName: string | null | undefined,
  trackingNumber: string | null | undefined,
  customUrl?: string | null
): string | null {
  const override = customUrl?.trim();
  if (override) return override;

  const name = courierName?.trim();
  const number = trackingNumber?.trim();
  if (!name || !number) return null;

  const normalized = name.toLowerCase();
  const entry = COURIER_TRACKING_URLS.find((c) => c.match.test(normalized));
  return entry ? entry.url(number) : null;
}
