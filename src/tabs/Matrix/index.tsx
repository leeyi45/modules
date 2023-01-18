import { Button } from '@blueprintjs/core';
import React from 'react';
import { clear_matrix, randomise_matrix, set_cell } from '../../bundles/matrix/functions';
import type { Matrix } from '../../bundles/matrix/types';
import type { TabInterface } from '../../typings/type_helpers';
import MultiItemDisplay from '../common/multi_item_display';

const color_on = '#cccccc';
const color_on_hover = '#DDDDDD';
const color_off = '#333333';
const color_off_hover = '#444444';


type ButtonProps = {
  onClick: (() => void) | undefined;
  state: boolean;
};

const MatrixButton = ({ onClick, state }: ButtonProps) => {
  const [hover, setHover] = React.useState(false);

  const backgroundColor = state ? (hover ? color_on_hover : color_on) : (hover ? color_off_hover : color_off);

  return <Button
    style={{
      backgroundColor,
      margin: '2px, 2px, 2px, 2px',
    }}
    onClick={() => {
      if (onClick) onClick();
    }}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
  />;
};

type DisplayProps = {
  matrix: Matrix;
};
const MatrixDisplay = ({ matrix }: DisplayProps) => {
  // Use this state variable to force React to rerender
  const [updater, setUpdater] = React.useState(0);

  return <div style={{
    height: '70%',
    width: '70%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      rowGap: '10px',
    }}>
      <Button
        style={{
          marginRight: '10px',
        }}
        onClick={() => {
          clear_matrix(matrix);
          setUpdater(updater + 1);
        }}>
          Clear
      </Button>
      <Button onClick={() => {
        randomise_matrix(matrix, 0.5);
        setUpdater(updater + 1);
      }}>
          Randomise
      </Button>
    </div>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        columnGap: '2px',
      }}
    >
      {matrix.values.map((row, rowIndex) => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            rowGap: '2px',
          }}
        >
          {row.map((entry, colIndex) => (
            <MatrixButton
              state={entry}
              onClick={() => {
                set_cell(matrix, rowIndex, colIndex, !entry);
                setUpdater(updater + 1);
              }}
            />))}
        </div>
      ))}
    </div>
  </div>;
};

type Props = {
  matrices: Matrix[];
};

const MatrixTab = ({ matrices }: Props) => {
  const elements = matrices.map((matrix) => <MatrixDisplay matrix={matrix} />);

  return <MultiItemDisplay elements={elements} />;
};

export default {
  toSpawn: ({ context }) => context.moduleContexts.matrix?.state.matrices.length > 0,
  body: ({ context: { moduleContexts: { matrix: { state: { matrices } } } } }) => (<MatrixTab matrices={matrices as Matrix[]} />),
  iconName: 'heat-grid',
  label: 'Matrix Tab',
} as TabInterface;
