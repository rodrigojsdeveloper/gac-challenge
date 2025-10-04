import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1759547060485 implements MigrationInterface {
    name = 'Init1759547060485'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."nodes_type_enum" AS ENUM('USER', 'GROUP')`);
        await queryRunner.query(`CREATE TABLE "nodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."nodes_type_enum" NOT NULL, "name" character varying NOT NULL, "email" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_5e74781a18fe7b45124014c38f6" UNIQUE ("email"), CONSTRAINT "PK_682d6427523a0fa43d062ea03ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "closure" ("ancestor_id" uuid NOT NULL, "descendant_id" uuid NOT NULL, "depth" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a04fd138f805487b420c9bf09a2" PRIMARY KEY ("ancestor_id", "descendant_id"))`);
        await queryRunner.query(`ALTER TABLE "closure" ADD CONSTRAINT "FK_fd932ed65fe54c61dbafb05103c" FOREIGN KEY ("ancestor_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "closure" ADD CONSTRAINT "FK_426cc7cc4cab52d1e15e1bbd406" FOREIGN KEY ("descendant_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "closure" DROP CONSTRAINT "FK_426cc7cc4cab52d1e15e1bbd406"`);
        await queryRunner.query(`ALTER TABLE "closure" DROP CONSTRAINT "FK_fd932ed65fe54c61dbafb05103c"`);
        await queryRunner.query(`DROP TABLE "closure"`);
        await queryRunner.query(`DROP TABLE "nodes"`);
        await queryRunner.query(`DROP TYPE "public"."nodes_type_enum"`);
    }

}
