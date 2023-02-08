import type { List, Matrix, MatrixCallback } from './types';

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
 * Maximum number of rows supported
 */
export const MAX_ROWS = 256;

/**
 * Maximum number of columns supported
 */
export const MAX_COLS = 256;

/**
 * Creates a 2D matrix with the given number of rows and columns
 * @param rows Number of rows between 1 and 255
 * @param cols Number of columns between 1 and 255
 * @returns Matrix
 */
export const create_matrix = (rows: number, cols: number): Matrix => {
  if (rows < 1 || cols < 1) throw new Error('Cannot create a matrix with fewer than 1 row or column!');
  if (rows > MAX_ROWS) throw new Error(`Cannot create a matrix with greater than ${MAX_ROWS} rows!`);
  if (cols > MAX_COLS) throw new Error(`Cannot create a matrix with greater than ${MAX_COLS} columns!`);

  if (!Number.isInteger(rows)) throw new Error(`Expected an integer value for rows, got: ${rows}`);
  if (!Number.isInteger(cols)) throw new Error(`Expected an integer value for columns, got: ${cols}`);

  const values = new Array(rows);
  for (let i = 0; i < rows; i++) {
    values[i] = new Array(cols);

    for (let j = 0; j < cols; j++) values[i][j] = false;
  }
  return {
    values,
    rows,
    cols,
    toReplString: () => `<Matrix (${rows}, ${cols})>`,
    buttons: [],
  };
};

/**
 * By providing a list containing pairs of strings and functions, the matrix will render
 * each pair as a button that will execute the function its associated with when clicked
 * @param matrix Matrix to install buttons on
 * @param list List containing pairs of strings and functions
 * @returns The given matrix
 */
export const install_buttons = (matrix: Matrix, list: List) => {
  const list_to_array = (lst: List) => {
    if (lst === null) return [];

    const [head, tail] = lst;
    // Check the types of the head
    if (typeof head[0] !== 'string' || typeof head[1] !== 'function') {
      throw new Error('Expected a list containing pairs of strings and functions');
    }

    return [head, ...list_to_array(tail)];
  };

  matrix.buttons = list_to_array(list);
  return matrix;
};

/**
 * Attach a callback that will be executed every time the user clicks on a cell.\
 * The callback has the following signature:
 * `(row: number, col: number, newValue: boolean) => void`
 * @param matrix Matrix to attach to
 * @param callback Callback to use
 * @returns Original matrix
 */
export const on_click = (matrix: Matrix, callback: MatrixCallback) => {
  if (typeof callback !== 'function') throw new Error('onClick expects a function for its callback parameter!');
  matrix.callback = callback;
  return matrix;
};

/**
 * Get the value of the cell at the specified column and row indices
 * @param matrix Matrix to index
 * @param row Row index of cell
 * @param col Column index of cell
 * @returns Boolean value of cell
 */
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

/**
 * Set the value of the cell at the specified column and row indices
 * @param matrix Matrix to index
 * @param row Row index of cell
 * @param col Column index of cell
 * @param value Value to set the cell to
 */
export const set_cell = (matrix: Matrix, row: number, col: number, value: boolean): void => {
  checkDimensions(matrix, row, col);
  matrix.values[row][col] = value;
};

/**
 * Retrieve the number of cols in a matrix
 * @param matrix Matrix to check
 * @returns Number of cols in the matrix
 */
export const get_num_cols = (matrix: Matrix) => matrix.cols;

/**
 * Retrieve the number of rows in a matrix
 * @param matrix Matrix to check
 * @returns Number of rows in the matrix
 */
export const get_num_rows = (matrix: Matrix) => matrix.rows;

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

/**
 * @inheritDoc randomise_matrix
 */
export const randomize_matrix = randomise_matrix;
