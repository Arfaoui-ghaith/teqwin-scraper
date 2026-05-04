-- Run this SQL if tables don't exist (e.g. psql $DATABASE_URL -f scripts/create-tables.sql)
CREATE TABLE IF NOT EXISTS "internship_company" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR UNIQUE,
    "image" VARCHAR,
    "address" VARCHAR,
    "country" VARCHAR NOT NULL,
    "countryFlag" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS "internship_skill" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR UNIQUE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS "internship" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR NOT NULL,
    "datePosted" TIMESTAMP NOT NULL,
    "validThrough" TIMESTAMP NOT NULL,
    "description" TEXT NOT NULL,
    "url" VARCHAR(500) UNIQUE NOT NULL,
    "remote" BOOLEAN DEFAULT false,
    "companyId" UUID NOT NULL REFERENCES "internship_company"("id"),
    "deleted" BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS "SkillsOnInterns" (
    "internshipId" UUID NOT NULL REFERENCES "internship"("id") ON DELETE CASCADE,
    "skillId" INTEGER NOT NULL REFERENCES "internship_skill"("id") ON DELETE CASCADE,
    PRIMARY KEY ("internshipId", "skillId")
);
