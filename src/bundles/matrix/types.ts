export type Pair<H, T> = [H, T];
export type EmptyList = null;
export type NonEmptyList = Pair<any, any>;
export type List = EmptyList | NonEmptyList;

/**
 * A function that is passed the row and column numbers of the cell that changed
 * and its new value.
 */
export type MatrixCallback = (row: number, col: number, newValue: boolean) => void;

/**
 * Representation of a 2D matrix of boolean values
 */
export type Matrix = {
  values: boolean[][];
  readonly rows: number;
  readonly cols: number;
  toReplString: () => string;

  buttons: [string, () => void][];
  callback?: MatrixCallback;
};
