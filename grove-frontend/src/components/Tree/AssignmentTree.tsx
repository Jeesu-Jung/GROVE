import React from 'react';
import Tree from 'react-d3-tree';
import { Dataset, DatasetRow, InstructionAssignment } from '../../types';

type AssignmentTreeProps = {
  assignments: InstructionAssignment[];
  dataset: Dataset;
  onLeafClick?: (assignment: InstructionAssignment, row?: DatasetRow) => void;
};

type TreeNode = {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  children?: TreeNode[];
  __payload?: { assignment?: InstructionAssignment; row?: DatasetRow };
};

export const AssignmentTree: React.FC<AssignmentTreeProps> = ({ assignments, dataset, onLeafClick }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number }>({ width: 1200, height: 700 });

  React.useLayoutEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const taskGroups: { [task: string]: { [domain: string]: InstructionAssignment[] } } = assignments.reduce((acc, a) => {
    const task = a.taskName || 'Unknown';
    if (!acc[task]) acc[task] = {};
    if (!acc[task][a.domainName]) acc[task][a.domainName] = [];
    acc[task][a.domainName].push(a);
    return acc;
  }, {} as { [task: string]: { [domain: string]: InstructionAssignment[] } });

  const rootCount = assignments.length;

  const data: TreeNode = {
    name: 'root',
    attributes: { count: rootCount },
    children: Object.entries(taskGroups).map(([taskName, domainMap]) => ({
      name: taskName,
      attributes: { count: Object.values(domainMap).reduce((s, list) => s + list.length, 0) },
      children: Object.entries(domainMap).map(([domainName, list]) => ({
        name: domainName,
        attributes: { count: list.length },
        children: list.map((a) => ({
          name: 'raw data',
          attributes: { index: a.datasetIndex, assignmentId: a.id },
          __payload: { assignment: a, row: dataset.data[a.datasetIndex] },
        })),
      })),
    })),
  };

  const handleNodeClick = (nodeDatum: any) => {
    const payload = (nodeDatum as any).__payload as TreeNode['__payload'];
    if (payload?.assignment && payload?.row && onLeafClick) {
      onLeafClick(payload.assignment, payload.row);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: 700 }} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      <Tree
        data={data as any}
        orientation="vertical"
        translate={{ x: containerSize.width / 2, y: 60 }}
        separation={{ siblings: 1.2, nonSiblings: 1.6 }}
        zoomable
        zoom={1.4}
        scaleExtent={{ min: 0.3, max: 4 }}
        onNodeClick={handleNodeClick}
        pathFunc="diagonal"
        collapsible={false}
        styles={{
          links: {
            stroke: '#9CA3AF',
            strokeWidth: 1.2,
          },
        }}
        renderCustomNodeElement={({ nodeDatum }) => {
          const isLeaf = !(nodeDatum.children && nodeDatum.children.length);
          const payload = (nodeDatum as any).__payload as TreeNode['__payload'];
          const clickable = isLeaf && payload?.assignment && payload?.row && onLeafClick;
          const handleClick = () => {
            if (clickable && payload?.assignment && payload?.row && onLeafClick) {
              onLeafClick(payload.assignment, payload.row);
            }
          };
          return (
            <g onClick={handleClick} style={{ cursor: clickable ? 'pointer' : 'default' }}>
              {isLeaf ? (
                <circle r={18} fill="#ffffff" stroke="#9CA3AF" strokeWidth={2} />
              ) : (
                <circle r={18} fill="#6B7280" stroke="#6B7280" strokeWidth={2} />
              )}
              <text
                x={24}
                y={-2}
                fontSize={12}
                fill="#111827"
                style={{ fontWeight: 400, stroke: 'none', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}
              >
                {nodeDatum.name}
              </text>
              {nodeDatum.attributes?.count !== undefined && !isLeaf && (
                <text
                  x={24}
                  y={12}
                  fontSize={11}
                  fill="#6B7280"
                  style={{ fontWeight: 400, stroke: 'none', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}
                >
                  {String(nodeDatum.attributes.count)}
                </text>
              )}
            </g>
          );
        }}
      />
    </div>
  );
};

export default AssignmentTree;


