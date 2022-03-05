/* eslint-disable @typescript-eslint/naming-convention */
import { mat4, vec3 } from 'gl-matrix';
import { ProgramInfo, BufferInfo, Point } from './types';

/** @hidden */
export const drawnCurves: CurveDrawn[] = [];

// Vertex shader program
const vsS: string = `
attribute vec4 aFragColor;
attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 aColor;

void main() {
  gl_PointSize = 2.0;
  aColor = aFragColor;
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}`;

// Fragment shader program
const fsS: string = `
varying lowp vec4 aColor;
precision mediump float;
void main() {
  gl_FragColor = aColor;
}`;

// =============================================================================
// Module's Private Functions
//
// This file contains all the private functions used by the Curves module for
// rendering curves. For documentation/tutorials on WebGL API, see
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API.
// =============================================================================

/**
 * Gets shader based on given shader program code.
 *
 * @param gl - WebGL's rendering context
 * @param type - constant describing the type of shader to load
 * @param source - source code of the shader
 * @returns WebGLShader used to initialize shader program
 */
function loadShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('WebGLShader not available.');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/**
 * Initializes the shader program used by WebGL.
 *
 * @param gl - WebGL's rendering context
 * @param vsSource - vertex shader program code
 * @param fsSource - fragment shader program code
 * @returns WebGLProgram used for getting AttribLocation and UniformLocation
 */
function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  if (!shaderProgram) {
    throw new Error('Unable to initialize the shader program.');
  }
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
}

/** A function that takes in number from 0 to 1 and returns a Point. */
export type Curve = (t: number) => Point;
/**
 * A function that specifies additional rendering information when taking in
 * a CurveFunction and returns a ShapeDrawn based on its specifications.
 */
export type RenderFunction = (func: Curve) => CurveDrawn;

export class CurveDrawn {
  private readonly curvePosArray: number[];

  private readonly curveColorArray: number[];

  private readonly drawCubeArray: number[];

  private programs: ProgramInfo | null;

  private buffersInfo: BufferInfo | null;

  private renderingContext: WebGLRenderingContext | null;

