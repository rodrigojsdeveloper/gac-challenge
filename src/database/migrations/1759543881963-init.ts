import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1759543881963 implements MigrationInterface {
  name = 'Init1759543881963';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."nodes_type_enum" AS ENUM('USER', 'GROUP')`,
    );
    await queryRunner.query(
      `CREATE TABLE "nodes" ("id" SERIAL NOT NULL, "type" "public"."nodes_type_enum" NOT NULL, "name" character varying NOT NULL, "email" character varying, CONSTRAINT "UQ_5e74781a18fe7b45124014c38f6" UNIQUE ("email"), CONSTRAINT "PK_682d6427523a0fa43d062ea03ee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "closure" ("ancestorId" integer NOT NULL, "descendantId" integer NOT NULL, "depth" integer NOT NULL, CONSTRAINT "UQ_44e90ce99bb344630cb50207afb" UNIQUE ("ancestorId", "descendantId"), CONSTRAINT "PK_44e90ce99bb344630cb50207afb" PRIMARY KEY ("ancestorId", "descendantId"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "closure"`);
    await queryRunner.query(`DROP TABLE "nodes"`);
    await queryRunner.query(`DROP TYPE "public"."nodes_type_enum"`);
  }
}
