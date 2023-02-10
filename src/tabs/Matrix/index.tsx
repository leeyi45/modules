import React from 'react';
import { Button, Checkbox, Icon, Menu, MenuDivider } from '@blueprintjs/core';
import { Popover2, Tooltip2 } from '@blueprintjs/popover2';
import type { Matrix } from '../../bundles/matrix/types';
import type { TabInterface } from '../../typings/type_helpers';
import MultiItemDisplay from '../common/multi_item_display';

const color_on = '#cccccc';
const color_on_hover = '#DDDDDD';
const color_off = '#333333';
const color_off_hover = '#444444';

type ButtonProps = {
  onClick?: () => void
  state: boolean;
  extHover?: boolean;
};

const MatrixButton = ({ onClick, state, extHover }: ButtonProps) => {
  const [intHover, setIntHover] = React.useState(false);
  const hover = intHover || extHover;
  const backgroundColor = state ? (hover ? color_on_hover : color_on) : (hover ? color_off_hover : color_off);

  return <Button
    style={{
      backgroundColor,
      margin: '2px, 2px, 2px, 2px',
    }}
    onClick={() => {
      if (onClick) onClick();
    }}
    onMouseEnter={() => setIntHover(true)}
    onMouseLeave={() => setIntHover(false)}
  />;
};

type DisplayProps = {
  matrix: Matrix;
  index: number;
};
const MatrixDisplay = ({ matrix, index }: DisplayProps) => {
  // Use this state variable to force React to rerender
  const [updater, setUpdater] = React.useState(0);
  const rerender = () => setUpdater(updater + 1);

  const [showLabels, setLabels] = React.useState(false);
  const [hoverRow, setHoverRow] = React.useState(-1);
  const [hoverCol, setHoverCol] = React.useState(-1);

  const settingsMenu = <Popover2
    content={
      <Menu >
        <MenuDivider title="Settings" />
        <Checkbox checked={showLabels} onChange={() => setLabels(!showLabels)}>
            Show Labels
        </Checkbox>
      </Menu>
    }
    renderTarget={({ ref, ...targetProps }) => (
      <Tooltip2 content="Tab Settings">
        <Button
          elementRef={ref}
          {...targetProps}
        >
          <Icon icon="settings"/>
        </Button>
      </Tooltip2>
    )}
  />;

  const userButtons = <div
    style={{
      width: '70%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      rowGap: '5px',
    }}
  >
    {settingsMenu}
    {matrix.buttons.length > 0 && matrix.buttons.map(([text, func]) => (
      <Button
        onClick={() => {
          func();
          rerender();
        }}
      >
        {text}
      </Button>
    ))}
  </div>;

  const colLabels = showLabels && <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-around',
      columnGap: '2px',
    }}
  >
    {Array.from(Array(matrix.cols), (_, i) => <p
      onMouseEnter={() => setHoverCol(i)}
      onMouseLeave={() => setHoverCol(-1)}
      onClick={() => {
        let value = false;
        for (let j = 0; j < matrix.rows; j++) {
          if (!matrix.values[j][i]) {
            value = true;
            break;
          }
        }
        for (let j = 0; j < matrix.rows; j++) {
          matrix.values[j][i] = value;
        }
        rerender();
      }}
    >{i}</p>)}
  </div>;

  return <div style={{
    height: '70%',
    width: '70%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: '2px',
  }}>
    <h2>Matrix {index + 1}</h2>
    {userButtons}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        columnGap: '2px',
      }}
    >
      {colLabels}
      {matrix.values.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            rowGap: '2px',
          }}
        >
          {showLabels && <div
            style={{
              width: '10px',
              marginRight: '2px',
            }}
          >
            <p
              onMouseEnter={() => setHoverRow(rowIndex)}
              onMouseLeave={() => setHoverRow(-1)}
              onClick={() => {
                let value = false;
                for (let i = 0; i < matrix.cols; i++) {
                  if (!row[i]) {
                    value = true;
                    break;
                  }
                }
                for (let i = 0; i < matrix.cols; i++) row[i] = value;
                rerender();
              }}
            >{rowIndex}</p>
          </div>}
          {row.map((entry, colIndex) => (
            <MatrixButton
              extHover={hoverRow === rowIndex || hoverCol === colIndex}
              key={colIndex}
              state={entry}
              onClick={() => {
                row[colIndex] = !entry;
                if (matrix.callback) matrix.callback(rowIndex, colIndex, !entry);
                rerender();
              }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>;
};

type Props = {
  matrices: Matrix[];
};

const MatrixTab = ({ matrices }: Props) => {
  const elements = matrices.map((matrix, i) => <MatrixDisplay matrix={matrix} index={i} />);

  return <MultiItemDisplay elements={elements} />;
};

export default {
  toSpawn: ({ context }) => context.moduleContexts.matrix?.state.matrices.length > 0,
  body: ({ context: { moduleContexts: { matrix: { state: { matrices } } } } }) => (<MatrixTab matrices={matrices as Matrix[]} />),
  iconName: 'heat-grid',
  label: 'Matrix Tab',
} as TabInterface;
