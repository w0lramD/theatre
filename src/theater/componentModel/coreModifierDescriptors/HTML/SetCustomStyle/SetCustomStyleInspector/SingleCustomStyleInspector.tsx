import {reduceStateAction} from '$shared/utils/redux/commonActions'
import TextInput from '$theater/common/components/TextInput'
import {get} from 'lodash'
import KeyValuePair from '$theater/common/components/KeyValuePair'
import {ITheaterStoreState} from '$theater/types'
import StudioComponent from '$theater/handy/StudioComponent'
import React from 'react'
import connect from '$theater/handy/connect'

interface IOwnProps {
  pathToPairings: string[]
  id: string
}

interface Props extends IOwnProps {
  pairing: {key: string; value: string}
}

export class SingleCustomStyleInspector extends StudioComponent<Props, {}> {
  _onKeyChange = (key: string) => {
    this.dispatch(
      reduceStateAction(
        [...this.props.pathToPairings, 'byId', this.props.id, 'key'],
        () => key,
      ),
    )
  }

  _onValueChange = (value: string) => {
    this.dispatch(
      reduceStateAction(
        [...this.props.pathToPairings, 'byId', this.props.id, 'value'],
        () => value,
      ),
    )
  }

  render() {
    const {pairing} = this.props
    // @todo ux - sort these alphabetically
    return (
      <KeyValuePair
        k={
          <TextInput
            key="key"
            value={pairing.key}
            onChange={this._onKeyChange}
          />
        }
        v={
          <TextInput
            key="value"
            value={pairing.value}
            onChange={this._onValueChange}
          />
        }
      />
    )
  }
}

export default connect((s: ITheaterStoreState, op: IOwnProps) => {
  return {
    pairing: get(s, op.pathToPairings).byId[op.id],
  }
})(SingleCustomStyleInspector)