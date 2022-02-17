import { ModuleState } from 'js-slang';

/** Encapsulates 3D point with RGB values. */
export type Point = {
  x: number;
  y: number;
  z: number;
  color: [r: number, g: number, b: number, t: number];
};
/** A function that takes in number from 0 to 1 and returns a Point. */
export type Curve = (t: number) => Point;
/**
 * A function that specifies additional rendering information when taking in
 * a CurveFunction and returns a ShapeDrawn based on its specifications.
 */
export type RenderFunction = (func: Curve) => ShapeDrawn;
/** A function that takes in CurveFunction and returns a tranformed CurveFunction. */
export type CurveTransformer = (c: Curve) => Curve;
/**
 * The return type of the curve generated by the source code in workspace.
 * WebGLCanvas in Curves tab captures the return value and calls its init function.
 */
export type ShapeDrawn = {
  /** String to be printed in the REPL. */
  toReplString: () => string;
  /**
   * A series of actions to perform as initialization of the curve on the given
   * canvas. Return a boolean indicating whether the rendering function is in 3D.
   */
  init: (canvas: HTMLCanvasElement) => boolean;
  /** Redraws the canvas with the given rotation angle. */
  redraw: (angle: number) => void;
};
export type ProgramInfo = {
  program: WebGLProgram;
  attribLocations: {
    vertexPosition: number;
    vertexColor: number;
  };
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null;
    modelViewMatrix: WebGLUniformLocation | null;
  };
};
export type BufferInfo = {
  cubeBuffer: WebGLBuffer | null;
  curveBuffer: WebGLBuffer | null;
  curveColorBuffer: WebGLBuffer | null;
};

export class CurveModuleState implements ModuleState {
  constructor() {
    this.drawnCurves = [];
  }

  public drawnCurves: ShapeDrawn[];
}
