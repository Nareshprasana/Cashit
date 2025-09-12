import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shortCode = searchParams.get('areaShortCode');

    if (!shortCode) {
      return new Response(JSON.stringify({ error: 'Missing areaShortCode' }), { status: 400 });
    }

    const prefix = `CUST-${shortCode}-`;

    // Fetch customers with matching prefix
    const customers = await prisma.customer.findMany({
      where: {
        customerCode: {
          startsWith: prefix,
        },
      },
      select: {
        customerCode: true,
      },
    });

    console.log("Found customer codes:", customers.map(c => c.customerCode));


    // Find the highest number used for this area prefix
    let maxNumber = 1000;
    for (const { customerCode } of customers) {
      // Extract the number at the end of the code
      const match = customerCode.match(new RegExp(`^${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\d+)$`));
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    const nextNumber = maxNumber + 1;
    const generatedCode = `${prefix}${nextNumber}`;

    return new Response(JSON.stringify({ nextNumber, generatedCode }), { status: 200 });
  } catch (error) {
    console.error('Error generating customer code:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