  constructor(
    scaleMode: 'none' | 'stretch' | 'fit',
    private readonly drawMode: 'lines' | 'points',
    private readonly numPoints: number,
    func: Curve,
    private readonly space: '2D' | '3D',
    isFullView: boolean
  ) {
    this.curvePosArray = [];
    this.curveColorArray = [];
    this.drawCubeArray = [];

    this.programs = null;
    this.buffersInfo = null;
    this.renderingContext = null;

    // initialize the min/max to extreme values
    let min_x = Infinity;
    let max_x = -Infinity;
    let min_y = Infinity;
    let max_y = -Infinity;
    let min_z = Infinity;
    let max_z = -Infinity;


    for (let i = 0; i <= numPoints; i += 1) {
      const point = func(i / numPoints);
      const x = point.x * 2 - 1;
      const y = point.y * 2 - 1;
      const z = point.z * 2 - 1;
      if (space === '2D') {
        this.curvePosArray.push(x, y);
      } else {
        this.curvePosArray.push(x, y, z);
      }
      const color_r = point.color[0];
      const color_g = point.color[1];
      const color_b = point.color[2];
      const color_a = point.color[3];
      this.curveColorArray.push(color_r, color_g, color_b, color_a);
      min_x = Math.min(min_x, x);
      max_x = Math.max(max_x, x);
      min_y = Math.min(min_y, y);
      max_y = Math.max(max_y, y);
      min_z = Math.min(min_z, z);
      max_z = Math.max(max_z, z);
    }

    // padding for 2d draw_connected_full_view
    if (isFullView) {
      const horiz_padding = 0.05 * (max_x - min_x);
      min_x -= horiz_padding;
      max_x += horiz_padding;
      const vert_padding = 0.05 * (max_y - min_y);
      min_y -= vert_padding;
      max_y += vert_padding;
      const depth_padding = 0.05 * (max_z - min_z);
      min_z -= depth_padding;
      max_z += depth_padding;
    }

    // box generation, coordinates are added into the array using 4 push
    // operations to improve on readability during code editing.
    if (space === '3D') {
      this.drawCubeArray.push(-1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1);
      this.drawCubeArray.push(1, 1, -1, 1, -1, -1, -1, -1, -1, 1, -1, -1);
      this.drawCubeArray.push(1, -1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1);
      this.drawCubeArray.push(-1, 1, 1, -1, 1, -1, 1, 1, -1, 1, 1, 1);
    } else {
      min_z = 0;
      max_z = 0;
    }

    if (scaleMode === 'fit') {
      const center = [
        (min_x + max_x) / 2,
        (min_y + max_y) / 2,
        (min_z + max_z) / 2,
      ];
      let scale = Math.max(max_x - min_x, max_y - min_y, max_z - min_z);
      scale = scale === 0 ? 1 : scale;
      if (space === '3D') {
        for (let i = 0; i < this.curvePosArray.length; i += 1) {
          if (i % 3 === 0) {
            this.curvePosArray[i] -= center[0];
            this.curvePosArray[i] /= scale / 2;
          } else if (i % 3 === 1) {
            this.curvePosArray[i] -= center[1];
            this.curvePosArray[i] /= scale / 2;
          } else {
            this.curvePosArray[i] -= center[2];
            this.curvePosArray[i] /= scale / 2;
          }
        }
      } else {
        for (let i = 0; i < this.curvePosArray.length; i += 1) {
          if (i % 2 === 0) {
            this.curvePosArray[i] -= center[0];
            this.curvePosArray[i] /= scale / 2;
          } else {
            this.curvePosArray[i] -= center[1];
            this.curvePosArray[i] /= scale / 2;
          }
        }
      }
    } else if (scaleMode === 'stretch') {
      const center = [
        (min_x + max_x) / 2,
        (min_y + max_y) / 2,
        (min_z + max_z) / 2,
      ];
      const x_scale = max_x === min_x ? 1 : max_x - min_x;
      const y_scale = max_y === min_y ? 1 : max_y - min_y;
      const z_scale = max_z === min_z ? 1 : max_z - min_z;
      if (space === '3D') {
        for (let i = 0; i < this.curvePosArray.length; i += 1) {
          if (i % 3 === 0) {
            this.curvePosArray[i] -= center[0];
            this.curvePosArray[i] /= x_scale / 2;
          } else if (i % 3 === 1) {
            this.curvePosArray[i] -= center[1];
            this.curvePosArray[i] /= y_scale / 2;
          } else {
            this.curvePosArray[i] -= center[2];
            this.curvePosArray[i] /= z_scale / 2;
          }
        }
      } else {
        for (let i = 0; i < this.curvePosArray.length; i += 1) {
          if (i % 2 === 0) {
            this.curvePosArray[i] -= center[0];
            this.curvePosArray[i] /= x_scale / 2;
          } else {
            this.curvePosArray[i] -= center[1];
            this.curvePosArray[i] /= y_scale / 2;
          }
        }
      }
    }
  }

  public toReplString = () => '<CurveAnimation>';

  public is3D = () => this.space === '3D';

