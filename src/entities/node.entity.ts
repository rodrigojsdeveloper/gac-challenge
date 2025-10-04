import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum NodeType {
  USER = 'USER',
  GROUP = 'GROUP',
}

@Entity('nodes')
export class NodeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['USER', 'GROUP'] })
  type: 'USER' | 'GROUP';

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  email?: string;
}
