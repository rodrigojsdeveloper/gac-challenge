import { NodeEntity, NodeType } from 'src/entities/node.entity';

export type UserNodeDto = Omit<NodeEntity, 'type'> & {
  type: NodeType.USER;
};
