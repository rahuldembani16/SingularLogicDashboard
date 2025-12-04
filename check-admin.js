const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const admin = await prisma.admin.findUnique({
            where: { username: 'admin' },
        });
        console.log('Admin user found:', admin);
    } catch (e) {
        console.error('Error finding admin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
