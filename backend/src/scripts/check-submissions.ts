import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const submissions = await prisma.submission.findMany({
    include: {
      assignment: {
        include: {
          course: true
        }
      },
      user: true
    }
  });
  console.log('Total Submissions:', submissions.length);
  submissions.forEach(s => {
    console.log(`Sub ID: ${s.id}, Student: ${s.user.name}, Assignment: ${s.assignment.title}, Teacher ID: ${s.assignment.course.teacherId}`);
  });
  await prisma.$disconnect();
}

check();
