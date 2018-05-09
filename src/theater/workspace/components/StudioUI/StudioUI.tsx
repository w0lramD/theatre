import {reduceStateAction} from '$shared/utils/redux/commonActions'
import StudioComponent from '$theater/handy/StudioComponent'
import React from 'react'
import connect from '$theater/handy/connect'
import {ITheaterStoreState} from '$theater/types'
import * as _ from 'lodash'
import {set, get} from 'lodash/fp'
import {
  PanelPlacementSettings,
  PanelPersistentState,
} from '$theater/workspace/types'
import PanelController from '../PanelController/PanelController'
import StatusBar from '../StatusBar/StatusBar'
import * as css from './StudioUI.css'
import {undoAction, redoAction} from '$shared/utils/redux/withHistory/actions'
import resolveCss from '$shared/utils/resolveCss'
import ActiveModeDetector, {
  ActiveMode,
} from '$theater/common/components/ActiveModeDetector/ActiveModeDetector'

const classes = resolveCss(css)

interface IOwnProps {
  visiblePanels: Array<string>
  panelsBoundaries: $FixMe
}

interface IProps extends IOwnProps {}

type State = {
  isCreatingNewPanel: boolean
  activeMode: ActiveMode
  calculatedBoundaries: $FixMe
  gridOfBoundaries: $FixMe
  uiVisible: boolean
}

export const EXACT_VALUE = 'exactValue'
export const SAME_AS_BOUNDARY = 'sameAsBoundary'
export const DIST_FROM_BOUNDARY = 'distanceFromBoundary'

const getOppositeSide = (side: string): string => {
  switch (side) {
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    case 'top':
      return 'bottom'
    case 'bottom':
      return 'top'
    default:
      throw Error('this should not happen!')
  }
}

export class StudioUI extends StudioComponent<IProps, State> {
  _isMouseDown: boolean
  boundaryPathToValueRefMap: object
  static getDefaultPanelPlacement(type): PanelPlacementSettings {
    // ??
    switch (type) {
      case 'animationTimeline':
        return {
          pos: {x: 20, y: 25},
          dim: {x: 60, y: 50},
        }
      default:
        return {
          pos: {x: 35, y: 25},
          dim: {x: 30, y: 50},
        }
    }
  }

  static getDefaultPanelPersistentState(): PanelPersistentState {
    return {
      isInSettings: true,
    }
  }

  static getDefaultPanelConfig(): Object {
    return {}
  }

  constructor(props: IProps, context: $IntentionalAny) {
    super(props, context)

    this.state = {
      isCreatingNewPanel: false,
      activeMode: null,
      uiVisible: true,
      ...this._getUpdatedBoundaries(props.panelsBoundaries),
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this._handleResize)
    document.addEventListener('keydown', this._handleKeyDown)
    document.addEventListener('keypress', this._handleKeyPress)
  }

  _handleKeyPress = (e: KeyboardEvent) => {
    if (e.keyCode === 96) {
      this.setState({uiVisible: !this.state.uiVisible})
    }
  }

  componentWillReceiveProps(nextProps: IProps) {
    this.setState(() => ({
      ...this._getUpdatedBoundaries(nextProps.panelsBoundaries),
    }))
  }

  _handleResize = () => {
    this.setState(() => ({
      ...this._getUpdatedBoundaries(this.props.panelsBoundaries),
    }))
  }

  _handleKeyDown = (e: KeyboardEvent) => {
    if (e.keyCode === 90) {
      if (e.metaKey) {
        if (e.shiftKey) {
          this.dispatch(redoAction())
        } else {
          this.dispatch(undoAction())
        }
      }
    }
  }

  _getUpdatedBoundaries(boundariesWithoutWindow: $FixMe) {
    const boundaries: $FixMe = {
      window: {
        left: {type: EXACT_VALUE, value: 0},
        top: {type: EXACT_VALUE, value: 0},
        right: {type: EXACT_VALUE, value: window.innerWidth},
        bottom: {type: EXACT_VALUE, value: window.innerHeight - 26},
      },
      ...boundariesWithoutWindow,
    }
    return {
      calculatedBoundaries: this._getCalculatedBoundaries(boundaries),
      gridOfBoundaries: this._getGridOfBoundaries(boundaries),
    }
  }