  public init = (canvas: HTMLCanvasElement) => {
    this.renderingContext = canvas.getContext('webgl');
    if (!this.renderingContext) {
      throw new Error('Rendering context cannot be null.');
    }
    const cubeBuffer = this.renderingContext.createBuffer();
    this.renderingContext.bindBuffer(
      this.renderingContext.ARRAY_BUFFER,
      cubeBuffer
    );
    this.renderingContext.bufferData(
      this.renderingContext.ARRAY_BUFFER,
      new Float32Array(this.drawCubeArray),
      this.renderingContext.STATIC_DRAW
    );

    const curveBuffer = this.renderingContext.createBuffer();
    this.renderingContext.bindBuffer(
      this.renderingContext.ARRAY_BUFFER,
      curveBuffer
    );
    this.renderingContext.bufferData(
      this.renderingContext.ARRAY_BUFFER,
      new Float32Array(this.curvePosArray),
      this.renderingContext.STATIC_DRAW
    );

    const curveColorBuffer = this.renderingContext.createBuffer();
    this.renderingContext.bindBuffer(
      this.renderingContext.ARRAY_BUFFER,
      curveColorBuffer
    );
    this.renderingContext.bufferData(
      this.renderingContext.ARRAY_BUFFER,
      new Float32Array(this.curveColorArray),
      this.renderingContext.STATIC_DRAW
    );

    const shaderProgram = initShaderProgram(this.renderingContext, vsS, fsS);
    this.programs = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: this.renderingContext.getAttribLocation(
          shaderProgram,
          'aVertexPosition'
        ),
        vertexColor: this.renderingContext.getAttribLocation(
          shaderProgram,
          'aFragColor'
        ),
      },
      uniformLocations: {
        projectionMatrix: this.renderingContext.getUniformLocation(
          shaderProgram,
          'uProjectionMatrix'
        ),
        modelViewMatrix: this.renderingContext.getUniformLocation(
          shaderProgram,
          'uModelViewMatrix'
        ),
      },
    };
    this.buffersInfo = {
      cubeBuffer,
      curveBuffer,
      curveColorBuffer,
    };
  };

  public redraw = (angle: number) => {
    if (!this.renderingContext) {
      return;
    }

    const gl = this.renderingContext;
    const itemSize = this.space === '3D' ? 3 : 2;
    gl.clearColor(1, 1, 1, 1); // Clear to white, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    // eslint-disable-next-line no-bitwise
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const transMat = mat4.create();
    const projMat = mat4.create();

    if (this.space === '3D') {
      const padding = Math.sqrt(1 / 3.1);
      mat4.scale(
        transMat,
        transMat,
        vec3.fromValues(padding, padding, padding)
      );
      mat4.translate(transMat, transMat, [0, 0, -5]);
      mat4.rotate(transMat, transMat, -(Math.PI / 2), [1, 0, 0]); // axis to rotate around X (static)
      mat4.rotate(transMat, transMat, angle, [0, 0, 1]); // axis to rotate around Z (dynamic)

      const fieldOfView = (45 * Math.PI) / 180;
      const aspect = gl.canvas.width / gl.canvas.height;
      const zNear = 0.01; // Must not be zero, depth testing loses precision proportional to log(zFar / zNear)
      const zFar = 50.0;
      mat4.perspective(projMat, fieldOfView, aspect, zNear, zFar);
    }

    gl.useProgram(this.programs!.program);
    gl.uniformMatrix4fv(
      this.programs!.uniformLocations.projectionMatrix,
      false,
      projMat
    );
    gl.uniformMatrix4fv(
      this.programs!.uniformLocations.modelViewMatrix,
      false,
      transMat
    );
    gl.enableVertexAttribArray(this.programs!.attribLocations.vertexPosition);
    gl.enableVertexAttribArray(this.programs!.attribLocations.vertexColor);

    if (this.space === '3D') {
      // Draw Cube
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffersInfo!.cubeBuffer);
      gl.vertexAttribPointer(
        this.programs!.attribLocations.vertexPosition,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );
      const colors: number[] = [];
      for (let i = 0; i < 16; i += 1) {
        colors.push(0.6, 0.6, 0.6, 1);
      }
      const colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINE_STRIP, 0, 16);
    }
    // Draw Curve
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffersInfo!.curveBuffer);
    gl.vertexAttribPointer(
      this.programs!.attribLocations.vertexPosition,
      itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffersInfo!.curveColorBuffer);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    if (this.drawMode === 'lines') {
      gl.drawArrays(gl.LINE_STRIP, 0, this.numPoints + 1);
    } else {
      gl.drawArrays(gl.POINTS, 0, this.numPoints + 1);
    }
  };
}
