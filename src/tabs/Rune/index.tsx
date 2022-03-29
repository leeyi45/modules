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
 * tab for displaying runes
 * @author Hou Ruomu
 */

export default {
  /**
   * This function will be called to render the module tab in the side contents
   * on Source Academy frontend.
   * @param {DebuggerContext} context
   */
  body: (context: DebuggerContext) => {
    // eslint-disable-next-line react/destructuring-assignment
    const moduleState = context.context?.moduleContexts.get(
      'rune'
    ) as RunesModuleState;

    // Based on the toSpawn conditions, it should be safe to assume
    // that neither moduleContext or moduleState are null
    const runeCanvases = moduleState.drawnRunes.map((rune) => {
      if (glAnimation.isAnimation(rune)) {
        return <AnimationCanvas animation={rune as RuneAnimation} />;
      }
      const drawnRune = rune as DrawnRune;
      if (drawnRune.isHollusion) {
        return <HollusionCanvas rune={drawnRune as HollusionRune} />;
      }
      return (
        <WebGLCanvas
          ref={(r) => {
            if (r) {
              (rune as DrawnRune).draw(r);
            }
          }}
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
