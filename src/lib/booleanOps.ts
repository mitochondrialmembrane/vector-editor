import paper from 'paper';

export const isClosedPathData = (pathData: string): boolean => {
  return /[Zz]\s*$/.test(pathData.trim());
};

const isOpenItem = (item: paper.PathItem): boolean => {
  if (item instanceof paper.Path) return !item.closed;
  if (item instanceof paper.CompoundPath) {
    const first = item.firstChild;
    if (first instanceof paper.Path) return !first.closed;
  }
  return false;
};

const splitAtMany = (path: paper.Path, offsets: number[]): paper.Path[] => {
  const sorted = [...offsets].sort((a, b) => b - a);
  const pieces: paper.Path[] = [];
  for (const offset of sorted) {
    if (offset >= path.length - 1e-6 || offset <= 1e-6) continue;
    const after = path.splitAt(offset);
    if (after) pieces.unshift(after);
  }
  pieces.unshift(path);
  return pieces;
};

const splitOpenByClosed = (
  open: paper.PathItem,
  closed: paper.PathItem,
  keep: 'inside' | 'outside',
): paper.Path[] => {
  const openChildren: paper.Path[] = open instanceof paper.CompoundPath
    ? (open.children as paper.Path[])
    : [open as paper.Path];
  const kept: paper.Path[] = [];
  for (const line of openChildren) {
    const work = line.clone({ insert: false }) as paper.Path;
    const ints = work.getIntersections(closed);
    const offsets = ints.map(i => i.offset);
    const pieces = splitAtMany(work, offsets);
    for (const piece of pieces) {
      if (piece.length < 1e-6) {
        piece.remove();
        continue;
      }
      const mid = piece.getPointAt(piece.length / 2);
      const inside = mid ? closed.contains(mid) : false;
      const wantInside = keep === 'inside';
      if (inside === wantInside) {
        kept.push(piece);
      } else {
        piece.remove();
      }
    }
  }
  return kept;
};

// Slices a single simple closed path by a single open path that crosses it exactly twice.
// Falls back to [shape] for 0/1/3+ crossings (general slicing isn't wired up yet).
const sliceSimpleClosed = (shape: paper.Path, line: paper.Path): paper.Path[] => {
  const work = shape.clone({ insert: false }) as paper.Path;
  const ints = work.getIntersections(line);
  if (ints.length !== 2) return [work];

  const sorted = ints.slice().sort((a, b) => a.offset - b.offset);
  const targetEarlyOffset = sorted[0].offset;

  const segB = work.divideAt(sorted[1]);
  if (!segB) return [work];

  const refreshed = work.getIntersections(line);
  if (refreshed.length === 0) return [work];
  refreshed.sort(
    (a, b) => Math.abs(a.offset - targetEarlyOffset) - Math.abs(b.offset - targetEarlyOffset),
  );
  const segA = work.divideAt(refreshed[0]);
  if (!segA) return [work];

  const segs = work.segments;
  const idxA = segA.index;
  const idxB = segB.index;
  const lo = Math.min(idxA, idxB);
  const hi = Math.max(idxA, idxB);

  const arc1Segs: paper.Segment[] = [];
  for (let i = lo; i <= hi; i++) arc1Segs.push(segs[i].clone());
  const arc1 = new paper.Path({ segments: arc1Segs, insert: false });
  if (arc1.firstSegment) arc1.firstSegment.handleIn = new paper.Point(0, 0);
  if (arc1.lastSegment) arc1.lastSegment.handleOut = new paper.Point(0, 0);
  arc1.closed = true;

  const arc2Segs: paper.Segment[] = [];
  for (let i = hi; i < segs.length; i++) arc2Segs.push(segs[i].clone());
  for (let i = 0; i <= lo; i++) arc2Segs.push(segs[i].clone());
  const arc2 = new paper.Path({ segments: arc2Segs, insert: false });
  if (arc2.firstSegment) arc2.firstSegment.handleIn = new paper.Point(0, 0);
  if (arc2.lastSegment) arc2.lastSegment.handleOut = new paper.Point(0, 0);
  arc2.closed = true;

  work.remove();
  return [arc1, arc2];
};

const sliceClosedByOpen = (closed: paper.PathItem, open: paper.PathItem): paper.PathItem[] => {
  // Compound closed shapes (e.g., shape with hole) need a more general algorithm — defer.
  if (!(closed instanceof paper.Path)) {
    return [closed.clone({ insert: false }) as paper.PathItem];
  }
  const openChildren: paper.Path[] = open instanceof paper.CompoundPath
    ? (open.children as paper.Path[])
    : [open as paper.Path];

  let current: paper.PathItem[] = [closed.clone({ insert: false }) as paper.PathItem];
  for (const line of openChildren) {
    const next: paper.PathItem[] = [];
    for (const piece of current) {
      if (piece instanceof paper.Path && piece.closed) {
        const sliced = sliceSimpleClosed(piece, line);
        if (sliced.length > 1) {
          piece.remove();
          next.push(...sliced);
        } else {
          next.push(piece);
        }
      } else {
        next.push(piece);
      }
    }
    current = next;
  }
  return current;
};

const subtractAny = (a: paper.PathItem, b: paper.PathItem): paper.PathItem[] => {
  const aOpen = isOpenItem(a);
  const bOpen = isOpenItem(b);
  if (!aOpen && !bOpen) {
    const r = a.subtract(b, { insert: false });
    return r && r.pathData ? [r] : [];
  }
  if (!aOpen && bOpen) return sliceClosedByOpen(a, b);
  if (aOpen && !bOpen) return splitOpenByClosed(a, b, 'outside');
  return [a.clone({ insert: false }) as paper.PathItem];
};

const intersectAny = (a: paper.PathItem, b: paper.PathItem): paper.PathItem[] => {
  const aOpen = isOpenItem(a);
  const bOpen = isOpenItem(b);
  if (!aOpen && !bOpen) {
    const r = a.intersect(b, { insert: false });
    return r && r.pathData ? [r] : [];
  }
  if (!aOpen && bOpen) return splitOpenByClosed(b, a, 'inside');
  if (aOpen && !bOpen) return splitOpenByClosed(a, b, 'inside');
  return [];
};

const uniteAny = (a: paper.PathItem, b: paper.PathItem): paper.PathItem[] => {
  if (!isOpenItem(a) && !isOpenItem(b)) {
    const r = a.unite(b, { insert: false });
    return r && r.pathData ? [r] : [];
  }
  return [a.clone({ insert: false }) as paper.PathItem];
};

export const applyBooleanFold = (
  op: 'union' | 'subtract' | 'intersect',
  primary: paper.PathItem,
  secondaries: paper.PathItem[],
): paper.PathItem[] => {
  let current: paper.PathItem[] = [primary.clone({ insert: false }) as paper.PathItem];
  for (const sec of secondaries) {
    const next: paper.PathItem[] = [];
    for (const piece of current) {
      const results = op === 'subtract'
        ? subtractAny(piece, sec)
        : op === 'intersect'
          ? intersectAny(piece, sec)
          : uniteAny(piece, sec);
      next.push(...results);
    }
    current = next;
    if (current.length === 0) break;
  }
  return current;
};

export const itemSize = (item: paper.PathItem): number => {
  const area = Math.abs(item.area ?? 0);
  if (area > 0) return area;
  return item.length ?? 0;
};
