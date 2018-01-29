const findProperty = function(key) {
  const property = _.find(item, { key })
  if(property) {
    return property.value
  } else {
    console.log(`No property found by key: ${key}`)
    return ""
  }
}

const percentOfParent = function(dimensions, parent) {
  return {
    x: (dimensions.x*.01*parent.w)+(parent.x || 0),
    y: (dimensions.y*.01*parent.h)+(parent.y || 0),
    w: dimensions.w*.01*parent.w,
    h: dimensions.h*.01*parent.h,
  }
}

// extract RGB255 from hex
const hexToRGB = function(hexColorString) {
  let r = parseInt(`${hexColorString[1]}${hexColorString[2]}`, 16),
    g = parseInt(`${hexColorString[3]}${hexColorString[4]}`, 16),
    b = parseInt(`${hexColorString[5]}${hexColorString[6]}`, 16)

  return { r, g, b }
}

export { findProperty, percentOfParent, hexToRGB }
