import React from 'react'
import connectorCss from '$tl/ui/panels/AllInOnePanel/Right/views/dopesheet/connector.css'
import pointCss from '$tl/ui/panels/AllInOnePanel/Right/views/point/point.css'
import {TColor} from '$tl/ui/panels/AllInOnePanel/Right/types'
import LineConnectorRect from '$tl/ui/panels/AllInOnePanel/Right/views/dopesheet/LineConnectorRect'
import LineConnector from '$tl/ui/panels/AllInOnePanel/Right/views/dopesheet/LineConnector'
import Point from '$tl/ui/panels/AllInOnePanel/Right/views/point/Point'
import {TPropGetter} from '$tl/ui/panels/AllInOnePanel/Right/items/ItemPropProvider'
import DraggableArea from '$shared/components/DraggableArea/DraggableArea'
import {
  ActiveModeContext,
  ActiveMode,
  MODES,
} from '$shared/components/ActiveModeProvider/ActiveModeProvider'
import {
  TMovePointToNewCoords,
  TFnNeedsPointIndex,
  TMoveDopesheetConnector,
  TShowPointValuesEditor,
  TShowConnectorContextMenu,
  TShowPointContextMenu,
  TAddPointToSelection,
  TRemovePointFromSelection,
  TMovePointToNewCoordsTemp,
  TMoveDopesheetConnectorTemp,
} from '$tl/ui/panels/AllInOnePanel/Right/views/types'
import {TTransformedSelectedArea} from '$tl/ui/panels/AllInOnePanel/Right/timeline/selection/types'
import {SelectedAreaContext} from '$tl/ui/panels/AllInOnePanel/Right/timeline/selection/SelectionProvider'
import TempPoint from '$tl/ui/panels/AllInOnePanel/Right/views/dopesheet/TempPoint'
import TempConnector from '$tl/ui/panels/AllInOnePanel/Right/views/dopesheet/TempConnector'
import PropsAsPointer from '$shared/utils/react/PropsAsPointer'
import {shouldToggleIsInSelection} from '$tl/ui/panels/AllInOnePanel/Right/views/utils'

interface IProps {
  propGetter: TPropGetter
  color: TColor
  prevPointTime?: number
  prevPointConnected?: boolean
  nextPointTime?: number
  nextPointConnected?: boolean
  nextNextPointTime?: number
  pointTime: number
  pointConnected: boolean
  originalTime: number
  originalValue: number
  pointIndex: number
  removePoint: TFnNeedsPointIndex
  addConnector: TFnNeedsPointIndex
  movePointToNewCoords: TMovePointToNewCoords
  movePointToNewCoordsTemp: TMovePointToNewCoordsTemp
  removeConnector: TFnNeedsPointIndex
  moveConnector: TMoveDopesheetConnector
  moveConnectorTemp: TMoveDopesheetConnectorTemp
  showPointValuesEditor: TShowPointValuesEditor
  showPointContextMenu: TShowPointContextMenu
  showConnectorContextMenu: TShowConnectorContextMenu
  addPointToSelection: TAddPointToSelection
  removePointFromSelection: TRemovePointFromSelection
}

interface IState {
  isMovingConnector: boolean
  isMovingPoint: boolean
  connectorMove: number
  pointMove: number
}

class DopesheetPoint extends React.PureComponent<IProps, IState> {
  pointClickArea: React.RefObject<SVGRectElement> = React.createRef()
  connectorClickArea: React.RefObject<SVGRectElement> = React.createRef()
  activeMode: ActiveMode
  isInSelection: boolean = false
  svgWidth: number = 0

  state = {
    isMovingConnector: false,
    connectorMove: 0,
    isMovingPoint: false,
    pointMove: 0,
  }

  render() {
    return (
      <>
        <PropsAsPointer>{this._renderConsumers}</PropsAsPointer>
        <g>
          {this.state.isMovingPoint && this._renderTempPoint()}
          {this._renderPoint()}
          {this.state.isMovingConnector && this._renderTempConnector()}
        </g>
      </>
    )
  }

  _renderConsumers = () => {
    return (
      <>
        <ActiveModeContext.Consumer>
          {this._setActiveMode}
        </ActiveModeContext.Consumer>
        <SelectedAreaContext.Consumer>
          {this._highlightAsSelected}
        </SelectedAreaContext.Consumer>
      </>
    )
  }

