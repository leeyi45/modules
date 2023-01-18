import type { ReplResult } from '../../typings/type_helpers';

export class Matrix implements ReplResult {
  constructor(
    public readonly values: boolean[][],
    public readonly rows: number,
    public readonly cols: number,
  ) {}
  public toReplString() {
    return '<Matrix>';
  }
}
