// @ts-nocheck
// import './style.css'
import Konva from 'konva'

const setupCounter = () => {
  // var width = window.innerWidth;
  // var height = window.innerHeight;

  // DOUBLE_TAP_SENSITIVITY_MAX is the sensitivity of a double tap vs a drag.
  // const DOUBLE_TAP_SENSITIVITY_MAX = 1
  Konva.hitOnDragEnabled = true;

  // first we need Konva core things: stage and layer
  var stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight,
    
  })

  var layer = new Konva.Layer()
  stage.add(layer)

  // var stageRect =  new Konva.Rect({
  //   x:0,
  //   y:0,
  //   width: 8.5 * 96,
  //   height: 11 * 96,
  //   fill: 'red',
  // })
  // layer.add(stageRect);

  // var isPaint = false;
  // var mode = 'brush';
  // var lastLine;
  // var lineAdded = false
  // var doubleTapSensitivityCounter = 0;
  // var lastCenter = null;
  // var lastDist = 0;

  var rect = new Konva.Rect({
    fill: 'grey',
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  })

  layer.add(rect)
  //   stage.on('mousedown touchstart', function (e) {
  //     e.evt.preventDefault();

  //     isPaint = true;
  //     var pos = stage.getRelativePointerPosition();
  //     lastLine = new Konva.Line({
  //       stroke: '#df4b26',
  //       strokeWidth: 2,
  //       globalCompositeOperation:
  //         mode === 'brush' ? 'source-over' : 'destination-out',
  //       // round cap for smoother lines
  //       lineCap: 'round',
  //       lineJoin: 'round',
  //       // add point twice, so we have some drawings even on a simple click
  //       points: [pos.x, pos.y, pos.x, pos.y],
  //     });
  //     // we explicitly do not immediately add the line to the layer on purpose to account for double-tap sensitivity
  //   });

  //   stage.on('mouseup touchend', function () {
  //     isPaint = false;
  //     lastLine = null
  //     lastDist = 0;
  //     doubleTapSensitivityCounter = 0;
  //     lastCenter = null;
  //     lineAdded = false
  //   });

  function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  function getCenter(p1, p2) {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    }
  }
  var lastCenter = null
  var lastDist = 0
  var dragStopped = false
  var isPaint = false;
  var mode = 'brush';
  var lastLine;

  var touching1 = false
  var touching2 = false

  var isdragging = false

  stage.on('mousedown', () => {
    isdragging = true

    var pos = layer.getRelativePointerPosition();
    lastLine = new Konva.Line({
      stroke: '#df4b26',
      strokeWidth: 4 / stage.scaleX(),
      globalCompositeOperation:
        mode === 'brush' ? 'source-over' : 'destination-out',
      // round cap for smoother lines
      lineCap: 'round',
      lineJoin: 'round',
      // add point twice, so we have some drawings even on a simple click
      points: [pos.x, pos.y, pos.x, pos.y],
    });
    layer.add(lastLine);
  })


  stage.on('mousemove', () => {
    if (!isdragging) {
      return
    }
    var pos = layer.getRelativePointerPosition();
        var newPoints = lastLine.points().concat([pos.x, pos.y]);
        lastLine.points(newPoints);
  })

  stage.on('mouseup', () => {
    isdragging = false
  })

  stage.on('touchmove', function (e) {
    e.evt.preventDefault()
    var touch1 = e.evt.touches[0]
    var touch2 = e.evt.touches[1]

    // we need to restore dragging, if it was cancelled by multi-touch
    if (touch1 && !touch2 && !stage.isDragging() && dragStopped) {
      touching1 = true
      stage.startDrag()
      dragStopped = false
    }


    if (touch1 && !touch2 && !isPaint) {
      touching1 = true

      if (touching2) {
        return
      }

      console.log('added')
      isPaint = true;
        var pos = layer.getRelativePointerPosition();
        lastLine = new Konva.Line({
          stroke: '#df4b26',
          strokeWidth: 4,
          globalCompositeOperation:
            mode === 'brush' ? 'source-over' : 'destination-out',
          // round cap for smoother lines
          lineCap: 'round',
          lineJoin: 'round',
          // add point twice, so we have some drawings even on a simple click
          points: [pos.x, pos.y, pos.x, pos.y],
        });
        layer.add(lastLine);
    }

    if (isPaint && !touch2) {
      if (touching2) {
        return
      }
      var pos = layer.getRelativePointerPosition();
        var newPoints = lastLine.points().concat([pos.x, pos.y]);
        lastLine.points(newPoints);
    }

    if (touch2 && isPaint) {
      touching2 = true
      lastLine.destroy()
    }

    if (touch1 && touch2) {
      touching2 = true
      touching1 = true
      isPaint = false
      // if the stage was under Konva's drag&drop
      // we need to stop it, and implement our own pan logic with two pointers
      if (stage.isDragging()) {
        dragStopped = true
        stage.stopDrag()
      }
      // lastLine.remove()


      var p1 = {
        x: touch1.clientX,
        y: touch1.clientY,
      }
      var p2 = {
        x: touch2.clientX,
        y: touch2.clientY,
      }

      if (!lastCenter) {
        lastCenter = getCenter(p1, p2)
        return
      }
      var newCenter = getCenter(p1, p2)

      var dist = getDistance(p1, p2)

      if (!lastDist) {
        lastDist = dist
      }

      // local coordinates of center point
      var pointTo = {
        x: (newCenter.x - stage.x()) / stage.scaleX(),
        y: (newCenter.y - stage.y()) / stage.scaleY(),
      }

      var scale = stage.scaleX() * (dist / lastDist)

      stage.scaleX(scale)
      stage.scaleY(scale)

      // calculate new position of the stage
      var dx = newCenter.x - lastCenter.x
      var dy = newCenter.y - lastCenter.y

      var newPos = {
        x: newCenter.x - pointTo.x * scale + dx,
        y: newCenter.y - pointTo.y * scale + dy,
      }

      stage.position(newPos)

      lastDist = dist
      lastCenter = newCenter
    }
  })

  stage.on('touchend', function (e) {
    lastDist = 0
    lastCenter = null
    isPaint = false
 
    var touch1 = e.evt.touches[0]
    var touch2 = e.evt.touches[1]

    if (!touch1 && !touch2) {
      touching1 = false
      touching2 = false
    }
  })




  // stage.on('mousedown touchstart', function (e) {
  //   e.evt.preventDefault()
    
  //   var touch1 = e.evt.touches[0]
  //   var touch2 = e.evt.touches[1]

  //   console.log('start')

  //   // we need to restore dragging, if it was cancelled by multi-touch
  //   if (touch1 && !touch2 && !isPaint) {
  //     // console.log('added')
  //     isPaint = true;
  //     var pos = layer.getRelativePointerPosition();
  //     lastLine = new Konva.Line({
  //       stroke: '#df4b26',
  //       strokeWidth: 5,
  //       globalCompositeOperation:
  //         mode === 'brush' ? 'source-over' : 'destination-out',
  //       // round cap for smoother lines
  //       lineCap: 'round',
  //       lineJoin: 'round',
  //       // add point twice, so we have some drawings even on a simple click
  //       points: [pos.x, pos.y, pos.x, pos.y],
  //     });
  //     layer.add(lastLine);
  //   }
  // });

  stage.on('mouseup touchend', function () {
    isPaint = false;
  });

  
}

setupCounter()