  _renderPoint() {
    const {
      pointIndex,
      pointTime,
      pointConnected,
      nextPointTime,
      nextPointConnected,
      nextNextPointTime,
      color,
    } = this.props

    const connectorFill = pointIndex === 0 ? color.darkened : 'transparent'

    return (
      <>
        <g>
          {nextPointConnected && (
            <LineConnectorRect
              x={nextPointTime!}
              y={50}
              width={nextNextPointTime! - nextPointTime!}
              color={color.darkened}
            />
          )}
          {pointConnected && (
            <DraggableArea
              onDragStart={this.handleConnectorDragStart}
              onDrag={this.handleConnectorDrag}
              onDragEnd={this.handleConnectorDragEnd}
            >
              <g>
                <LineConnector
                  x={pointTime}
                  y={50}
                  width={nextPointTime! - pointTime}
                  color={connectorFill}
                  ref={this.connectorClickArea}
                  onClick={this.handleConnectorClick}
                  onContextMenu={this.handleConnectorContextMenu}
                />
              </g>
            </DraggableArea>
          )}
        </g>
        <DraggableArea
          onDragStart={this.handlePointDragStart}
          onDrag={this.handlePointDrag}
          onDragEnd={this.handlePointDragEnd}
        >
          <g>
            <Point
              x={pointTime}
              y={50}
              onClick={this.handlePointClick}
              onContextMenu={this.handlePointContextMenu}
              ref={this.pointClickArea}
              dopesheet={true}
            />
          </g>
        </DraggableArea>
      </>
    )
  }

  _renderTempPoint() {
    return (
      <TempPoint
        color={this.props.color}
        pointTime={this.props.pointTime - this.state.pointMove}
        pointConnected={this.props.pointConnected}
        nextPointTime={this.props.nextPointTime}
        prevPointTime={this.props.prevPointTime}
        prevPointConnected={this.props.prevPointConnected}
      />
    )
  }

  _renderTempConnector() {
    const {connectorMove} = this.state
    return (
      <TempConnector
        color={this.props.color}
        pointTime={this.props.pointTime - connectorMove}
        nextPointTime={this.props.nextPointTime! - connectorMove}
        nextPointConnected={this.props.nextPointConnected!}
        nextNextPointTime={this.props.nextNextPointTime}
        prevPointTime={this.props.prevPointTime}
        prevPointConnected={this.props.prevPointConnected}
        move={connectorMove}
      />
    )
  }

  handlePointClick = (event: React.MouseEvent<SVGRectElement>) => {
    event.preventDefault()
    event.stopPropagation()
    switch (this.activeMode) {
      case MODES.c:
        this.props.addConnector(this.props.pointIndex)
        break
      case MODES.cmd:
        this.props.addConnector(this.props.pointIndex)
        break
      case MODES.d:
        this.props.removePoint(this.props.pointIndex)
        break
      default: {
        const {
          left,
          top,
          width,
          height,
        } = this.pointClickArea.current!.getBoundingClientRect()
        const params = {
          left: left + width / 2,
          top: top + height / 2,
          initialTime: this.props.originalTime,
          initialValue: this.props.originalValue,
          pointIndex: this.props.pointIndex,
        }
        this.props.showPointValuesEditor(params)
      }
    }
  }

  handleConnectorClick = (event: React.MouseEvent<SVGRectElement>) => {
    if (this.activeMode === MODES.d) {
      event.stopPropagation()
      this.props.removeConnector(this.props.pointIndex)
    }
  }

  handlePointDragStart = () => {
    this.svgWidth = this.props.propGetter('svgWidth')
  }

  handlePointDrag = (dx: number) => {
    let x = (dx / this.svgWidth) * 100

    const {prevPointTime, nextPointTime} = this.props
    const {pointMove} = this.state
    const pointTime = this.props.pointTime - pointMove

    const limitLeft = prevPointTime == null ? 0 : prevPointTime
    const limitRight = nextPointTime == null ? 100 : nextPointTime

    const newTime = pointTime + x
    if (newTime >= limitRight) x = limitRight - pointTime - 100 / this.svgWidth
    if (newTime <= limitLeft) x = limitLeft - pointTime + 100 / this.svgWidth

    const originalCoords = {
      time: this.props.originalTime,
      value: this.props.originalValue,
    }
    const change = {
      time: x - this.state.pointMove,
      value: 0,
    }
    this.props.movePointToNewCoordsTemp(
      this.props.pointIndex,
      originalCoords,
      change,
    )

    this.setState(() => ({
      isMovingPoint: true,
      pointMove: x,
    }))
  }