  _getCalculatedBoundaries(boundaries: $FixMe) {
    return _.mapValues(boundaries, boundary =>
      _.mapValues(boundary, side => {
        if (side.type === EXACT_VALUE) {
          return side.value
        } else {
          let distance = side.distance | 0
          let ref = _.get(boundaries, side.path)
          while (ref.type !== EXACT_VALUE) {
            if (ref.type === DIST_FROM_BOUNDARY) distance += ref.distance
            ref = _.get(boundaries, ref.path)
          }
          return ref.value + distance
        }
      }),
    )
  }

  _getGridOfBoundaries(boundaries: $FixMe) {
    let x: number[] = []
    let y: number[] = []
    let refMapX: $FixMe = {}
    let refMapY: $FixMe = {}
    this.boundaryPathToValueRefMap = {}
    for (const boundaryId in boundaries) {
      const boundary = boundaries[boundaryId]
      for (const side in boundary) {
        if (side === 'left' || side === 'right') {
          if (boundary[side].type === EXACT_VALUE) {
            x = x.concat(boundary[side].value)
            refMapX = {
              ...refMapX,
              [boundary[side].value]: [boundaryId, side],
            }
            this.boundaryPathToValueRefMap = set(
              [boundaryId, side],
              boundary[side].value,
              this.boundaryPathToValueRefMap,
            )
          }
          if (boundary[side].type === DIST_FROM_BOUNDARY) {
            let distance = boundary[side].distance | 0
            let ref = _.get(boundaries, boundary[side].path)
            while (ref.type !== EXACT_VALUE) {
              if (ref.type === DIST_FROM_BOUNDARY) distance += ref.distance
              ref = _.get(boundaries, ref.path)
            }
            x = x.concat(ref.value + distance)
            refMapX = {
              ...refMapX,
              [ref.value + distance]: [boundaryId, side],
            }
            this.boundaryPathToValueRefMap = set(
              [boundaryId, side],
              ref.value + distance,
              this.boundaryPathToValueRefMap,
            )
          }
        }
        if (side === 'top' || side === 'bottom') {
          if (boundary[side].type === EXACT_VALUE) {
            y = y.concat(boundary[side].value)
            refMapY = {
              ...refMapY,
              [boundary[side].value]: [boundaryId, side],
            }
            this.boundaryPathToValueRefMap = set(
              [boundaryId, side],
              boundary[side].value,
              this.boundaryPathToValueRefMap,
            )
          }
          if (boundary[side].type === DIST_FROM_BOUNDARY) {
            let distance = boundary[side].distance | 0
            let ref = _.get(boundaries, boundary[side].path)
            while (ref.type !== EXACT_VALUE) {
              if (ref.type === DIST_FROM_BOUNDARY) distance += ref.distance
              ref = _.get(boundaries, ref.path)
            }
            y = y.concat(ref.value + distance)
            refMapY = {
              ...refMapY,
              [ref.value + distance]: [boundaryId, side],
            }
            this.boundaryPathToValueRefMap = set(
              [boundaryId, side],
              ref.value + distance,
              this.boundaryPathToValueRefMap,
            )
          }
        }
      }
    }
    return {x, y, refMapX, refMapY}
  }

