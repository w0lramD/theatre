import React from 'react'
import {
  TPoint,
  TNormalizedPoint,
  VariableID,
  TColor,
} from '$theater/AnimationTimelinePanel/types'
import {Subscriber} from 'react-broadcast'
import {DurationChannel} from '$theater/AnimationTimelinePanel/RootPropProvider'
import CurveView from '$theater/AnimationTimelinePanel/CurveView/CurveView'
import {Pointer} from '$shared/DataVerse2/pointer'
import {val} from '$shared/DataVerse2/atom'
import {get} from 'lodash'
import ActiveVariableHitZone from '$theater/AnimationTimelinePanel/VariablesContainer/ActiveVariableHitZone'
import memoizeOne from 'memoize-one'
import PureComponentWithTheater from '$theater/handy/PureComponentWithTheater'
import PropsAsPointer from '$shared/utils/react/PropsAsPointer'

interface IProps {
  pathToTimeline: string[]
  variableId: VariableID
  color: TColor
  isActive: boolean
}

interface IState {}

class VariableView extends PureComponentWithTheater<IProps, IState> {
  getNormalizedPoints = memoizeOne(
    (
      points: TPoint[],
      duration: number,
      extremums: [number, number],
    ): TNormalizedPoint[] => {
      const extDiff = extremums[1] - extremums[0]
      return points.map((point: TPoint) => {
        const {time, value, interpolationDescriptor} = point
        return {
          _t: time,
          _value: value,
          time: (time / duration) * 100,
          value: ((extremums[1] - value) / extDiff) * 100,
          interpolationDescriptor: {...interpolationDescriptor},
        }
      })
    },
  )

  getExtremums = memoizeOne(
    (points: TPoint[]): [number, number] => {
      let extremums: [number, number]
      if (points.length === 0) {
        extremums = [-5, 5]
      } else {
        let min: number = Infinity,
          max: number = -Infinity
        points.forEach((point: TPoint, index: number) => {
          const {value} = point
          const nextPoint = points[index + 1]
          let candids = [value]
          if (nextPoint != null) {
            candids = candids.concat(
              value +
                point.interpolationDescriptor.handles[1] *
                  (nextPoint.value - value),
              nextPoint.value +
                point.interpolationDescriptor.handles[3] *
                  (value - nextPoint.value),
            )
          }
          const localMin = Math.min(...candids)
          const localMax = Math.max(...candids)
          min = Math.min(min, localMin)
          max = Math.max(max, localMax)
        })
        if (min === max) {
          min -= 5
          max += 5
        }
        extremums = [min, max]
      }

      return extremums
    },
  )

  render() {
    return (
      <PropsAsPointer props={this.props}>
        {({props}) => {
          const {pathToTimeline, variableId, color, isActive} = val(props)
          const points: TPoint[] = val(get(
            this.theater.atom2.pointer,
            pathToTimeline.concat('variables', variableId, 'points'),
          ) as Pointer<TPoint[]>)
          const extremums = this.getExtremums(points)

          return (
            <Subscriber channel={DurationChannel}>
              {(duration: number) => {
                const normalizedPoints = this.getNormalizedPoints(
                  points,
                  duration,
                  extremums,
                )
                return (
                  <>
                    {isActive ? (
                      <ActiveVariableHitZone
                        color={color}
                        duration={duration}
                        extremums={extremums}
                        variableId={variableId}
                        pathToTimeline={pathToTimeline}
                      />
                    ) : null}
                    <CurveView
                      points={normalizedPoints}
                      extremums={extremums}
                      color={color}
                      pathToTimeline={pathToTimeline}
                      variableId={variableId}
                    />
                  </>
                )
              }}
            </Subscriber>
          )
        }}
      </PropsAsPointer>
    )
  }
}

export default VariableView