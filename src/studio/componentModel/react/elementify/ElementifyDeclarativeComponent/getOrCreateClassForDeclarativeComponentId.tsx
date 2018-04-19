import {label} from '../../../../structuralEditor/components/reusables/PanelSection.css'
import {ComponentId} from '$studio/componentModel/types'
import TheaterComponent from '$studio/componentModel/react/TheaterComponent/TheaterComponent'
import {DerivedClass, Classify} from '$shared/DataVerse/derivedClass/derivedClass'
import constructValue from './constructValue/constructValue'

const cache = new Map<ComponentId, DeclarativeComponentBaseClass>()

const getOrCreateClassForDeclarativeComponentId = (id: ComponentId) => {
  if (cache.has(id)) {
    return cache.get(id)
  } else {
    const cls = createClass(id)
    cache.set(id, cls)
    return cls
  }
}

export default getOrCreateClassForDeclarativeComponentId

const createClass = (id: ComponentId) => {
  const cls = class extends DeclarativeComponentBaseClass {
    static componentId = id
  }
  return cls
}

const methods: Classify<$FixMe, $FixMe> = {
  timelineDescriptors(self: $FixMe) {
    const componentDescriptorP = self
      .prop('componentDescriptor')

    return componentDescriptorP.prop('timelineDescriptors').prop('byId')
  },

  render(self: $FixMe) {
    // debugger
    const componentDescriptorP = self
      .prop('componentDescriptor')

    const whatToRenderP = componentDescriptorP.prop('whatToRender')
    return whatToRenderP.flatMap((v: $FixMe) => constructValue(v, self))
    // return constructValue(whatToRenderP, self)
  },
}

class DeclarativeComponentBaseClass extends TheaterComponent<{}> {
  static displayName = 'DeclarativeComponent'
  static componentType = 'Declarative'
  
  _getClass(baseClass) {
    return baseClass.extend(methods)
  }
}
