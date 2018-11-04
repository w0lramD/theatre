import {domAttrSetter} from './utils'
import KeyedSideEffectRunner from '$shared/utils/KeyedSideEffectRunner'
import autoProxyDerivedDict from '$shared/DataVerse/derivations/dicts/autoProxyDerivedDict'
import withDeps from '$shared/DataVerse/derivations/withDeps'

declare var SVGElement: Element

const blank = {
  apply: () => {},
  unapply: () => {},
}

export default function attributeApplier(dict: $FixMe, ticker: D.ITicker) {
  const domAttributesP = dict.pointer().prop('domAttributes')
  const proxy = autoProxyDerivedDict(domAttributesP, ticker)

  const elRefD = dict
    .pointer()
    .prop('state')
    .prop('elRef')

  const isElSvgD = elRefD.map(
    el => !!(typeof el !== 'undefined' && el instanceof SVGElement),
  ) as AbstractDerivation<boolean>

  const getXiguluForKey = key => {
    return withDeps(
      {elRefD: elRefD, isElSvgD: isElSvgD},
      ({elRefD, isElSvgD}) => {
        const elRef = elRefD.getValue()

        if (!elRef) return blank
        const setter = domAttrSetter(elRef, key, isElSvgD.getValue())
        return {apply: setter, unapply: () => setter(null)}
      },
    )
  }

  const runner = new KeyedSideEffectRunner(proxy, ticker, getXiguluForKey)
  return runner
}