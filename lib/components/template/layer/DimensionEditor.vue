<template lang="pug">
v-expansion-panel-content#dimension-editor
  div(slot="header") Dimensions
  v-card(v-if="size")
    v-card-text
      v-layout(column)
          v-flex
            label Coordinate Mode:
            v-btn-toggle(v-model="dimensionLayout" mandatory)
              v-btn(small flat :value="XYWH") XYWH
              v-btn(small flat :value="INSET") Inset

          v-flex#dimension-unit-selector
            p Units:
            v-btn-toggle(v-model="dimensionUnits" mandatory)
              v-btn(small flat value="percent") {{ Units.PERCENT }}
              v-btn(small flat value="percent w") {{ Units.PERCENT_W }}
              v-btn(small flat value="percent h") {{ Units.PERCENT_H }}
              v-btn(small flat value="pixels") {{ Units.PIXELS }}
              v-btn(small flat value="points") {{ Units.POINTS }}
              v-btn(small flat value="inches") {{ Units.INCHES }}
              v-btn(small flat value="centimeters") {{ Units.CENTIMETERS }}
              v-btn(small flat value="millimeters") {{ Units.CENTIMETERS }}

          v-flex(v-if="modeXYWH")
            v-layout#layout-xywh(row wrap)
              v-flex
                p Expressed as {{ unitDescription }} from the top left corner.
              v-flex(xs12 md6)
                v-text-field#dim-x(prefix="X" :suffix="unitName" :step='unitStep' type="number" v-model.number="dimensionX" @blur="roundToUnit('x')" box)
              v-flex(xs12 md6)
                v-text-field#dim-y(prefix="Y" :suffix="unitName" :step='unitStep' type="number" v-model.number="dimensionY" @blur="roundToUnit('y')" box)
              v-flex(xs12 md6)
                v-text-field#dim-w(prefix="W" :suffix="unitName" :step='unitStep' type="number" v-model.number="dimensionW" @blur="roundToUnit('w')" box)
              v-flex(xs12 md6)
                v-text-field#dim-h(prefix="H" :suffix="unitName" :step='unitStep' type="number" v-model.number="dimensionH" @blur="roundToUnit('h')" box)

          v-flex(v-else-if="modeInset")
            v-layout#layout-inset(row wrap)
              v-flex
                p Expressed as {{ unitDescription }} in from the top, right, bottom, and left sides.
              v-flex(md3)
              v-flex(xs12 md6)
                v-text-field#dim-t(prefix="Top" :suffix="unitName" :step='unitStep' type="number" v-model.number="dimensionT" box)
              v-flex(xs12 md6)
                v-text-field#dim-l(prefix="Left" :suffix="unitName" :step='unitStep' type="number" v-model.number="dimensionL" box)
              v-flex(xs12 md6)
                v-text-field#dim-r(prefix="Right" :suffix="unitName" :step='unitStep' type="number" v-model.number="dimensionR" box)
              v-flex(md3)
              v-flex(xs12 md6)
                v-text-field#dim-b(prefix="Bottom" :suffix="unitName" :step='unitStep' type="number" v-model.number="dimensionB" box)
</template>

