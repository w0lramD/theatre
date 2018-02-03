import {React, D, PureComponentWithStudio} from '$studio/handy'
import _ from 'lodash'
import AbstractDerivation from '$src/shared/DataVerse/derivations/AbstractDerivation'

interface Props {
  derivation: AbstractDerivation<React.ReactNode>
}

export default class DerivationAsReactElement extends PureComponentWithStudio<
  Props,
  {}
> {
  _untapFromDerivationChanges: () => void

  constructor(props: Props, context: $FixMe) {
    super(props, context)
    this._untapFromDerivationChanges = _.noop
  }

  componentWillMount() {
    this.listen(this.props)
  }

  listen(props: Props) {
    this._untapFromDerivationChanges = props.derivation
      .changes(this.studio.ticker)
      .tap(() => {
        this.forceUpdate()
      })
  }

  componentWillUnmount() {
    this._untapFromDerivationChanges()
  }

  componentWillReceiveProps(newProps: Props) {
    this._untapFromDerivationChanges()
    this.listen(newProps)
  }

  render() {
    return this.props.derivation.getValue()
  }
}