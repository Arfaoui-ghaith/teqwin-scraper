const { EntitySchema } = require('typeorm');

const InternshipCompany = new EntitySchema({
  name: 'InternshipCompany',
  tableName: 'internship_company',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'varchar', nullable: true, unique: true },
    image: { type: 'varchar', nullable: true },
    binary_image: { type: 'bytea', nullable: true },
    address: { type: 'varchar', nullable: true },
    country: { type: 'varchar' },
    countryFlag: { type: 'varchar' },
    createdAt: { type: 'timestamp', createDate: true },
    updatedAt: { type: 'timestamp', updateDate: true },
    deleted: { type: 'boolean', default: false },
  },
});

const InternshipSkill = new EntitySchema({
  name: 'InternshipSkill',
  tableName: 'internship_skill',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    title: { type: 'varchar', unique: true },
    createdAt: { type: 'timestamp', createDate: true },
    deleted: { type: 'boolean', default: false },
  },
});

const Internship = new EntitySchema({
  name: 'Internship',
  tableName: 'internship',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    title: { type: 'varchar' },
    datePosted: { type: 'timestamp' },
    validThrough: { type: 'timestamp' },
    description: { type: 'text' },
    url: { type: 'varchar', length: 500, unique: true },
    remote: { type: 'boolean', default: false },
    companyId: { type: 'uuid' },
    deleted: { type: 'boolean', default: false },
  },
  relations: {
    company: {
      type: 'many-to-one',
      target: 'InternshipCompany',
      joinColumn: { name: 'companyId' },
    },
    skills: {
      type: 'many-to-many',
      target: 'InternshipSkill',
      joinTable: {
        name: 'SkillsOnInterns',
        joinColumn: { name: 'internshipId' },
        inverseJoinColumn: { name: 'skillId' },
      },
    },
  },
});

module.exports = {
  InternshipCompany,
  InternshipSkill,
  Internship,
};
