export type Pair<H, T> = [H, T];
export type EmptyList = null;
export type NonEmptyList = Pair<any, any>;
export type List = EmptyList | NonEmptyList;

export type MatrixCallback = (row: number, col: number, newValue: boolean) => void;

/**
 * Representation of a 2D matrix of boolean values
 */
export type Matrix = {
  values: boolean[][];
  rows: number;
  readonly cols: number;
  toReplString: () => string;

  buttons: [string, () => void][];
  callback?: MatrixCallback;
};
