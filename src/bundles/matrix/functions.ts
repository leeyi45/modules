import { Matrix } from './types';

const checkDimensions = (matrix: Matrix, row: number, col: number) => {
  // console.log(matrix instanceof Matrix);
  // if (!(matrix instanceof Matrix)) throw new Error(`Expected a matrix, got: ${typeof matrix}`);

  if (row < 0 || row >= matrix.rows) {
    throw new Error(`Row index of ${row} out of bounds for matrix of size (${matrix.rows}, ${matrix.cols}`);
  }

  if (col < 0 || col >= matrix.cols) {
    throw new Error(`Column index of ${row} out of bounds for matrix of size (${matrix.rows}, ${matrix.cols}`);
  }
};

/**
 * Creates a 2D matrix with the given number of rows and columns
 * @param rows Number of rows between 1 and 255
 * @param cols Number of columns between 1 and 255
 * @returns Matrix
 */
export const create_matrix = (rows: number, cols: number): Matrix => {
  if (rows < 1 || cols < 1) throw new Error('Cannot create a matrix with fewer than 1 row or column!');
  if (rows > 255 || cols > 255) throw new Error('Cannot create a matrix with greater than 255 rows or columns!');

  if (!Number.isInteger(rows)) throw new Error(`Expected an integer value for rows, got: ${rows}`);
  if (!Number.isInteger(cols)) throw new Error(`Expected an integer value for columns, got: ${cols}`);

  const values = new Array(rows);
  for (let i = 0; i < rows; i++) {
    values[i] = new Array(cols);

    for (let j = 0; j < cols; j++) values[i][j] = false;
  }
  return new Matrix(
    values,
    rows,
    cols,
  );
};

export const get_cell = (matrix: Matrix, row: number, col: number): boolean => {
  checkDimensions(matrix, row, col);
  return matrix.values[row][col];
};

/**
 * Get the values in the matrix as a 2D boolean array
 * @param matrix Matrix to retrieve
 * @returns 2D boolean array representing the values in the matrix
 */
export const get_all_cells = (matrix: Matrix): boolean[][] => matrix.values;

export const set_cell = (matrix: Matrix, row: number, col: number, value: boolean): void => {
  checkDimensions(matrix, row, col);
  matrix.values[row][col] = value;
};

/**
 * Set all the values in the matrix to false
 * @param matrix Matrix to clear
 */
export const clear_matrix = (matrix: Matrix) => {
  for (let i = 0; i < matrix.rows; i++) {
    for (let j = 0; j < matrix.cols; j++) matrix.values[i][j] = false;
  }
};

/**
 * Randomly fill a matrix with true and false values using the given probability
 * @param matrix Matrix to fill
 * @param probability Probability between 0 and 1 to use
 */
export const randomise_matrix = (matrix: Matrix, probability: number) => {
  clear_matrix(matrix);

  // draw the randomised matrix
  for (let i = 0; i < matrix.rows; i++) {
    for (let j = 0; j < matrix.cols; j++) {
      matrix.values[i][j] = Math.random() > probability;
    }
  }
};
