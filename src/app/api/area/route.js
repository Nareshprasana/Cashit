import prisma from "@/lib/prisma";

export async function GET() {
  const areas = await prisma.area.findMany();
  return new Response(JSON.stringify(areas));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { areaName, shortCode, pincode } = body;

    if (!areaName || !shortCode || !pincode) {
      return new Response(JSON.stringify({ error: "All fields required" }), { status: 400 });
    }

    const existing = await prisma.area.findFirst({
      where: { areaName },
    });

    if (existing) {
      return new Response(JSON.stringify({ error: "Area already exists" }), { status: 409 });
    }

    const newArea = await prisma.area.create({
      data: { areaName, shortCode, pincode },
    });

    return new Response(JSON.stringify(newArea), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to create area" }), { status: 500 });
  }
}
