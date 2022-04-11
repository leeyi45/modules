import React from 'react';
import { HollusionRune } from '../../bundles/rune/functions';
import {
  DrawnRune,
  RuneAnimation,
  RunesModuleState,
} from '../../bundles/rune/rune';
import { glAnimation } from '../../typings/anim_types';
import MultiItemDisplay from '../common/multi_item_display';
import { DebuggerContext } from '../../typings/type_helpers';
import AnimationCanvas from '../common/animation_canvas';
import HollusionCanvas from './hollusion_canvas';
import WebGLCanvas from '../common/webgl_canvas';

/**
 * Canvas to display anaglyph and regular runes
 * This separate canvas is required because analgyph runes
 * and normal runes get drawn to the same buffer
 * Instead we need to draw the runes onComponentMount
 
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RuneCanvas({ rune }: { rune: DrawnRune }) {
  const canvasRef = React.createRef<HTMLCanvasElement>();

  React.useEffect(() => {
    if (canvasRef.current) {
      rune.draw(canvasRef.current!);
    }
  }, [rune]);
  return <WebGLCanvas ref={canvasRef} />;
}
*/

export default {
  /**
   * This function will be called to determine if the component will be
   * rendered. Currently spawns when there is at least one rune to be
   * displayed
   * @param {DebuggerContext} context
   * @returns {boolean}
   */
  toSpawn: (context: DebuggerContext) => {
    const moduleContext = context.context?.moduleContexts.get('rune');
    if (moduleContext == null) {
      return false;
    }

    const moduleState = moduleContext.state as RunesModuleState;
    if (moduleState == null) {
      return false;
    }

    return moduleState.drawnRunes.length > 0;
  },

  /**
   * This function will be called to render the module tab in the side contents
   * on Source Academy frontend.
   * @param {DebuggerContext} context
   */
  body: (context: DebuggerContext) => {
    // eslint-disable-next-line react/destructuring-assignment
    const moduleContext = context.context?.moduleContexts.get('rune');
    const moduleState = moduleContext!.state as RunesModuleState;

    // Based on the toSpawn conditions, it should be safe to assume
    // that neither moduleContext or moduleState are null
    const runeCanvases = moduleState.drawnRunes.map((rune, i) => {
      const elemKey = i.toString();

      if (glAnimation.isAnimation(rune)) {
        return (
          <AnimationCanvas animation={rune as RuneAnimation} key={elemKey} />
        );
      }
      const drawnRune = rune as DrawnRune;
      if (drawnRune.isHollusion) {
        return (
          <HollusionCanvas rune={drawnRune as HollusionRune} key={elemKey} />
        );
      }
      return (
        <WebGLCanvas
          ref={(r) => {
            if (r) {
              drawnRune.draw(r);
            }
          }}
          key={elemKey}
        />
      );
    });

    return <MultiItemDisplay elements={runeCanvases} />;
  },

  /**
   * The Tab's icon tooltip in the side contents on Source Academy frontend.
   */
  label: 'Runes Tab',

  /**
   * BlueprintJS IconName element's name, used to render the icon which will be
   * displayed in the side contents panel.
   * @see https://blueprintjs.com/docs/#icons
   */
  iconName: 'group-objects',
};
