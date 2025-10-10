import React from 'react';
import Tree from 'react-d3-tree';
import { Dataset, DatasetRow, InstructionAssignment } from '../../types';
import { Button } from '../UI/Button';
import { Download } from 'lucide-react';

type AssignmentTreeProps = {
  assignments: InstructionAssignment[];
  dataset: Dataset;
  onLeafClick?: (assignment: InstructionAssignment, row?: DatasetRow) => void;
  showExportButton?: boolean;
  filename?: string;
  exportScale?: number; // 1 = 100% 크기, 2 = 2배 해상도
  exportPadding?: number; // 이미지 외곽 여백(px)
};

type TreeNode = {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  children?: TreeNode[];
  __payload?: { assignment?: InstructionAssignment; row?: DatasetRow };
};

export const AssignmentTree: React.FC<AssignmentTreeProps> = ({ assignments, dataset, onLeafClick, showExportButton = true, filename = 'task-tree.png', exportScale = 3, exportPadding = 32 }) => {
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
        // Attach a representative assignment so the parent can open the modal by domain
        __payload: { assignment: list[0] },
      })),
    })),
  };

  const handleNodeClick = (nodeDatum: any) => {
    const payload = (nodeDatum as any).__payload as TreeNode['__payload'];
    if (payload?.assignment && onLeafClick) {
      onLeafClick(payload.assignment, payload.row);
    }
  };

  const exportAsPng = async () => {
    if (!containerRef.current) return;
    const svgs = Array.from(containerRef.current.querySelectorAll('svg')) as SVGSVGElement[];
    if (!svgs.length) return;

    // Pick the largest SVG in the container (avoids picking button icon svg)
    let svg: SVGSVGElement | null = null;
    let maxArea = 0;
    svgs.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > maxArea) {
        maxArea = area;
        svg = el;
      }
    });
    if (!svg) return;

    // Clone and inline computed styles so strokes/fills persist when serialized
    const inlineSvgStyles = (source: SVGSVGElement) => {
      const clone = source.cloneNode(true) as SVGSVGElement;
      const sourceNodes = source.querySelectorAll('*');
      const cloneNodes = clone.querySelectorAll('*');
      sourceNodes.forEach((node, idx) => {
        const target = cloneNodes[idx] as SVGElement | undefined;
        if (!target) return;
        const cs = window.getComputedStyle(node as Element);
        const tag = (target.tagName || '').toLowerCase();

        // Basic text/shape styles
        if (cs.fill) target.setAttribute('fill', cs.fill);
        if (cs.stroke) target.setAttribute('stroke', cs.stroke);
        if (cs.strokeWidth) target.setAttribute('stroke-width', cs.strokeWidth);
        if (cs.fontFamily) target.setAttribute('font-family', cs.fontFamily);
        if (cs.fontSize) target.setAttribute('font-size', cs.fontSize);

        // Ensure paths are stroked lines, not filled shapes
        if (tag === 'path') {
          target.setAttribute('fill', 'none');
          if (!target.getAttribute('stroke')) target.setAttribute('stroke', '#9CA3AF');
          if (!target.getAttribute('stroke-width')) target.setAttribute('stroke-width', '1.2');
          target.setAttribute('stroke-linecap', 'round');
          target.setAttribute('stroke-linejoin', 'round');
        }
      });

      // Width/height는 이후 bbox 기준으로 설정하므로 여기선 제거
      clone.removeAttribute('width');
      clone.removeAttribute('height');
      return clone;
    };

    const cloned = inlineSvgStyles(svg);
    // 원본 SVG의 화면 크기 및 현재 줌 스케일을 기준으로 100% 배율을 계산
    const rect = svg.getBoundingClientRect();
    const zoomGroup = svg.querySelector('.rd3t-g') as SVGGElement | null
      || svg.querySelector('g[transform*="scale"], g[transform*="translate"]') as SVGGElement | null;
    let scaleFactor = 1;
    if (zoomGroup) {
      const t = zoomGroup.getAttribute('transform') || '';
      const m = t.match(/scale\(([^)]+)\)/);
      if (m && !isNaN(parseFloat(m[1]))) scaleFactor = parseFloat(m[1]);
    }
    if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) scaleFactor = 1;

    // export 영역에 여백 적용을 위해 wrapper 추가 (원본은 변형하지 않음)
    const ns = 'http://www.w3.org/2000/svg';
    const wrapSvg = document.createElementNS(ns, 'svg');
    wrapSvg.setAttribute('xmlns', ns);
    wrapSvg.setAttribute('version', '1.1');
    const baseW = Math.max(2, Math.ceil(rect.width / scaleFactor));
    const baseH = Math.max(2, Math.ceil(rect.height / scaleFactor));
    const outW = baseW + exportPadding * 2;
    const outH = baseH + exportPadding * 2;
    wrapSvg.setAttribute('viewBox', `0 0 ${outW} ${outH}`);
    wrapSvg.setAttribute('width', String(outW));
    wrapSvg.setAttribute('height', String(outH));

    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(outW));
    bg.setAttribute('height', String(outH));
    bg.setAttribute('fill', '#ffffff');
    wrapSvg.appendChild(bg);

    // 원본 클론을 패딩만큼 이동시키고, 역스케일 적용해 100% 배율로 보이게 함
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${exportPadding}, ${exportPadding}) scale(${1 / scaleFactor})`);
    // cloned는 전체 svg 콘텐츠이므로 내부 children만 옮김
    Array.from(cloned.childNodes).forEach((n) => g.appendChild(n.cloneNode(true)));
    wrapSvg.appendChild(g);

    const serializer = new XMLSerializer();
    const sourceSvgString = serializer.serializeToString(wrapSvg);
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sourceSvgString);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(outW * exportScale);
    canvas.height = Math.ceil(outH * exportScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';

    await new Promise<void>((resolve) => {
      img.onload = () => {
        // Fill white background for better readability on dark mode
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(exportScale, exportScale);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
        resolve();
      };
      img.src = svgDataUrl;
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: 700 }} className="relative border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      {showExportButton && (
        <div className="absolute top-3 right-3 z-10">
          <Button variant="outline" size="sm" onClick={exportAsPng}>
            <Download className="w-4 h-4 mr-1" /> Export PNG
          </Button>
        </div>
      )}
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
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          },
        }}
        renderCustomNodeElement={({ nodeDatum }) => {
          const isLeaf = !(nodeDatum.children && nodeDatum.children.length);
          const payload = (nodeDatum as any).__payload as TreeNode['__payload'];
          const clickable = Boolean(payload?.assignment && onLeafClick);
          const handleClick = () => {
            if (clickable && payload?.assignment && onLeafClick) {
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
              {nodeDatum.attributes?.count !== undefined && (
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


