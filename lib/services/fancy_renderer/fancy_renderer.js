import * as Units from '../../util/units.js'

import Konva from 'konva'

/*
 * fancy pipeline
 * 1. parse tiny-moustache
 * 
 * 2. parse layers into konva nodes *with metadata
 * 3. convolve nodes
 *  3a. parse inline syntax
 *  3b. preload resources
 *  3c. solve layout
 * 
 * 4. obtain konva instance and draw nodes
 */


/*
 * pure function for drawing tree to scene
 */
export function render(node, options) {
    const stage = new Konva.Stage({
        ...Units.DEFAULT_OPTIONS,
        container: options.containerID,
        width : options.containerW,
        height: options.containerH
    })
}