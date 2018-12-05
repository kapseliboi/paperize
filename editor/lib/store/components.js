import { find, reduce, times } from 'lodash'
import uuid from 'uuid/v4'

import { generateCrud } from './util/vuex_resource'

const ComponentModel = {
  name: 'components',

  relationships: [
    { relation: 'hasOne', model: 'template', initialize: true, dependent: true },
    { relation: 'hasOne', model: 'source' }
  ],

  create(newComponent) {
    return {
      id:            uuid(),
      title:         "",
      folderId:      null,
      sourceId:      null,
      templateId:    null,
      quantityProperty: null,
      // override with given
      ...newComponent
    }
  },

  getters: {
    getComponentFolderId: (_, __, ___, rootGetters) => component => {
      return component.folderId ||
        rootGetters.getGameFolderId(
          rootGetters.findGameByComponentId(component.id)
        )
    },

    findComponentTemplate: (_, __, ___, rootGetters) => component => {
      if(component.templateId) {
        return rootGetters.findTemplate(component.templateId)
      }
    },

    findComponentSource: (_, __, ___, rootGetters) => component => {
      if(component.sourceId) {
        return rootGetters.findSource(component.sourceId)
      }
    },

    getComponentItems: (state, getters) => component => {
      const componentSource = getters.findComponentSource(component)
      if(!componentSource) {
        return []
      } else {
        let sourceItems = getters.getSourceItems(componentSource)
        // Handle quantity expansion
        if(!component.quantityProperty) {
          return sourceItems
        } else {
          return reduce(sourceItems, (expandedItems, item) => {
            let foundProperty = find(item, {key: component.quantityProperty}),
              rawQuantity = (foundProperty || {}).value,
              quantity = parseInt(rawQuantity, 10) || 1

            times(quantity, () => expandedItems.push(item))

            return expandedItems
          }, [])
        }
      }
    },

    getItemQuantity: (state, getters) => component => {
      return getters.getComponentItems(component).length
    }
  },

  actions: {
    linkComponentSource({ commit }, { component, source }) {
      commit("updateComponent", { ...component, sourceId: source.id })
    },

    unlinkComponentSource({ commit }, component) {
      commit("updateComponent", { ...component, sourceId: null })
    }
  }
}

const ComponentsModule = generateCrud(ComponentModel)

export default ComponentsModule
