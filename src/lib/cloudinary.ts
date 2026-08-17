import "server-only";
import cloudinary from "cloudinary";

const DOC_FOLDERS: Record<string, string> = {
  INVOICE: "Invoice",
  CHALLAN: "Delivery Challan",
};

const ROOT_FOLDER = "Momai Traders";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
    );
  }
  cloudinary.v2.config({ cloud_name, api_key, api_secret, secure: true });
  return cloudinary.v2;
}

function sanitizeSegment(name: string): string {
  return name
    .replace(/[\\/'":*?<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function uploadStampedCopy({
  company,
  state,
  date,
  docType,
  fileName,
  mimeType,
  buffer,
}: {
  company: string;
  state: string;
  date: Date;
  docType: "INVOICE" | "CHALLAN";
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ publicId: string; secureUrl: string; folderPath: string }> {
  const cld = getCloudinary();

  const companySegment = sanitizeSegment(company) || "Unknown Company";
  const stateSegment = sanitizeSegment(state) || "No State";
  const year = String(date.getFullYear());
  const month = `${String(date.getMonth() + 1).padStart(2, "0")}-${MONTH_NAMES[date.getMonth()]}`;
  const day = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${year}`;
  const folder = [ROOT_FOLDER, companySegment, stateSegment, year, month, day, DOC_FOLDERS[docType] ?? "Other"].join("/");

  const resourceType = mimeType === "application/pdf" ? "raw" : "image";
  const publicId = fileName.replace(/\.[^.]+$/, "");
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cld.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    resource_type: resourceType,
    overwrite: false,
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    folderPath: folder,
  };
}
