const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("admin123", 12);
  const studentPassword = await bcrypt.hash("student123", 12);

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@unicanteen.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@unicanteen.com",
      phone: "9999999999",
      passwordHash: password,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Super Admin created:", superAdmin.email);

  // Hostels
  const hostels = await Promise.all(
    ["Boys Hostel A", "Girls Hostel B", "Co-Ed Hostel C"].map((name, i) =>
      prisma.hostel.upsert({
        where: { name },
        update: {},
        create: { name, location: `Block ${String.fromCharCode(65 + i)}, University Campus` },
      })
    )
  );
  console.log("Hostels created:", hostels.length);

  // Canteen Admins
  const canteenAdmins = await Promise.all(
    hostels.map((h, i) =>
      prisma.user.upsert({
        where: { email: `canteen${i + 1}@unicanteen.com` },
        update: {},
        create: {
          name: `Canteen Admin ${i + 1}`,
          email: `canteen${i + 1}@unicanteen.com`,
          phone: `988888888${i + 1}`,
          passwordHash: password,
          role: "CANTEEN_ADMIN",
          hostelId: h.id,
        },
      })
    )
  );

  // Canteens
  const canteens = await Promise.all(
    hostels.map((h, i) =>
      prisma.canteen.upsert({
        where: { hostelId: h.id },
        update: {},
        create: {
          name: `${h.name} Canteen`,
          hostelId: h.id,
          adminId: canteenAdmins[i].id,
          description: `Daily lunch and dinner for ${h.name} students`,
          lunchStart: "12:00",
          lunchEnd: "14:30",
          dinnerStart: "19:00",
          dinnerEnd: "21:30",
        },
      })
    )
  );
  console.log("Canteens created:", canteens.length);

  // Test Student
  await prisma.user.upsert({
    where: { email: "student@unicanteen.com" },
    update: {},
    create: {
      name: "Test Student",
      email: "student@unicanteen.com",
      phone: "9777777777",
      passwordHash: studentPassword,
      role: "STUDENT",
      hostelId: hostels[0].id,
    },
  });
  console.log("Test student created");

  // Menu — Lunch and Dinner only
  const menuData = [
    {
      category: "Lunch",
      items: [
        { name: "Veg Thali", price: 60, isVeg: true },
        { name: "Non-Veg Thali", price: 80, isVeg: false },
        { name: "Rajma Chawal", price: 45, isVeg: true },
        { name: "Chole Bhature", price: 50, isVeg: true },
        { name: "Dal Fry + Rice", price: 40, isVeg: true },
        { name: "Chicken Biryani", price: 90, isVeg: false },
        { name: "Egg Biryani", price: 70, isVeg: false },
        { name: "Paneer Butter Masala + Roti", price: 70, isVeg: true },
        { name: "Aloo Gobi + Rice", price: 40, isVeg: true },
        { name: "Fish Curry + Rice", price: 85, isVeg: false },
        { name: "Kadhi Chawal", price: 35, isVeg: true },
        { name: "Mix Veg + Roti", price: 45, isVeg: true },
        { name: "Curd Rice", price: 30, isVeg: true },
        { name: "Roti (2 pcs)", price: 10, isVeg: true },
        { name: "Plain Rice", price: 15, isVeg: true },
        { name: "Salad", price: 15, isVeg: true },
        { name: "Raita", price: 10, isVeg: true },
        { name: "Buttermilk", price: 10, isVeg: true },
      ],
    },
    {
      category: "Dinner",
      items: [
        { name: "Veg Thali", price: 60, isVeg: true },
        { name: "Non-Veg Thali", price: 80, isVeg: false },
        { name: "Dal Tadka + Roti", price: 40, isVeg: true },
        { name: "Palak Paneer + Roti", price: 65, isVeg: true },
        { name: "Egg Curry + Rice", price: 55, isVeg: false },
        { name: "Chicken Curry + Roti", price: 75, isVeg: false },
        { name: "Aloo Matar + Rice", price: 40, isVeg: true },
        { name: "Chana Masala + Roti", price: 45, isVeg: true },
        { name: "Jeera Rice", price: 25, isVeg: true },
        { name: "Roti (2 pcs)", price: 10, isVeg: true },
        { name: "Dal Fry + Rice", price: 40, isVeg: true },
        { name: "Paneer Tikka", price: 60, isVeg: true },
        { name: "Mutton Curry + Roti", price: 100, isVeg: false },
        { name: "Mixed Dal + Rice", price: 35, isVeg: true },
        { name: "Soup", price: 20, isVeg: true },
        { name: "Gulab Jamun (2 pcs)", price: 20, isVeg: true },
        { name: "Kheer", price: 25, isVeg: true },
      ],
    },
  ];

  for (const canteen of canteens) {
    for (let i = 0; i < menuData.length; i++) {
      const cat = await prisma.menuCategory.upsert({
        where: { canteenId_name: { canteenId: canteen.id, name: menuData[i].category } },
        update: {},
        create: {
          name: menuData[i].category,
          canteenId: canteen.id,
          sortOrder: i,
        },
      });

      for (const item of menuData[i].items) {
        // Check if item already exists in this category
        const existing = await prisma.menuItem.findFirst({
          where: { categoryId: cat.id, name: item.name },
        });
        if (!existing) {
          await prisma.menuItem.create({
            data: {
              name: item.name,
              price: item.price,
              isVeg: item.isVeg,
              categoryId: cat.id,
              isAvailable: false, // Admin sets daily menu
              description: `${item.name} from ${canteen.name}`,
            },
          });
        }
      }
    }
  }
  console.log("Menu items seeded (Lunch & Dinner) for all canteens");

  console.log("\n--- Seed Complete ---");
  console.log("Super Admin:    admin@unicanteen.com / admin123");
  console.log("Canteen Admins: canteen1@unicanteen.com, canteen2@, canteen3@ / admin123");
  console.log("Student:        student@unicanteen.com / student123");
  console.log("\nNote: All items are OFF by default. Canteen admins set today's menu daily.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
