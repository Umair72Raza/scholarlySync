# 🎓 ScholarlySync — Prisma Mastery Guide

This guide explains how to manage your database effectively using Prisma. Understanding these commands will prevent "400 Bad Request" errors and TypeScript mismatches.

---

## 🛠 The Core Commands

### 1. `npx prisma generate`
*   **What it does**: Updates the **Prisma Client** (the code you use to talk to the DB).
*   **When to run**: **Every single time you change `schema.prisma`**.
*   **Why**: It regenerates the TypeScript types. If you add a field like `teacherId` in the schema but don't run this, your code won't know that field exists and will show red squiggly lines.

### 2. `npx prisma db push`
*   **What it does**: Syncs your schema **directly** to the database without creating migration files.
*   **When to run**: During **early development** and prototyping.
*   **Why**: It's the fastest way to see changes in the DB.
*   **Warning**: If you add a "Required" field to a table that already has data, it will ask to **reset** the database (wiping all data).

### 3. `npx prisma migrate dev`
*   **What it does**: Creates a historical record (a "migration" file) of your changes and applies them.
*   **When to run**: When you want to keep a history of your database changes or when working in a team.
*   **Why**: It's the professional way to manage DB evolution. It creates a `prisma/migrations` folder.

### 4. `npx prisma db seed`
*   **What it does**: Runs the script in `prisma/seed.ts`.
*   **When to run**: After a database reset or when you need fresh test data (Admin accounts, mock courses, etc.).
*   **Why**: Saves you from manually creating users/data via the UI every time the DB is wiped.

---

## 🚀 Common Workflows

### Scenario A: "I just added a new field/model to schema.prisma"
Run these in order:
1. `npx prisma generate` (Fixes code types)
2. `npx prisma db push` (Fixes the actual DB tables)
3. (Optional) `npx prisma db seed` (If the DB was reset)

### Scenario B: "I'm getting 'Known properties' errors in my Controller"
This means your code types are old.
1. Run `npx prisma generate`

### Scenario C: "The database is totally messed up and I want to start fresh"
1. `npx prisma migrate reset` (Wipes everything and re-runs migrations/seed)

---

## 💡 Pro-Tip: Prisma Studio
If you want to **see** your data in a browser like an Excel sheet:
```powershell
npx prisma studio
```
This opens a local UI at `http://localhost:5555` where you can manually add, edit, or delete users and courses.
