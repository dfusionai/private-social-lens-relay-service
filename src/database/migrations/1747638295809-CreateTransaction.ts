import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransaction1747638295809 implements MigrationInterface {
  name = 'CreateTransaction1747638295809';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."transaction_transactionstate_enum" AS ENUM('pending', 'success', 'failed')
        `);
    await queryRunner.query(`
            CREATE TABLE "transaction" (
                "transactionState" "public"."transaction_transactionstate_enum" NOT NULL DEFAULT 'pending',
                "errorMessage" character varying,
                "metadata" jsonb,
                "parameters" jsonb,
                "method" character varying NOT NULL,
                "chainId" integer NOT NULL,
                "transactionHash" character varying,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "transaction"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."transaction_transactionstate_enum"
        `);
  }
}
