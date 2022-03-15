import React from 'react';
import { RunesModuleState } from '../../bundles/rune/types';
import { DebuggerContext } from '../../type_helpers';
import MultiItemDisplay from '../../typings/multi_item';
import RuneCanvas from './rune_canvas';

/**
 * tab for displaying runes
 * @author Hou Ruomu
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
    const runeCanvases = moduleState.drawnRunes.map((rune) => (
      <RuneCanvas rune={rune} />
    ));

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
