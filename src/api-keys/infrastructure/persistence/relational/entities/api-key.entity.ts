import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'api_key',
})
export class ApiKeyEntity extends EntityRelationalHelper {
  @Column({
    nullable: false,
    type: Boolean,
  })
  isActive: boolean;

  @Column({
    nullable: true,
    type: Date,
  })
  expiresAt?: Date | null;

  @Column({
    nullable: true,
    length: 255,
    type: String,
  })
  description?: string | null;

  @Column({
    nullable: false,
    length: 20,
    type: String,
  })
  keyHint: string;

  @Column({
    nullable: false,
    unique: true,
    type: String,
  })
  keyHash: string;

  @Column({
    nullable: false,
    type: String,
  })
  name: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
