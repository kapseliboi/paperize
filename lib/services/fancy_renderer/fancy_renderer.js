import * as Units from './units.js'

import Canvas from 'canvas'
const { createCanvas } = Canvas



function render(options) {
    // populate options
    options = { ...Units.DEFAULT_OPTIONS, ...options }

    const canvas  = createCanvas(
        options.containerW,
        options.containerH
    )
    const context = canvas.getContext('2d')

    context.fillStyle = 'red'

    

    context.fillRect(0, 0, options.containerW, options.containerH)
    

    return canvas.toDataURL()
}

console.log(render({containerW : 64, containerH: 32}))






// the render pipeline looks as follows

// 1. parse layers into nodes
// 2. parse spreadsheet syntax
// 3. parse remaining   syntax

// 4. look ahead and preload resources

// 5. solve layout

// 6. hand over to renderer
// 7. return png





// we need canvas size
// we need pixels per inch
// we need points per inch