import { NodeEntity, NodeType } from 'src/entities/node.entity';

export type GroupNodeDto = Omit<NodeEntity, 'type'> & {
  type: NodeType.GROUP;
  parentId: string | null;
};
