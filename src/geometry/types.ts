export type Point = [number, number];
export type Ring = Point[];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface PointLike {
  x: number;
  y: number;
}
