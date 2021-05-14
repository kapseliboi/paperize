import lodash from 'lodash'
const { reduce } = lodash

// absolute unit ids
export const PIXELS = 'px'
export const POINTS = 'pt'
export const INCHES = 'in'
export const CENTIMETERS = 'cm'
export const MILLIMETERS = 'mm'

// relative unit ids
export const PERCENT   = '%'
export const PERCENT_W = '%w'
export const PERCENT_H = '%h'

// conversion constants
export const MILLIMETERS_PER_INCH = 25.4
export const CENTIMETERS_PER_INCH = 2.54

// wh mode constants
export const WH_MODE = {
    W : true , // WH_MODE.W
    H : false  // WH_MODE.H
}

// default constants
export const DEFAULT_PIXELS_PER_INCH = 72
export const DEFAULT_POINTS_PER_INCH = 72
export const DEFAULT_WH_MODE = WH_MODE.W
export const DEFAULT_OPTIONS = {
    pixelsPerInch : DEFAULT_PIXELS_PER_INCH,
    pointsPerInch : DEFAULT_POINTS_PER_INCH,
    containerW : 0,
    containerH : 0,
    whMode : DEFAULT_WH_MODE
}

// compute
export function computeExpression(expression, to = PIXELS, options = DEFAULT_OPTIONS) {
    const evaluation = evaluate(expression)

    return reduce(evaluation, (result, value, unit) => {
        return result + convert(value, unit, to, options)
    })
}

export function computeEvaluation(evaluation, to = PIXELS, options = DEFAULT_OPTIONS) {
    return reduce(evaluation, (result, value, unit) => {
        return result + convert(value, unit, to, options)
    }, 0)
}

// convert
export function convert(value, from, to = PIXELS, options = DEFAULT_OPTIONS) {
    // populate options
    options = { ...DEFAULT_OPTIONS, ...options }
    
    // conversion table
    const units = { }

    // absolute unit constants
    units[PIXELS]      = options.pixelsPerInch
    units[POINTS]      = options.pointsPerInch
    units[INCHES]      = 1    
    units[CENTIMETERS] = CENTIMETERS_PER_INCH
    units[MILLIMETERS] = MILLIMETERS_PER_INCH

    // relative unit constants
    units[PERCENT_W] = options.pixelsPerInch / options.containerW * 100
    units[PERCENT_H] = options.pixelsPerInch / options.containerH * 100
    units[PERCENT]   = options.whMode ? units[PERCENT_W] : units[PERCENT_H]

    // perform conversion
    value /= units[from]
    value *= units[to  ]
    return value
}

// helper functions
const _isWhitespace = (c) => (c === ' ' || c === '\t' || c === '\n' || c === '\r')
const _isLetter = (c) => (             c >= 'a' && c <= 'z')
const _isNumber = (c) => (c === '.' || c >= '0' && c <= '9')
const _isBlank  = (s) => (s.trim() === '')

// evaluate
export function evaluate(expression) {
    // sanitize expression
    const s = expression.trim().toLowerCase()

    // result table
    const result = { }

    // absolute units
    result[PIXELS]      = 0
    result[POINTS]      = 0
    result[INCHES]      = 0    
    result[CENTIMETERS] = 0
    result[MILLIMETERS] = 0    

    // relative units
    result[PERCENT]     = 0
    result[PERCENT_W]   = 0
    result[PERCENT_H]   = 0

    // evaluation variables
    let stack = []
    let word  = ''
    let sign  =  1
    let mode

    // helper functions
    function _stackPush() {
        if(!_isBlank(word)) {
            stack.push(word)
            word = ''
        }
    }

    function _stackPull() {
        if(stack.length > 0) {
            let value
            let unit      

            unit = stack.pop()       

            if( isNaN(unit )) {
                value = stack.length > 0 ? stack.pop() :      1
                unit  = unit in result   ? unit        : PIXELS
            } else {
                value =   unit
                unit  = PIXELS
            }

            if(!isNaN(value))
                result[unit] += sign * value

            sign = 1
        }     
    }

    // evaluation loop
    [...s].forEach((c) => {
        if(_isWhitespace(c)) {            
            _stackPush()            
            mode = undefined  
        } else if (c === '+') {
            _stackPush()
            _stackPull()
            sign *=  1            
            mode = undefined  
        } else if (c === '-') {
            _stackPush()
            _stackPull()
            sign *= -1
            mode = undefined
        } else {            
            if(_isLetter(c) && mode !== 'letter') {
                _stackPush()
                mode = 'letter'
            }
            if(_isNumber(c) && mode !== 'number') {                
                _stackPush()
                _stackPull()
                mode = 'number'
            }
            word += c
        }
    })

    _stackPush()
    _stackPull()

    return result
}