import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1759545438397 implements MigrationInterface {
    name = 'Init1759545438397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "closure" ADD CONSTRAINT "UQ_44e90ce99bb344630cb50207afb" UNIQUE ("ancestorId", "descendantId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "closure" DROP CONSTRAINT "UQ_44e90ce99bb344630cb50207afb"`);
    }

}
