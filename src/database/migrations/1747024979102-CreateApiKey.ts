import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiKey1747024979102 implements MigrationInterface {
  name = 'CreateApiKey1747024979102';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "api_key" (
                "isActive" boolean NOT NULL,
                "expiresAt" TIMESTAMP,
                "description" character varying(255),
                "keyHint" character varying(20) NOT NULL,
                "keyHash" character varying NOT NULL,
                "name" character varying NOT NULL,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_4aacb7c1641a74534c8a96c4dc9" UNIQUE ("keyHash"),
                CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "api_key"
        `);
  }
}
