import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('closure')
@Unique(['ancestorId', 'descendantId'])
export class ClosureEntity {
  @PrimaryColumn()
  ancestorId: number;

  @PrimaryColumn()
  descendantId: number;

  @Column()
  depth: number;
}
