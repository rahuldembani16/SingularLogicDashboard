const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Create Categories
    const onSite = await prisma.category.upsert({
        where: { code: 'OS' },
        update: {},
        create: {
            code: 'OS',
            label: 'On Site',
            color: 'bg-green-100 text-green-800 border-green-200',
            isWorkDay: true,
        },
    });

    const teleworking = await prisma.category.upsert({
        where: { code: 'T' },
        update: {},
        create: {
            code: 'T',
            label: 'Teleworking',
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            isWorkDay: true,
        },
    });

    const outOfOffice = await prisma.category.upsert({
        where: { code: 'OOO' },
        update: {},
        create: {
            code: 'OOO',
            label: 'Out of Office',
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            isWorkDay: false,
        },
    });

    const businessTrip = await prisma.category.upsert({
        where: { code: 'BT' },
        update: {},
        create: {
            code: 'BT',
            label: 'Business Trip',
            color: 'bg-purple-100 text-purple-800 border-purple-200',
            isWorkDay: true,
        },
    });

    // Create Departments
    const rd = await prisma.department.upsert({ where: { name: 'R&D' }, update: {}, create: { name: 'R&D' } });
    const hr = await prisma.department.upsert({ where: { name: 'HR' }, update: {}, create: { name: 'HR' } });
    const sales = await prisma.department.upsert({ where: { name: 'Sales' }, update: {}, create: { name: 'Sales' } });
    const marketing = await prisma.department.upsert({ where: { name: 'Marketing' }, update: {}, create: { name: 'Marketing' } });

    // Create Users
    await prisma.user.upsert({
        where: { am: '8818' },
        update: {},
        create: {
            am: '8818',
            surname: 'Dembani',
            name: 'Rachid',
            departmentId: rd.id,
        },
    });

    await prisma.user.upsert({
        where: { am: '1001' },
        update: {},
        create: {
            am: '1001',
            surname: 'Doe',
            name: 'John',
            departmentId: sales.id,
        },
    });

    // Create Admin
    await prisma.admin.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: 'SingularR&DAdmin@!@',
        },
    });

    console.log('Seed data created successfully');
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
