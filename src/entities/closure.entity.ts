import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { NodeEntity } from './node.entity';

@Entity('closure')
export class ClosureEntity {
  @PrimaryColumn('uuid', { name: 'ancestor_id' })
  ancestorId: string;

  @PrimaryColumn('uuid', { name: 'descendant_id' })
  descendantId: string;

  @Column('int')
  depth: number;

  @ManyToOne(() => NodeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ancestor_id' })
  ancestor: NodeEntity;

  @ManyToOne(() => NodeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'descendant_id' })
  descendant: NodeEntity;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
