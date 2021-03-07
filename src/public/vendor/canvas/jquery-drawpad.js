/* eslint-disable @typescript-eslint/no-this-alias */
/*
	cnbilgin
	https://github.com/cnbilgin/jquery-drawpad
	v 0.1
*/

(function ($) {
  const pluginSuffix = 'drawpad';
  const $reset = $(`.${pluginSuffix}-reset`);

  function throttle(callback, limit) {
    var waiting = false; // Initially, we're not waiting
    return function () {
      // We return a throttled function
      if (!waiting) {
        // If we're not waiting
        callback.apply(this, arguments); // Execute users function
        waiting = true; // Prevent future invocations
        setTimeout(function () {
          // After a period of time
          waiting = false; // And allow future invocations
        }, limit);
      }
    };
  }

  $.drawpad = function (element, options) {
    let defaults = {
      defaultColor: '#000000',
      colors: [
        '#000000', //black
        '#2ecc71', //green
        '#3498db', //blue
        '#e74c3c', //red
        '#f1c40f', //yellow
        '#9b59b6', //purple
        '#e67e22', //orange
      ],
      eraserSize: 10,
    };

    let plugin = this;
    let $element = $(element);

    plugin.socket = {};
    plugin.settings = {};

    const coordinate = { x: 0, y: 0 };
    let drawing = false;
    let drawingType = 'pen';
    const lineStyle = {
      width: 5,
      color: 'black',
      type: 'round',
    };

    /* private methods */
    const createCanvas = () => {
      plugin.$canvas = $('<canvas></canvas>');
      plugin.canvas = plugin.$canvas.get(0);
      plugin.context = plugin.canvas.getContext('2d');

      return plugin.$canvas;
    };
    const resizeCanvas = () => {
      plugin.canvas.width = $element.width();
      plugin.canvas.height = $element.height();
    };
    const createToolbox = () => {
      const $toolbox = $(`<div class="${pluginSuffix}-toolbox"></div>`);
      const createColorbox = (color) => {
        const activeClass = `${pluginSuffix}-colorbox-active`;
        let $colorbox = $(
          `<div class="${pluginSuffix}-colorbox" style="background-color:${color};"></div>`,
        );
        if (color === plugin.settings.defaultColor) $colorbox.addClass(activeClass);

        $colorbox.click(() => {
          $element.removeClass(`${pluginSuffix}-erase-mode`);
          lineStyle.color = color;
          drawingType = 'pen';
          $colorbox.addClass(activeClass).siblings().removeClass(activeClass);
        });

        return $colorbox;
      };
      const createEraser = () => {
        const activeClass = `${pluginSuffix}-colorbox-active`;
        const $eraser = $(`<div class="${pluginSuffix}-colorbox ${pluginSuffix}-eraser"></div>`);

        $eraser.click(function () {
          drawingType = 'eraser';
          $element.addClass(`${pluginSuffix}-erase-mode`);
          $eraser.addClass(activeClass).siblings().removeClass(activeClass);
        });

        return $eraser;
      };

      const $colors = $(`<div class="${pluginSuffix}-colors"></div>`);
      plugin.settings.colors.forEach((color) => {
        $colors.append(createColorbox(color));
      });

      $colors.append(createEraser());
      $toolbox.append($colors);

      return $toolbox;
    };

    const resetDrawPad = (event) => {
      event.preventDefault();
      const eventData = { drawEvent: 'reset' };
      plugin.socket.emit('drawing', { event: eventData, groupId: plugin.settings.groupId });
    };

    const updateCoordinate = (event) => {
      coordinate.x = event.offsetX;
      coordinate.y = event.offsetY;
    };

    const handleStartDraw = (event) => {
      const eventData = {
        offsetX: event.offsetX,
        offsetY: event.offsetY,
        drawing: true,
        drawEvent: 'start',
        drawingType,
        lineStyle,
      };
      plugin.socket.emit('drawing', { event: eventData, groupId: plugin.settings.groupId });
    };
    const handleStopDraw = () => {
      if (!drawing) return true;
      const eventData = { drawing: false, drawEvent: 'stop' };
      plugin.socket.emit('drawing', { event: eventData, groupId: plugin.settings.groupId });
    };
    const handleDraw = (event) => {
      if (!drawing) return;
      const ctx = plugin.context;

      ctx.beginPath();
      switch (drawingType) {
        case 'pen':
          ctx.globalCompositeOperation = 'source-over';
          ctx.lineWidth = lineStyle.width;
          ctx.strokeStyle = lineStyle.color;
          break;
        case 'eraser':
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = plugin.settings.eraserSize;
          break;
      }
      ctx.lineCap = lineStyle.type;
      ctx.moveTo(coordinate.x, coordinate.y);
      updateCoordinate(event);
      ctx.lineTo(coordinate.x, coordinate.y);
      ctx.stroke();
    };
    const preHandleDraw = (event) => {
      if (!drawing) return;
      if (plugin.socket && plugin.socket.id) {
        var eventData = {
          offsetX: event.offsetX,
          offsetY: event.offsetY,
          drawingType,
          drawing,
          lineStyle,
        };
        plugin.socket.emit('drawing', { event: eventData, groupId: plugin.settings.groupId });
      } else {
        handleDraw(event);
      }
    };
    const initialize = () => {
      $element.addClass(pluginSuffix);
      $element.append(createCanvas());
      $element.append(createToolbox());
      resizeCanvas();

      $reset.on('click', throttle(resetDrawPad, 100));

      plugin.$canvas.on('mousedown', throttle(handleStartDraw, 50));
      plugin.$canvas.on('mouseup mouseleave', throttle(handleStopDraw, 50));
      plugin.$canvas.on('mousemove', throttle(preHandleDraw, 100));

      plugin.$canvas.on('touchstart', throttle(handleStartDraw, 50));
      plugin.$canvas.on('touchend touchcancel', throttle(handleStopDraw, 50));
      plugin.$canvas.on('touchmove', throttle(preHandleDraw, 100));
    };

    /* public methods */
    plugin.init = function () {
      plugin.settings = $.extend({}, defaults, options);
      initialize();
      return plugin;
    };

    plugin.clear = function () {
      plugin.context.clearRect(0, 0, plugin.context.canvas.width, plugin.context.canvas.height);
    };

    plugin.resize = function () {
      resizeCanvas();
    };

    plugin.socketInstance = (socket) => {
      this.socket = socket;
      socket.on('drawing', (data) => {
        if (data.event.drawEvent === 'reset') {
          plugin.clear();
          return true;
        }
        if (data.event.drawEvent === 'stop') {
          $element.removeClass(`${pluginSuffix}-drawing`);
        }
        if (data.event.drawEvent === 'start') {
          $element.addClass(`${pluginSuffix}-drawing`);
          updateCoordinate({ offsetX: data.event.offsetX, offsetY: data.event.offsetY });
        }
        drawing = data.event.drawing;
        if (data.event.offsetX && data.event.offsetY) {
          handleDraw({ offsetX: data.event.offsetX, offsetY: data.event.offsetY });
        }
        if (data.event.drawingType) {
          drawingType = data.event.drawingType;
        }
        if (data.event.lineStyle && data.event.lineStyle.color) {
          lineStyle.color = data.event.lineStyle.color;
        }
      });
    };

    plugin.init();
  };

  $.fn.drawpad = function (options) {
    if ($(this).data(pluginSuffix) === undefined) {
      var plugin = new $.drawpad(this, options);
      $(this).data(pluginSuffix, plugin);
    }

    return $(this).data(pluginSuffix);
  };
})(jQuery);
