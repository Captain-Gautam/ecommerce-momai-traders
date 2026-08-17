import "dotenv/config";
import cloudinary from "cloudinary";

async function main() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    console.error(
      "Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in .env"
    );
    process.exit(1);
  }

  cloudinary.v2.config({ cloud_name, api_key, api_secret, secure: true });

  const result = await cloudinary.v2.uploader.upload(
    "data:text/plain;base64,Q2xvdWRpbmFyeSBjb25uZWN0aW9uIE9LCg==",
    { folder: "_test", public_id: "test-connection", resource_type: "raw", overwrite: false }
  );

  console.log(`Cloudinary connection OK — public_id: ${result.public_id}`);
  console.log(`View: ${result.secure_url}`);
  console.log("You can delete the test file from the Media Library afterwards.");
}

main().catch((err) => {
  console.error("Cloudinary connection FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
