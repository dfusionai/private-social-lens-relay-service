import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTask1747023593873 implements MigrationInterface {
  name = 'CreateTask1747023593873';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."task_taskstate_enum" AS ENUM(
                'CheckPending',
                'ExecPending',
                'WaitingForConfirmation',
                'ExecSuccess',
                'ExecReverted',
                'Cancelled'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "task" (
                "lastCheckedMessage" character varying,
                "lastCheckedAt" TIMESTAMP,
                "taskState" "public"."task_taskstate_enum" NOT NULL DEFAULT 'CheckPending',
                "blockNumber" integer,
                "executedAt" TIMESTAMP,
                "transactionHash" character varying,
                "chainId" integer NOT NULL,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "task"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."task_taskstate_enum"
        `);
  }
}
