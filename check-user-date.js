const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            where: { am: '1' }, // Assuming AM 1 based on screenshot "AM: 1"
        });
        console.log('User:', user);
        if (user) {
            console.log('Start Date:', user.startDate.toISOString());
            if (user.endDate) {
                console.log('End Date:', user.endDate.toISOString());
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
