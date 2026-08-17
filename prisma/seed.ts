import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ---------- Settings ----------
  const settings: Record<string, string> = {
    storeName: "Momai Traders",
    tagline: "Wholesale Supplier Of Cleaning Material & Stationery",
    phone1: "+91 99749 02733",
    phone2: "+91 87884 77773",
    email: "momaitraders73@gmail.com",
    whatsapp: "919974902733",
    address:
      "Shop-10, Simandhar Complex, Near Prabhat Chowk, Ghatlodiya, Ahmedabad, Gujarat 380061",
    businessHours: "Monday – Saturday: 9:00 AM – 9:00 PM | Sunday: Closed",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.5!2d72.5421!3d23.06967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDA0JzEwLjgiTiA3MsKwMzInMzEuNiJF!5e0!3m2!1sen!2sin!4v1700000000000",
    gstin: "",
    stateCode: "24",
    legalName: "Momai Traders",
    invoicePrefix: "MTINV",
    challanPrefix: "MTDC",
    invoiceFooterNote:
      "Thank you for your business! Prices are final as quoted. Goods once sold will not be taken back.",
    currency: "INR",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log("Settings seeded.");

  // ---------- Admin user ----------
  const adminEmail = process.env.ADMIN_EMAIL || "admin@momaitraders.in";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      name: "Jigar Prajapati",
      email: adminEmail,
      phone: "+91 99749 02733",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  // ---------- Categories & products ----------
  const categories: Array<{
    name: string;
    slug: string;
    description: string;
    image: string;
    sortOrder: number;
    products: Array<{
      name: string;
      description: string;
      unit: string;
      price?: number;
      gstRate: number;
      hsnCode?: string;
      minOrderQty: number;
      stock?: number;
      isFeatured?: boolean;
    }>;
  }> = [
    {
      name: "Office Stationery Material",
      slug: "office-stationery",
      description: "Complete range of office stationery items for all your business needs.",
      image: "/images/gallery/office-stationery.jpeg",
      sortOrder: 1,
      products: [
        {
          name: "A4 Copier Paper (75 GSM) — Ream",
          description: "Premium 75 GSM A4 copier paper, 500 sheets per ream.",
          unit: "ream",
          price: 245,
          gstRate: 18,
          hsnCode: "4802",
          minOrderQty: 5,
          stock: 500,
          isFeatured: true,
        },
        {
          name: "Gel Pen (Blue/Black) — Box of 50",
          description: "Smooth writing gel pens with comfortable grip. Box of 50 pieces.",
          unit: "box",
          price: 350,
          gstRate: 18,
          hsnCode: "9608",
          minOrderQty: 2,
          stock: 300,
        },
        {
          name: "Stapler + Pins Combo",
          description: "Heavy-duty office stapler with box of 1000 pins.",
          unit: "set",
          price: 180,
          gstRate: 18,
          hsnCode: "8472",
          minOrderQty: 3,
          stock: 200,
        },
        {
          name: "Register Notebook (200 Pages)",
          description: "Hardbound register notebook, 200 pages, long size.",
          unit: "pcs",
          price: 90,
          gstRate: 12,
          hsnCode: "4820",
          minOrderQty: 10,
          stock: 800,
        },
        {
          name: "File Folders & Box Files",
          description: "Office file folders, box files and binding materials.",
          unit: "pcs",
          price: 60,
          gstRate: 12,
          hsnCode: "4819",
          minOrderQty: 20,
          stock: 600,
        },
      ],
    },
    {
      name: "Housekeeping Material",
      slug: "housekeeping-material",
      description: "Complete range of housekeeping and cleaning materials.",
      image: "/images/gallery/housekeeping.jpeg",
      sortOrder: 2,
      products: [
        {
          name: "Floor Cleaner Concentrate (5 Litre)",
          description: "Multi-purpose floor cleaner concentrate for mopping and scrubbing.",
          unit: "pcs",
          gstRate: 18,
          hsnCode: "3402",
          minOrderQty: 4,
        },
        {
          name: "Phenyl Concentrate (1 Litre)",
          description: "Disinfectant phenyl for floors and surfaces.",
          unit: "pcs",
          gstRate: 18,
          hsnCode: "3402",
          minOrderQty: 12,
        },
        {
          name: "Dishwash Bar / Liquid (Pack)",
          description: "Kitchen dishwash solution for hotels and homes.",
          unit: "pack",
          gstRate: 18,
          hsnCode: "3402",
          minOrderQty: 10,
        },
        {
          name: "Dusting Cloth / Wipes (Bundle)",
          description: "Soft dusting cloths for office and commercial cleaning.",
          unit: "bundle",
          price: 150,
          gstRate: 5,
          hsnCode: "6307",
          minOrderQty: 5,
          stock: 400,
        },
        {
          name: "Industrial Broom / Brush Set",
          description: "Heavy-duty brooms and cleaning brushes.",
          unit: "set",
          gstRate: 5,
          hsnCode: "9603",
          minOrderQty: 3,
        },
      ],
    },
    {
      name: "All Type Of Washroom Solutions",
      slug: "washroom-solutions",
      description: "Comprehensive washroom solutions and hygiene supplies.",
      image: "/images/gallery/washroom-solutions.jpeg",
      sortOrder: 3,
      products: [
        {
          name: "Liquid Handwash Refill (5 Litre)",
          description: "Antibacterial liquid handwash refill for dispensers.",
          unit: "pcs",
          gstRate: 18,
          hsnCode: "3401",
          minOrderQty: 4,
        },
        {
          name: "Toilet Cleaner (Pack)",
          description: "Hygienic toilet cleaning solution.",
          unit: "pack",
          gstRate: 18,
          hsnCode: "3402",
          minOrderQty: 6,
        },
        {
          name: "Air Freshener / Urinal Cakes",
          description: "Air fresheners and urinal deodorizer cakes.",
          unit: "pcs",
          price: 45,
          gstRate: 18,
          hsnCode: "3307",
          minOrderQty: 12,
          stock: 500,
        },
        {
          name: "Paper Hand Towels (Box)",
          description: "Soft paper hand towels for washrooms.",
          unit: "box",
          price: 320,
          gstRate: 18,
          hsnCode: "4803",
          minOrderQty: 2,
          stock: 150,
        },
      ],
    },
    {
      name: "All Type Of Printing Services",
      slug: "printing-services",
      description: "Professional printing services for documents, banners and promotions.",
      image: "/images/gallery/printing-services.jpeg",
      sortOrder: 4,
      products: [
        {
          name: "Banner / Flex Printing (Per Sq. Ft.)",
          description: "High-resolution banner and flex printing. Price on enquiry.",
          unit: "sqft",
          gstRate: 18,
          minOrderQty: 10,
        },
        {
          name: "Visiting Cards & Business Stationery",
          description: "Design and print visiting cards, letterheads, envelopes.",
          unit: "set",
          gstRate: 18,
          minOrderQty: 1,
        },
        {
          name: "Brochures & Pamphlets",
          description: "Full colour brochures and pamphlets, bulk pricing on enquiry.",
          unit: "set",
          gstRate: 18,
          minOrderQty: 100,
        },
      ],
    },
    {
      name: "Computer Consumable",
      slug: "computer-consumable",
      description: "Computer accessories and consumables for all IT needs.",
      image: "/images/gallery/computer-consumable.jpeg",
      sortOrder: 5,
      products: [
        {
          name: "Printer Toner Cartridge (Universal)",
          description: "Compatible printer toner cartridges for major brands.",
          unit: "pcs",
          gstRate: 18,
          hsnCode: "8443",
          minOrderQty: 2,
        },
        {
          name: "Printer Ribbon (Various Models)",
          description: "Printer ribbons for dot-matrix and cash printers.",
          unit: "pcs",
          price: 120,
          gstRate: 18,
          hsnCode: "8443",
          minOrderQty: 5,
          stock: 250,
        },
        {
          name: "Mouse / Keyboard / Cables",
          description: "IT peripherals and cables for office setups.",
          unit: "pcs",
          gstRate: 18,
          hsnCode: "8471",
          minOrderQty: 2,
        },
      ],
    },
    {
      name: "Industrial Packing Material",
      slug: "industrial-packing",
      description: "Specialized industrial packaging materials for heavy-duty use.",
      image: "/images/gallery/industrial-packing.jpeg",
      sortOrder: 6,
      products: [
        {
          name: "HDPE Bags (All Sizes)",
          description: "High-density polyethylene bags in all sizes and gauges.",
          unit: "kg",
          gstRate: 18,
          hsnCode: "3923",
          minOrderQty: 5,
        },
        {
          name: "Stretch Film Roll (Pallet Wrap)",
          description: "Stretch wrap film for palletising and bundling.",
          unit: "roll",
          price: 750,
          gstRate: 18,
          hsnCode: "3920",
          minOrderQty: 5,
          stock: 300,
          isFeatured: true,
        },
        {
          name: "Packing Tape / BOPP Tape",
          description: "BOPP packing tape rolls in multiple widths.",
          unit: "roll",
          price: 85,
          gstRate: 18,
          hsnCode: "3919",
          minOrderQty: 24,
          stock: 1000,
          isFeatured: true,
        },
        {
          name: "Bubble Wrap (Roll)",
          description: "Bubble cushioning roll for fragile item protection.",
          unit: "roll",
          gstRate: 18,
          hsnCode: "3921",
          minOrderQty: 3,
        },
        {
          name: "Corrugated Boxes (Assorted)",
          description: "Corrugated shipping boxes in assorted sizes.",
          unit: "pcs",
          gstRate: 18,
          hsnCode: "4819",
          minOrderQty: 25,
        },
      ],
    },
    {
      name: "Disposable Material",
      slug: "disposable-material",
      description: "High-quality disposable products for commercial and industrial use.",
      image: "/images/gallery/disposable-material.jpeg",
      sortOrder: 7,
      products: [
        {
          name: "Plastic Cups / Glasses (Pack)",
          description: "Disposable plastic cups and glasses in bulk packs.",
          unit: "pack",
          gstRate: 18,
          hsnCode: "3924",
          minOrderQty: 20,
        },
        {
          name: "Plates & Spoons (Pack)",
          description: "Disposable plates and cutlery for events.",
          unit: "pack",
          gstRate: 18,
          hsnCode: "3924",
          minOrderQty: 20,
        },
        {
          name: "Paper Napkins / Serviettes",
          description: "Paper napkins and serviettes for restaurants.",
          unit: "pack",
          price: 110,
          gstRate: 18,
          hsnCode: "4803",
          minOrderQty: 10,
          stock: 600,
        },
        {
          name: "Disposable Gloves (Box)",
          description: "Disposable hand gloves for hygiene and handling.",
          unit: "box",
          gstRate: 18,
          hsnCode: "4015",
          minOrderQty: 10,
        },
      ],
    },
    {
      name: "All Types Of Dustbins",
      slug: "dustbins",
      description: "Wide variety of dustbins and waste management solutions.",
      image: "/images/gallery/dustbins.jpeg",
      sortOrder: 8,
      products: [
        {
          name: "Plastic Dustbin 20-100 Litre",
          description: "Durable plastic dustbins with lid in multiple capacities.",
          unit: "pcs",
          price: 650,
          gstRate: 18,
          hsnCode: "3924",
          minOrderQty: 2,
          stock: 120,
          isFeatured: true,
        },
        {
          name: "Stainless Steel Dustbin",
          description: "Pedal-operated stainless steel dustbins for offices.",
          unit: "pcs",
          price: 1200,
          gstRate: 18,
          hsnCode: "7323",
          minOrderQty: 2,
          stock: 80,
        },
        {
          name: "Large Industrial Waste Bin (240L+)",
          description: "Wheeled industrial waste bins for commercial spaces.",
          unit: "pcs",
          gstRate: 18,
          hsnCode: "3924",
          minOrderQty: 1,
        },
      ],
    },
  ];

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, image: cat.image, sortOrder: cat.sortOrder },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        sortOrder: cat.sortOrder,
      },
    });

    for (const p of cat.products) {
      const slug = slugify(p.name);
      await prisma.product.upsert({
        where: { slug },
        update: {
          categoryId: category.id,
          description: p.description,
          unit: p.unit,
          price: p.price,
          gstRate: p.gstRate,
          hsnCode: p.hsnCode,
          minOrderQty: p.minOrderQty,
          stock: p.stock,
          isFeatured: p.isFeatured,
          images: [cat.image],
        },
        create: {
          name: p.name,
          slug,
          categoryId: category.id,
          description: p.description,
          unit: p.unit,
          price: p.price,
          gstRate: p.gstRate,
          hsnCode: p.hsnCode,
          minOrderQty: p.minOrderQty,
          stock: p.stock,
          isFeatured: p.isFeatured,
          images: [cat.image],
        },
      });
    }
    console.log(`Seeded category: ${cat.name}`);
  }

  // ---------- Banners ----------
  const banners = [
    {
      title: "Wholesale Supplier Of Cleaning Material & Stationery",
      subtitle: "From Paper to Polish — your one stop solution in Ahmedabad, Gujarat.",
      image: "/images/gallery/industrial-packing.jpeg",
      link: "/products",
      sortOrder: 1,
    },
    {
      title: "Industrial Packing & Housekeeping Solutions",
      subtitle: "HDPE bags, stretch films, tapes and complete housekeeping range.",
      image: "/images/gallery/housekeeping.jpeg",
      link: "/products?category=industrial-packing",
      sortOrder: 2,
    },
    {
      title: "Trusted by Leading Organisations Across Gujarat",
      subtitle: "DHL, Arvind, Merengo CIMS, Empire and more.",
      image: "/images/gallery/dustbins.jpeg",
      link: "/clients",
      sortOrder: 3,
    },
  ];
  for (const [i, b] of banners.entries()) {
    await prisma.banner.upsert({
      where: { id: `seed-banner-${i + 1}` },
      update: b,
      create: { id: `seed-banner-${i + 1}`, ...b },
    });
  }
  console.log("Banners seeded.");

  console.log("Seed complete ✔");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