<script>
  import { isString } from 'lodash'
  import { mapGetters, mapActions } from 'vuex'
  import { XYWH, INSET } from '../../../store/dimensions.js'
  import * as Units from '../../../util/units.js'


  /* FIXME: This is an unmitigated disaster.
    Multiple concerns are herein struggling against one another.
    - validation of inputs
    - user input UX (don't overwrite what they're typing, move their cursor, etc)
    - rounding for beauty
    - translating between units in multiple places
    - maintaining a model that's just for the view, syncing changes appropriately
    - updating different dimensions individually vs all at once
    - function visibility:
      - need to run some in data(), before methods are available
      - need to also run them via methods
    - dimension-specific variables
  */
  const VARIABLES = {
    ["percent"]: {
      step:          "1",
      decimalDigits: 2,
      name:          Units.PERCENT,
      description:   "percentage of total width or height",
    },
    ["percent w"]: {
      step:          "1",
      decimalDigits: 2,
      name:          Units.PERCENT_W,
      description:   "percentage of total width",
    },
    ["percent h"]: {
      step:          "1",
      decimalDigits: 2,
      name:          Units.PERCENT_H,
      description:   "percentage of total height",
    },
    ["pixels"]: {
      step:          "1",
      decimalDigits: 0,
      name:          Units.PIXELS,
      description:   "pixels",
    },
    ["points"]: {
      step:          "1",
      decimalDigits: 0,
      name:          Units.POINTS,
      description:   "points"
    },
    ["inches"]: {
      step:          "0.01",
      decimalDigits: 2,
      name:          Units.INCHES,
      description:   "inches",
    },
    ["centimeters"]: {
      step:          "0.1",
      decimalDigits: 1,
      name:          Units.CENTIMETERS,
      description:   "centimeters",
    },
    ["millimeters"]: {
      step:          "1",
      decimalDigits: 1,
      name:          Units.MILLIMETERS,
      description:   "millimeters",
    }
  }

  const
    fromUnitToUnit = (measure, dimension, oldUnit, newUnit, size) => {
      return Units.convert(measure, oldUnit, newUnit, {
        containerW: size.w,
        containerH: size.h,
        whMode: (dimension === 'w')
      })
    },  

    fromUnit = (measure, dimension, currentUnit, size) => {
      let from;

      switch(currentUnit) {
        case "percent"  : from = Units.PERCENT  ; break;
        case "percent w": from = Units.PERCENT_W; break;
        case "percent h": from = Units.PERCENT_H; break;
        case "pixels" : from = Units.PIXELS; break;
        case "points" : from = Units.PIXELS; break;
        case "inches" : from = Units.INCHES; break;
        case "centimeters" : from = Units.CENTIMETERS; break;
        case "millimeters" : from = Units.MILLIMETERS; break;
      }

      return Units.convert(measure, from, Units.PERCENT, {
        containerW: size.w,
        containerH: size.h,
        whMode: dimension === 'x' || dimension === 'w'
      })
    },
    toUnit = (measure, dimension, currentUnit, size) => {
      let to, value;

      switch(currentUnit) {
        // precision 2
        case "percent"  : to = Units.PERCENT  ; value = measure.toFixed(2); break;
        case "percent w": to = Units.PERCENT_W; value = measure.toFixed(2); break;
        case "percent h": to = Units.PERCENT_H; value = measure.toFixed(2); break;
        case "pixels" : to = Units.PIXELS; value = measure.toFixed(0); break
        case "points" : to = Units.POINTS; value = measure.toFixed(0); break
        case "inches" : to = Units.INCHES; value = measure.toFixed(2); break;
        case "centimeters" : to = Units.CENTIMETERS; value = measure.toFixed(1); break;
        case "millimeters" : to = Units.MILLIMETERS; value = measure.toFixed(1); break;
      }

      return Units.convert(parseFloat(value), currentUnit, to, {
        containerW: size.w,
        containerH: size.h,
        whMode: dimension === 'x' || dimension === 'w'
      })
    },

    roundToUnit = (dimensionProperty, dimensionObject, currentUnit) => {
      const fixedPosition = VARIABLES[currentUnit].decimalDigits

      dimensionObject[dimensionProperty] = parseFloat(dimensionObject[dimensionProperty].toFixed(fixedPosition))
    },

    translateToNewUnits = (dimensionsModel, dimensions, newUnits, size) => {
      const { x, y, w, h, units } = dimensions
      dimensionsModel.x = fromUnitToUnit(x, 'w', 'percent', newUnits, size)
      dimensionsModel.y = fromUnitToUnit(y, 'h', 'percent', newUnits, size)
      dimensionsModel.w = fromUnitToUnit(w, 'w', 'percent', newUnits, size)
      dimensionsModel.h = fromUnitToUnit(h, 'h', 'percent', newUnits, size)
      dimensionsModel.units = newUnits
    }

  export default {
    props: ["dimensions", "size"],

    data() {
      const dimensionsModel = { ...this.dimensions }
      translateToNewUnits(dimensionsModel, this.dimensions, dimensionsModel.units || "percent", this.size)

      return {
        XYWH, INSET, Units,
        dimensionsModel
      }
    },

    watch: {
      dimensions(newDimensions) {
        translateToNewUnits(this.dimensionsModel, newDimensions, this.dimensionsModel.units || "percent", this.size)
      }
    },

    computed: {
      dimensionLayout: {
        get() { return this.dimensions.layout || XYWH },
        set(newLayout) {
          this.dimensionsModel.layout = newLayout
          this.updateDimension({ ...this.dimensions, layout: newLayout })}
      },

      dimensionUnits: {
        get() { return this.dimensions.units || "percent" },
        set(newUnits) {
          translateToNewUnits(this.dimensionsModel, this.dimensions, newUnits, this.size)
          this.updateDimension({ ...this.dimensions, units: newUnits })
        }
      },

      modeXYWH() { return this.dimensionLayout == XYWH },
      modeInset() { return this.dimensionLayout == INSET },

      modePercent() { return this.dimensionUnits == "percent" },
      modePercentW() { return this.dimensionUnits == "percent w"},
      modePercentH() { return this.dimensionUnits == "percent h"},
      modePixels() { return this.dimensionUnits == "pixels" },
      modePoints() { return this.dimensionUnits == "points" },
      modeInches() { return this.dimensionUnits == "inches" },
      modeCentimeters() { return this.dimensionUnits == "centimeters" },
      modeMillimeters() { return this.dimensionUnits == "millimeters" },
      

      unitStep() { return VARIABLES[this.dimensionUnits].step },
      unitName() { return VARIABLES[this.dimensionUnits].name },
      unitDescription() { return VARIABLES[this.dimensionUnits].description },

      currentUnitWidth() {
        return this.fromUnitToUnit(this.size.w, 'w', 'inches')
      },

      currentUnitHeight() {
        return this.fromUnitToUnit(this.size.h, 'h', 'inches')
      },

      dimensionsId() { return this.dimensions.id },

      dimensionX: {
        get() { return this.dimensionsModel.x },

        set(newX) {
          if(isString(newX) || newX < 0) { newX = 0 }
          this.dimensionsModel.x = newX
          newX = this.fromUnit(newX, 'w')
          this.updateDimension({ ...this.dimensions, x: newX })
        }
      },

      dimensionY: {
        get() { return this.dimensionsModel.y },

        set(newY) {
          if(isString(newY) || newY < 0) { newY = 0 }
          this.dimensionsModel.y = newY
          newY = this.fromUnit(newY, 'h')
          this.updateDimension({ ...this.dimensions, y: newY })
        }
      },

      dimensionW: {
        get() { return this.dimensionsModel.w },

        set(newW) {
          if(isString(newW) || newW < 0) { newW = 0 }
          this.dimensionsModel.w = newW
          newW = this.fromUnit(newW, 'w')
          this.updateDimension({ ...this.dimensions, w: newW })
        }
      },

      dimensionH: {
        get() { return this.dimensionsModel.h },

        set(newH) {
          if(isString(newH) || newH < 0) { newH = 0 }
          this.dimensionsModel.h = newH
          newH = this.fromUnit(newH, 'h')
          this.updateDimension({ ...this.dimensions, h: newH })
        }
      },

      dimensionT: {
        get() { return this.dimensionsModel.y },

        set(newT) {
          if(isString(newT) || newT < 0) { newT = 0 }
          const modelHeight = (this.dimensionsModel.h + this.dimensionsModel.y) - newT
          this.dimensionsModel.y = newT
          this.dimensionsModel.h = modelHeight
          newT = this.fromUnit(newT, 'h')
          const newHeight = (this.dimensions.h + this.dimensions.y) - newT
          this.updateDimension({ ...this.dimensions, y: newT, h: newHeight })
        }
      },

      dimensionR: {
        get() { return (this.currentUnitWidth - this.dimensionsModel.x - this.dimensionsModel.w) },

        set(newR) {
          if(isString(newR) || newR < 0) { newR = 0 }
          const modelWidth = this.currentUnitWidth - newR - this.dimensionsModel.x
          this.dimensionsModel.w = modelWidth
          newR = this.fromUnit(newR, 'w')
          const newWidth = 100 - newR - this.dimensions.x
          this.updateDimension({ ...this.dimensions, w: newWidth })
        }
      },

      dimensionB: {
        get() { return (this.currentUnitHeight - this.dimensionsModel.y - this.dimensionsModel.h) },

        set(newB) {
          if(isString(newB) || newB < 0) { newB = 0 }
          const modelHeight = this.currentUnitHeight - newB - this.dimensionsModel.y
          this.dimensionsModel.h = modelHeight
          newB = this.fromUnit(newB, 'h')
          const newHeight = 100 - newB - this.dimensions.y
          this.updateDimension({ ...this.dimensions, h: newHeight })
        }
      },

      dimensionL: {
        get() { return this.dimensionsModel.x },

        set(newL) {
          if(isString(newL) || newL < 0) { newL = 0 }
          const modelWidth = (this.dimensionsModel.w + this.dimensionsModel.x) - newL
          this.dimensionsModel.x = newL
          this.dimensionsModel.w = modelWidth
          newL = this.fromUnit(newL, 'w')
          const newWidth = (this.dimensions.w + this.dimensions.x) - newL
          this.updateDimension({ ...this.dimensions, x: newL, w: newWidth })
        }
      },
    },

    methods: {
      ...mapActions(["updateDimension"]),

      fromUnitToUnit(measure, dimension, fromUnit, toUnit=this.dimensionUnits) {
        return fromUnitToUnit(measure, dimension, fromUnit, toUnit, this.size)
      },

      fromUnit(measure, dimension, currentUnit=this.dimensionUnits) {
        if(!this.size[dimension]) {
          throw new Error(`Unrecognized dimension: ${dimension}`)
        }

        return fromUnit(measure, dimension, currentUnit, this.size)
      },

      toUnit(measure, dimension, currentUnit=this.dimensionUnits) {
        if(!this.size[dimension]) {
          throw new Error(`Unrecognized dimension: ${dimension}`)
        }

        return toUnit(measure, dimension, currentUnit, this.size)
      },

      roundToUnit(dimensionProperty, dimensionObject=this.dimensionsModel, currentUnit=this.dimensionUnits) {
        roundToUnit(dimensionProperty, dimensionObject, currentUnit)
      }
    }
  }
</script>
