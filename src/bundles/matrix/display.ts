import { context } from 'js-slang/moduleHelpers';
import type { Matrix } from './types';

const matrices: Matrix[] = [];
context.moduleContexts.matrix.state = {
  matrices,
};

/**
 * Display the given matrix in the tab
 * @param matrix Matrix to display
 * @returns Original matrix
 */
export const display_matrix = (matrix: Matrix): Matrix => {
  if (!matrices.includes(matrix)) matrices.push(matrix);
  return matrix;
};
