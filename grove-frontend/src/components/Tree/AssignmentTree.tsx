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
  height?: number | string; // 컨테이너 높이 (기본 700)
  frameless?: boolean; // true일 때 테두리/라운딩 제거
};

type TreeNode = {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  children?: TreeNode[];
  __payload?: { assignment?: InstructionAssignment; row?: DatasetRow };
};

export const AssignmentTree: React.FC<AssignmentTreeProps> = ({ assignments, dataset, onLeafClick, showExportButton = true, filename = 'task-tree.png', exportScale = 3, exportPadding = 32, height = 700, frameless = false }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number }>({ width: 1200, height: 700 });

  // 텍스트 길이에 기반한 노드 박스 폭/높이 계산 util (렌더/링크에서 동일 사용)
  const computeNodeBox = React.useCallback((nodeDatum: any) => {
    const name = String(nodeDatum?.name ?? '');
    const count = nodeDatum?.attributes?.count as number | undefined;
    const basePaddingX = 16;
    const textWidth = Math.max(40, Math.round(name.length * 7.2));
    const countWidth = count !== undefined ? 12 + String(count).length * 6.5 : 0;
    const width = basePaddingX + textWidth + (countWidth ? 8 + countWidth : 0) + 10; // 10 = 여유
    const height = 34;
    return { width, height, basePaddingX };
  }, []);

  // 링크를 부모 우측 끝 -> 자식 좌측 끝으로 연결
  const horizontalEdgePath = React.useCallback((linkDatum: any) => {
    const sBox = computeNodeBox(linkDatum.source.data);
    const tBox = computeNodeBox(linkDatum.target.data);

    const startX = linkDatum.source.y + sBox.width / 2; // 부모 우측 끝
    const startY = linkDatum.source.x;
    const endX = linkDatum.target.y - tBox.width / 2; // 자식 좌측 끝
    const endY = linkDatum.target.x;

    // 부드러운 곡선을 위해 베지어 핸들을 더 길게 설정
    const dx = endX - startX;
    const handle = Math.max(90, Math.min(460, dx * 0.65));
    const c1x = startX + handle;
    const c2x = endX - handle;
    return `M ${startX},${startY} C ${c1x},${startY} ${c2x},${endY} ${endX},${endY}`;
  }, [computeNodeBox]);

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

  // 노드의 예상 폭을 계산(텍스트 길이 기반, 렌더와 동일 로직)
  const estimateBoxWidth = React.useCallback((node: TreeNode): number => {
    const name = String(node?.name ?? '');
    const count = (node?.attributes?.count as number | undefined);
    const basePaddingX = 16;
    const textWidth = Math.max(40, Math.round(name.length * 7.2));
    const countWidth = count !== undefined ? 12 + String(count).length * 6.5 : 0;
    const width = basePaddingX + textWidth + (countWidth ? 8 + countWidth : 0) + 10; // 여유 10px
    return width;
  }, []);

  // 트리 전체에서의 최대 노드 폭 측정 후 depth 간 간격 산출
  const depthFactor = React.useMemo(() => {
    let maxW = 0;
    const walk = (n?: TreeNode) => {
      if (!n) return;
      maxW = Math.max(maxW, estimateBoxWidth(n));
      n.children?.forEach(walk);
    };
    walk(data);
    // 부모 우측 끝 ↔ 자식 좌측 끝 사이에 충분한 공간 확보
    const baseGap = 140; // 노드 간 최소 여백
    return Math.max(240, Math.round(maxW + baseGap));
  }, [data, estimateBoxWidth]);

  // depth별 부모 노드의 직접 자식 수 통계와 가변적 bin 경계 계산
  const depthBins = React.useMemo(() => {
    // depth d의 부모 노드들이 가진 children.length 분포를 수집
    const perDepthCounts = new Map<number, number[]>();
    const walk = (node: TreeNode, depth: number) => {
      const childLen = node.children?.length ?? 0;
      const arr = perDepthCounts.get(depth) || [];
      arr.push(childLen);
      perDepthCounts.set(depth, arr);
      node.children?.forEach((child) => walk(child, depth + 1));
    };
    walk(data, 0);

    // 각 depth에서 값 분포에 따라 3~7단계로 동적 bin 생성 (값의 다양성에 따라 단계 수 가변)
    const computeThresholds = (values: number[]) => {
      if (values.length === 0) return [] as number[];
      const unique = Array.from(new Set(values)).sort((a, b) => a - b);
      const uniqueCount = unique.length;
      // 최소 3단계, 최대 7단계. 고유값이 적으면 단계 축소
      const desiredBins = Math.max(3, Math.min(7, uniqueCount));
      if (desiredBins <= 1) return [unique[0]];
      // 분위수 기반 경계 계산
      const sorted = [...values].sort((a, b) => a - b);
      const quantile = (p: number) => {
        const idx = (sorted.length - 1) * p;
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        const w = idx - lo;
        return (1 - w) * sorted[lo] + w * sorted[hi];
      };
      const steps = desiredBins - 1; // 경계 개수
      const thresholds: number[] = [];
      for (let i = 1; i <= steps; i++) {
        thresholds.push(Math.round(quantile(i / desiredBins)));
      }
      // 단조 증가 보장 및 중복 제거
      const dedup = Array.from(new Set(thresholds)).sort((a, b) => a - b);
      return dedup;
    };

    const map = new Map<number, number[]>();
    perDepthCounts.forEach((vals, d) => {
      map.set(d, computeThresholds(vals));
    });
    return map;
  }, [data]);

  // 도메인(leaf) 노드의 attributes.count 분포로부터 depth별 임계값 계산
  const leafCountBins = React.useMemo(() => {
    const perDepthCounts = new Map<number, number[]>();
    const walk = (node: TreeNode, depth: number) => {
      const isLeaf = !node.children || node.children.length === 0;
      if (isLeaf) {
        const c = node.attributes?.count;
        if (typeof c === 'number' && Number.isFinite(c)) {
          const arr = perDepthCounts.get(depth) || [];
          arr.push(c as number);
          perDepthCounts.set(depth, arr);
        }
      }
      node.children?.forEach((child) => walk(child, depth + 1));
    };
    walk(data, 0);

    const computeThresholds = (values: number[]) => {
      if (values.length === 0) return [] as number[];
      const unique = Array.from(new Set(values)).sort((a, b) => a - b);
      const uniqueCount = unique.length;
      const desiredBins = Math.max(3, Math.min(7, uniqueCount));
      if (desiredBins <= 1) return [unique[0]];
      const sorted = [...values].sort((a, b) => a - b);
      const quantile = (p: number) => {
        const idx = (sorted.length - 1) * p;
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        const w = idx - lo;
        return (1 - w) * sorted[lo] + w * sorted[hi];
      };
      const steps = desiredBins - 1;
      const thresholds: number[] = [];
      for (let i = 1; i <= steps; i++) {
        thresholds.push(Math.round(quantile(i / desiredBins)));
      }
      const dedup = Array.from(new Set(thresholds)).sort((a, b) => a - b);
      return dedup;
    };

    const map = new Map<number, number[]>();
    perDepthCounts.forEach((vals, d) => {
      map.set(d, computeThresholds(vals));
    });
    return map;
  }, [data]);

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

    const cloned = inlineSvgStyles(svg as SVGSVGElement);
    // 줌 스케일 파악
    const zoomGroup = (svg as SVGSVGElement).querySelector('.rd3t-g') as SVGGElement | null
      || (svg as SVGSVGElement).querySelector('g[transform*="scale"], g[transform*="translate"]') as SVGGElement | null;
    let scaleFactor = 1;
    if (zoomGroup) {
      const t = zoomGroup.getAttribute('transform') || '';
      const m = t.match(/scale\(([^)]+)\)/);
      if (m && !isNaN(parseFloat(m[1]))) scaleFactor = parseFloat(m[1]);
    }
    if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) scaleFactor = 1;

    // 콘텐츠 전체 bbox 계산 (뷰포트가 아니라 트리 전체)
    const clonedContentGroup = (cloned.querySelector('.rd3t-g') as SVGGElement | null)
      || (cloned.querySelector('g[transform*="scale"], g[transform*="translate"]') as SVGGElement | null);
    let bbox: { x: number; y: number; width: number; height: number } | null = null;
    try {
      const ns = 'http://www.w3.org/2000/svg';
      const host = document.createElement('div');
      host.style.position = 'fixed';
      host.style.left = '-100000px';
      host.style.top = '0';
      host.style.width = '0';
      host.style.height = '0';
      document.body.appendChild(host);
      const measureSvg = document.createElementNS(ns, 'svg');
      host.appendChild(measureSvg);
      const measureGroup = (clonedContentGroup ? clonedContentGroup.cloneNode(true) : cloned.cloneNode(true)) as SVGGElement | SVGSVGElement;
      measureSvg.appendChild(measureGroup);
      const b = (measureGroup as any).getBBox?.();
      if (b && isFinite(b.width) && isFinite(b.height)) bbox = { x: b.x, y: b.y, width: b.width, height: b.height };
      document.body.removeChild(host);
    } catch {}

    // export 영역에 여백 적용을 위해 wrapper 추가 (원본은 변형하지 않음)
    const ns = 'http://www.w3.org/2000/svg';
    const wrapSvg = document.createElementNS(ns, 'svg');
    wrapSvg.setAttribute('xmlns', ns);
    wrapSvg.setAttribute('version', '1.1');
    // bbox가 확보되면 전체 콘텐츠 크기 기반으로 내보냄, 아니면 뷰포트 기반 fallback
    const rect = (svg as SVGSVGElement).getBoundingClientRect();
    const baseW = Math.max(2, Math.ceil(bbox ? bbox.width : rect.width / scaleFactor));
    const baseH = Math.max(2, Math.ceil(bbox ? bbox.height : rect.height / scaleFactor));
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

    // 원본 클론의 콘텐츠만 추출하여 패딩만큼 이동시키고, 역스케일 적용해 100% 배율로 보이게 함
    const gTranslate = document.createElementNS(ns, 'g');
    const gScale = document.createElementNS(ns, 'g');
    const offsetX = exportPadding - (bbox?.x ?? 0);
    const offsetY = exportPadding - (bbox?.y ?? 0);
    gTranslate.setAttribute('transform', `translate(${offsetX}, ${offsetY})`);
    gScale.setAttribute('transform', `scale(${1 / scaleFactor})`);
    if (clonedContentGroup) {
      Array.from(clonedContentGroup.childNodes).forEach((n) => gScale.appendChild(n.cloneNode(true)));
    } else {
      Array.from(cloned.childNodes).forEach((n) => gScale.appendChild(n.cloneNode(true)));
    }
    gTranslate.appendChild(gScale);
    wrapSvg.appendChild(gTranslate);

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
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
      className={frameless
        ? "relative bg-white dark:bg-gray-900"
        : "relative border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"}
    >
      {/* 링크 스타일 오버라이드: 더 두껍고 둥근 선 */}
      <style>{`
        path.rd3t-link, .rd3t-link path {
          stroke: #475569 !important; /* slate-600 (더 어둡게) */
          stroke-width: 2.6 !important; /* 조금 더 두껍게 */
          fill: none !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
        }
        /* tier별 동적 두께 (depth별 상대 비교 기반) */
        path.rd3t-link.tier-0 { stroke-width: 1.4 !important; }
        path.rd3t-link.tier-1 { stroke-width: 2.0 !important; }
        path.rd3t-link.tier-2 { stroke-width: 2.6 !important; }
        path.rd3t-link.tier-3 { stroke-width: 3.4 !important; }
        path.rd3t-link.tier-4 { stroke-width: 4.4 !important; }
        path.rd3t-link.tier-5 { stroke-width: 5.6 !important; }
        path.rd3t-link.tier-6 { stroke-width: 7.0 !important; }
      `}</style>
      {showExportButton && (
        <div className="absolute top-3 right-3 z-10">
          <Button variant="outline" size="sm" onClick={exportAsPng}>
            <Download className="w-4 h-4 mr-1" /> Export PNG
          </Button>
        </div>
      )}
      <Tree
        data={data as any}
        orientation="horizontal"
        translate={{ x: 60, y: containerSize.height / 2 }}
        separation={{ siblings: 0.5, nonSiblings: 1.0 }}
        zoomable
        zoom={1.4}
        scaleExtent={{ min: 0.3, max: 4 }}
        onNodeClick={handleNodeClick}
        pathFunc={horizontalEdgePath as any}
        depthFactor={depthFactor}
        collapsible={false}
        // 링크마다 두께 클래스를 부여
        // 1) 타겟이 leaf(도메인)인 경우: 도메인 데이터 수(attributes.count) 기준, 해당 depth의 leaf 분포 사용
        // 2) 루트→작업: 타겟의 자식 수 기준, depth=1의 분포 사용(작업→도메인과 일치)
        // 3) 그 외: 부모의 자식 수 기준, 부모 depth의 분포 사용
        pathClassFunc={(link) => {
          const sourceDepth = (link.source.depth ?? 0) as number;
          const targetDepth = (link.target.depth ?? sourceDepth + 1) as number;
          const isTargetLeaf = !link.target.data?.children || link.target.data?.children.length === 0;

          let value = 0;
          let thresholds: number[] = [];

          if (isTargetLeaf) {
            // 도메인: attributes.count 기준
            const count = link.target.data?.attributes?.count;
            value = typeof count === 'number' ? count : 0;
            thresholds = leafCountBins.get(targetDepth) || [];
          } else if (sourceDepth === 0) {
            // 루트→작업: 타겟의 children 수 기준, depth=1 분포 사용
            value = (link.target.data?.children?.length ?? 0) as number;
            thresholds = depthBins.get(targetDepth) || [];
          } else {
            // 일반: 부모의 children 수 기준
            value = (link.source.data?.children?.length ?? 0) as number;
            thresholds = depthBins.get(sourceDepth) || [];
          }
          // thresholds: 오름차순. 구간에 따라 tier 결정 (0..N)
          let tier = 0;
          for (let i = 0; i < thresholds.length; i++) {
            if (value > thresholds[i]) tier = i + 1;
          }
          // 최대 tier를 0..6으로 클램프 (CSS에서 7단계까지 대응)
          const clamped = Math.max(0, Math.min(6, tier));
          return `rd3t-link tier-${clamped}`;
        }}
        renderCustomNodeElement={({ nodeDatum }) => {
          const isRoot = !(nodeDatum as any).parent;
          const payload = (nodeDatum as any).__payload as TreeNode['__payload'];
          const clickable = Boolean(payload?.assignment && onLeafClick);

          // 노드 박스 메트릭 계산
          const { width: boxWidth, height: boxHeight, basePaddingX } = computeNodeBox(nodeDatum);
          const radius = 16;

          const fill = isRoot ? '#E9F1FF' : '#D9F4E7';
          const stroke = isRoot ? '#C7DAFE' : '#ADE7D6';
          const textColor = '#0F172A';
          const subTextColor = '#64748B';
          const name = String(nodeDatum.name ?? '');
          const count = nodeDatum.attributes?.count as number | undefined;

          const handleClick = (e?: React.MouseEvent<SVGGElement, MouseEvent>) => {
            if (e) e.stopPropagation();
            if (clickable && payload?.assignment && onLeafClick) onLeafClick(payload.assignment, payload.row);
          };

          return (
            <g onClick={handleClick} style={{ cursor: clickable ? 'pointer' : 'default' }} role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined}
               onKeyDown={(ev) => { if (clickable && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); handleClick(); } }}>
              <defs>
                <filter id="nlm-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.25" />
                </filter>
              </defs>
              {/* 중심이 (0,0)이 되도록 배치 */}
              <rect x={-boxWidth / 2} y={-boxHeight / 2} rx={radius} ry={radius} width={boxWidth} height={boxHeight} fill={fill} stroke={stroke} strokeWidth={1} filter="url(#nlm-shadow)" style={{ pointerEvents: 'all' }} />
              {/* 라벨 텍스트 */}
              <text x={-boxWidth / 2 + basePaddingX} y={-2} fontSize={12.5} fill={textColor} style={{ fontWeight: 600, stroke: 'none', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
                {name}
              </text>
              {count !== undefined && (
                <text x={-boxWidth / 2 + basePaddingX} y={12} fontSize={11} fill={subTextColor} style={{ fontWeight: 400, stroke: 'none', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
                  {String(count)}
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


