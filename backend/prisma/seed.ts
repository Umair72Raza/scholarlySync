import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...\n');

  // ─── Users ───────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@scholarlysync.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@scholarlysync.com',
      password: hashedPassword,
      role: Role.ADMIN,
      is_premium: true,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@scholarlysync.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Ahmed',
      email: 'teacher@scholarlysync.com',
      password: hashedPassword,
      role: Role.TEACHER,
      is_premium: true,
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@scholarlysync.com' },
    update: {},
    create: {
      name: 'Ali Hassan',
      email: 'student1@scholarlysync.com',
      password: hashedPassword,
      role: Role.STUDENT,
      is_premium: true, // premium — can use AI assistant
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@scholarlysync.com' },
    update: {},
    create: {
      name: 'Fatima Khan',
      email: 'student2@scholarlysync.com',
      password: hashedPassword,
      role: Role.STUDENT,
      is_premium: false, // free tier — AI locked
    },
  });

  console.log('✅  Users seeded:', [admin.email, teacher.email, student1.email, student2.email].join(', '));

  // ─── Courses ──────────────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where: { code: 'CS301' },
    update: {},
    create: {
      name: 'Data Structures & Algorithms',
      code: 'CS301',
      teacherId: teacher.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { code: 'WD201' },
    update: {},
    create: {
      name: 'Full-Stack Web Development',
      code: 'WD201',
      teacherId: teacher.id,
    },
  });

  console.log('✅  Courses seeded:', [course1.code, course2.code].join(', '));

  // ─── Assignments ──────────────────────────────────────────
  const now = new Date();

  const assignment1 = await prisma.assignment.upsert({
    where: { id: 'seed-assignment-1' },
    update: {},
    create: {
      id: 'seed-assignment-1',
      title: 'Binary Search Tree Implementation',
      description: 'Implement a BST in your language of choice with insert, delete, and traversal methods.',
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      courseId: course1.id,
    },
  });

  const assignment2 = await prisma.assignment.upsert({
    where: { id: 'seed-assignment-2' },
    update: {},
    create: {
      id: 'seed-assignment-2',
      title: 'REST API Design Project',
      description: 'Design and document a RESTful API for a social media platform. Include OpenAPI spec.',
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      courseId: course2.id,
    },
  });

  console.log('✅  Assignments seeded:', [assignment1.title, assignment2.title].join(', '));

  // ─── Study Materials ──────────────────────────────────────
  const material1 = await prisma.material.upsert({
    where: { id: 'seed-material-1' },
    update: {},
    create: {
      id: 'seed-material-1',
      title: 'Introduction to Binary Trees',
      content: `A binary tree is a hierarchical data structure in which each node has at most two children,
referred to as the left child and the right child.

## Key Properties
- **Root**: The topmost node
- **Leaf**: A node with no children
- **Height**: The longest path from root to a leaf
- **Depth**: The distance from the root to a node

## Binary Search Tree (BST)
A BST is a binary tree where for every node:
- All values in the LEFT subtree are LESS than the node's value
- All values in the RIGHT subtree are GREATER than the node's value

## Time Complexities (Average Case)
| Operation | Time Complexity |
|-----------|----------------|
| Search    | O(log n)       |
| Insert    | O(log n)       |
| Delete    | O(log n)       |

## Traversal Methods
1. **In-order (LNR)**: Left → Node → Right — produces sorted output
2. **Pre-order (NLR)**: Node → Left → Right — used for tree copying
3. **Post-order (LRN)**: Left → Right → Node — used for deletion

## Common Interview Questions
- Find the height of a binary tree
- Check if a binary tree is balanced
- Find the lowest common ancestor of two nodes
- Serialize and deserialize a binary tree`,
      courseId: course1.id,
    },
  });

  const material2 = await prisma.material.upsert({
    where: { id: 'seed-material-2' },
    update: {},
    create: {
      id: 'seed-material-2',
      title: 'RESTful API Design Principles',
      content: `REST (Representational State Transfer) is an architectural style for building scalable web services.

## Core Constraints
1. **Stateless**: Each request must contain all information needed to process it
2. **Client-Server**: Separation of concerns between UI and data storage
3. **Cacheable**: Responses must define themselves as cacheable or non-cacheable
4. **Uniform Interface**: Consistent resource identification via URIs
5. **Layered System**: Client cannot tell whether it is connected directly to the end server

## HTTP Methods & Their Meanings
| Method  | Purpose            | Idempotent |
|---------|-------------------|------------|
| GET     | Read resource      | Yes        |
| POST    | Create resource    | No         |
| PUT     | Replace resource   | Yes        |
| PATCH   | Partial update     | No         |
| DELETE  | Remove resource    | Yes        |

## Status Code Groups
- **2xx Success**: 200 OK, 201 Created, 202 Accepted, 204 No Content
- **3xx Redirect**: 301 Moved, 304 Not Modified
- **4xx Client Error**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests
- **5xx Server Error**: 500 Internal Error, 502 Bad Gateway, 503 Service Unavailable

## Versioning Strategies
- URI Versioning: /api/v1/users
- Header Versioning: Accept: application/vnd.api+json;version=1
- Query Param: /api/users?version=1

## Best Practices
- Use nouns, not verbs, in URIs
- Use plural nouns: /users, not /user
- Return consistent error shapes
- Always paginate list endpoints
- Document with OpenAPI/Swagger`,
      courseId: course2.id,
    },
  });

  console.log('✅  Materials seeded:', [material1.title, material2.title].join(', '));

  // ─── Notifications ────────────────────────────────────────
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'seed-notif-1',
        userId: student1.id,
        message: 'Welcome to ScholarlySync! 🎓 Your AI Study Assistant is ready.',
        type: 'SYSTEM',
        read: false,
      },
      {
        id: 'seed-notif-2',
        userId: student2.id,
        message: 'Welcome to ScholarlySync! 🎓 Upgrade to Premium to unlock the AI Study Assistant.',
        type: 'SYSTEM',
        read: false,
      },
    ],
  });

  console.log('✅  Notifications seeded');

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓  ScholarlySync — Seed Complete!

  All accounts use password: password123

  👤 admin@scholarlysync.com    → ADMIN    (Premium)
  👤 teacher@scholarlysync.com  → TEACHER  (Premium)
  👤 student1@scholarlysync.com → STUDENT  (Premium ✅)
  👤 student2@scholarlysync.com → STUDENT  (Free ❌)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