  handlePointDragEnd = (dragHappened: true) => {
    if (!dragHappened) return
    const coords = {
      time: this.props.originalTime,
      value: this.props.originalValue,
    }
    this.props.movePointToNewCoords(this.props.pointIndex, coords)
    this.setState(() => ({
      isMovingPoint: false,
      pointMove: 0,
    }))
  }

  handleConnectorDragStart = () => {
    this.svgWidth = this.props.propGetter('svgWidth')
  }

  handleConnectorDrag = (dx: number) => {
    let x = (dx / this.svgWidth) * 100

    const {prevPointTime, nextNextPointTime} = this.props
    const {connectorMove} = this.state
    const pointTime = this.props.pointTime - connectorMove
    const nextPointTime = this.props.nextPointTime! - connectorMove
    const limitLeft = prevPointTime == null ? 0 : prevPointTime
    const limitRight = nextNextPointTime == null ? 100 : nextNextPointTime

    if (nextPointTime! + x >= limitRight)
      x = limitRight - nextPointTime! - 100 / this.svgWidth
    if (pointTime + x <= limitLeft)
      x = limitLeft - pointTime + 100 / this.svgWidth
    this.props.moveConnectorTemp(this.props.pointIndex, x - connectorMove)
    this.setState(() => ({
      isMovingConnector: true,
      connectorMove: x,
    }))
  }

  handleConnectorDragEnd = (dragHappened: true) => {
    if (!dragHappened) return
    this.props.moveConnector(this.props.pointIndex)
    this.setState(() => ({
      isMovingConnector: false,
      connectorMove: 0,
    }))
  }

  handlePointContextMenu = (event: React.MouseEvent<SVGRectElement>) => {
    event.stopPropagation()
    event.preventDefault()
    const {clientX, clientY} = event
    this.props.showPointContextMenu({
      left: clientX,
      top: clientY,
      pointIndex: this.props.pointIndex,
    })
  }

  handleConnectorContextMenu = (event: React.MouseEvent<SVGRectElement>) => {
    event.stopPropagation()
    event.preventDefault()
    const {clientX, clientY} = event
    this.props.showConnectorContextMenu!({
      left: clientX,
      top: clientY,
      pointIndex: this.props.pointIndex,
    })
  }

  _setActiveMode = (activeMode: ActiveMode) => {
    this.activeMode = activeMode
    if (activeMode === MODES.d) {
      this.pointClickArea.current != null &&
        this.pointClickArea.current.classList.add(pointCss.highlightRedOnHover)
      this.connectorClickArea.current != null &&
        this.connectorClickArea.current.classList.add(
          connectorCss.highlightRedOnHover,
        )
      return null
    }
    if (activeMode === MODES.cmd) {
      this.connectorClickArea.current != null &&
        this.connectorClickArea.current.classList.add(connectorCss.ignoreMouse)
      return null
    }
    this.pointClickArea.current != null &&
      this.pointClickArea.current.classList.remove(pointCss.highlightRedOnHover)
    this.connectorClickArea.current != null &&
      this.connectorClickArea.current.classList.remove(
        connectorCss.highlightRedOnHover,
        connectorCss.ignoreMouse,
      )
    return null
  }

  _highlightAsSelected = (selectedArea: TTransformedSelectedArea) => {
    const itemKey = this.props.propGetter('itemKey')
    const {pointTime, pointIndex} = this.props
    const pointCoords = {time: pointTime, value: 50}
    const shouldToggle = shouldToggleIsInSelection(
      pointCoords,
      this.isInSelection,
      selectedArea[itemKey],
    )

    if (shouldToggle && this.pointClickArea.current != null) {
      if (!this.isInSelection) {
        const didAdd = this.props.addPointToSelection(pointIndex, pointCoords)
        if (didAdd) {
          this.pointClickArea.current.classList.add(
            pointCss.highlightAsSelected,
          )
          this.isInSelection = true
        }
      } else {
        const didRemove = this.props.removePointFromSelection(pointIndex)
        if (didRemove) {
          this.pointClickArea.current.classList.remove(
            pointCss.highlightAsSelected,
          )
          this.isInSelection = false
        }
      }
    }
    return null
  }
}

export default DopesheetPoint