  updatePanelBoundaries = (panelId: string, newBoundaries: $FixMe) => {
    const newCalculatedBoundaries = _.mapValues(newBoundaries, side => {
      if (side.type === EXACT_VALUE) {
        return side.value
      } else {
        return _.get(this.state.calculatedBoundaries, side.path)
      }
    })
    const currentCalculatedBoundaries = this.state.calculatedBoundaries[panelId]
    let shouldUpdate = false
    Object.keys(newCalculatedBoundaries).forEach(key => {
      if (newCalculatedBoundaries[key] !== currentCalculatedBoundaries[key])
        shouldUpdate = true
    })
    if (!shouldUpdate) return

    this.dispatch(
      reduceStateAction(
        ['historicWorkspace', 'panels', 'byId'],
        (panels: $FixMe) => {
          const newBoundariesKeys: string[] = Object.keys(newBoundaries)
          const stagedChanges = _.compact(
            _.flatMap(newBoundaries, (sideValue: $FixMe, sideKey: string) => {
              const oppositeSideKey = getOppositeSide(sideKey)
              if (!newBoundariesKeys.includes(oppositeSideKey)) {
                const oppositeSideValue =
                  panels[panelId].boundaries[oppositeSideKey]
                if (
                  oppositeSideValue.type === DIST_FROM_BOUNDARY &&
                  oppositeSideValue.path[0] === panelId &&
                  oppositeSideValue.path[1] === sideKey
                ) {
                  const newBoundaryValue =
                    sideValue.type === SAME_AS_BOUNDARY
                      ? get(sideValue.path, this.boundaryPathToValueRefMap)
                      : sideValue.value
                  return {
                    path: [panelId, 'boundaries', oppositeSideKey],
                    newValue: {
                      ...oppositeSideValue,
                      distance:
                        this.state.calculatedBoundaries[panelId][
                          oppositeSideKey
                        ] - newBoundaryValue,
                    },
                  }
                }
                if (
                  oppositeSideValue.type === SAME_AS_BOUNDARY &&
                  oppositeSideValue.path[0] === 'window' &&
                  sideValue.type === SAME_AS_BOUNDARY &&
                  sideValue.path[0] !== 'window'
                ) {
                  return [
                    {
                      path: [panelId, 'boundaries', sideKey],
                      newValue: {
                        type: DIST_FROM_BOUNDARY,
                        path: [panelId, oppositeSideKey],
                        distance:
                          get(sideValue.path, this.boundaryPathToValueRefMap) -
                          get(
                            ['window', oppositeSideKey],
                            this.boundaryPathToValueRefMap,
                          ),
                      },
                    },
                    {
                      path: [sideValue.path[0]].concat(
                        'boundaries',
                        sideValue.path[1],
                      ),
                      newValue: {
                        type: SAME_AS_BOUNDARY,
                        path: [panelId, sideKey],
                      },
                    },
                  ]
                }
              }
              if (
                sideValue.type === SAME_AS_BOUNDARY &&
                sideValue.path[0] === 'window'
              ) {
                const oppositeSideValue = newBoundaries[oppositeSideKey]
                if (
                  oppositeSideValue &&
                  oppositeSideValue.type === SAME_AS_BOUNDARY &&
                  oppositeSideValue.path[0] !== 'window'
                ) {
                  return [
                    {
                      path: [panelId, 'boundaries', oppositeSideKey],
                      newValue: {
                        type: DIST_FROM_BOUNDARY,
                        path: [panelId, sideKey],
                        distance:
                          get(
                            oppositeSideValue.path,
                            this.boundaryPathToValueRefMap,
                          ) -
                          get(
                            ['window', sideKey],
                            this.boundaryPathToValueRefMap,
                          ),
                      },
                    },
                    {
                      path: [oppositeSideValue.path[0]].concat(
                        'boundaries',
                        oppositeSideValue.path[1],
                      ),
                      newValue: {
                        type: SAME_AS_BOUNDARY,
                        path: [panelId, oppositeSideKey],
                      },
                    },
                  ]
                }
              }
            }),
          )

          const panelsWithoutRefsToUpdatedPanel = _.mapValues(
            panels,
            (panel: $FixMe) => {
              if (panel.id === panelId) {
                return {
                  ...panel,
                  boundaries: {...panel.boundaries, ...newBoundaries},
                }
              } else {
                return {
                  ...panel,
                  boundaries: _.mapValues(
                    panel.boundaries,
                    (sideValue: $FixMe) => {
                      if (
                        sideValue.path &&
                        sideValue.path[0] === panelId &&
                        newBoundariesKeys.includes(sideValue.path[1])
                      ) {
                        return {
                          type: EXACT_VALUE,
                          value: this.state.calculatedBoundaries[panelId][
                            sideValue.path[1]
                          ],
                        }
                      } else {
                        return sideValue
                      }
                    },
                  ),
                }
              }
            },
          )

          let panelsWithPrioritizedBoundaries = panelsWithoutRefsToUpdatedPanel
          stagedChanges.forEach((change: $FixMe) => {
            panelsWithPrioritizedBoundaries = set(
              change.path,
              change.newValue,
              panelsWithPrioritizedBoundaries,
            )
          })

          return _.mapValues(
            panelsWithPrioritizedBoundaries,
            (panel: $FixMe) => {
              return {
                ...panel,
                boundaries: _.mapValues(
                  panel.boundaries,
                  (sideValue: $FixMe, sideKey: string, boundaries: $FixMe) => {
                    const oppositeSideKey = getOppositeSide(sideKey)
                    const oppositeSideValue = boundaries[oppositeSideKey]
                    if (
                      sideValue.type === EXACT_VALUE &&
                      oppositeSideValue.type !== EXACT_VALUE &&
                      !(
                        oppositeSideValue.type === DIST_FROM_BOUNDARY &&
                        oppositeSideValue.path[0] === panel.id &&
                        oppositeSideValue.path[1] === sideKey
                      )
                    ) {
                      let oppositeSideBoundaryValue = this.state
                        .calculatedBoundaries[panel.id][oppositeSideKey]
                      if (
                        panel.id === panelId &&
                        newBoundariesKeys.includes(oppositeSideKey)
                      ) {
                        oppositeSideBoundaryValue = get(
                          newBoundaries[oppositeSideKey].path,
                          this.boundaryPathToValueRefMap,
                        )
                      }
                      return {
                        type: DIST_FROM_BOUNDARY,
                        path: [panel.id, oppositeSideKey],
                        distance: sideValue.value - oppositeSideBoundaryValue,
                      }
                    }
                    if (
                      newBoundariesKeys.includes(oppositeSideKey) &&
                      !newBoundariesKeys.includes(sideKey) &&
                      oppositeSideValue.type === EXACT_VALUE &&
                      sideValue.type === DIST_FROM_BOUNDARY &&
                      sideValue.path[0] === panel.id &&
                      sideValue.path[1] === oppositeSideKey
                    ) {
                      return {
                        ...sideValue,
                        distance:
                          this.state.calculatedBoundaries[panel.id][sideKey] -
                          oppositeSideValue.value,
                      }
                    }
                    return sideValue
                  },
                ),
              }
            },
          )
        },
      ),
    )
  }

  showPanelCreator = () => {
    this.setState(() => ({isCreatingNewPanel: true}))
  }

  cancelCreatingNewPanel = () => {
    this.setState(() => ({isCreatingNewPanel: false}))
  }

  render() {
    const {visiblePanels} = this.props
    return (
      // <div {...classes('container', this.state.uiVisible && 'uiVisible')}>
      <ActiveModeDetector modes={['option', 'cmd', 'shift', 'd', 'c', 'h']}>
        {(activeMode: ActiveMode) => (
          <>
            {visiblePanels.map(panelId => (
              <PanelController
                key={panelId}
                panelId={panelId}
                activeMode={activeMode}
                boundaries={this.state.calculatedBoundaries[panelId]}
                gridOfBoundaries={this.state.gridOfBoundaries}
                updatePanelBoundaries={this.updatePanelBoundaries}
              />
            ))}
            <StatusBar activeMode={activeMode} />
          </>
        )}
      </ActiveModeDetector>
      // </div>
    )
  }
}

export default connect((state: ITheaterStoreState) => {
  const panelsBoundaries = _.mapValues(
    _.get(state, ['historicWorkspace', 'panels', 'byId']),
    panel => panel.boundaries,
  )
  const visiblePanels = _.get(state, [
    'historicWorkspace',
    'panels',
    'listOfVisibles',
  ])
  return {
    panelsBoundaries,
    visiblePanels,
  }
})(StudioUI)