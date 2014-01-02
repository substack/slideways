var hyperglue = require('hyperglue');
var EventEmitter = require('events').EventEmitter;
var domevent = require('dom-events');
var computedStyle = require('computed-style');
var html = require('./static/html');
var css = require('./static/css');

function preventDefault (e) {
    if (e.preventDefault) return e.preventDefault();

    e.returnValue = false;
}

module.exports = Slider;
var insertedCss = false;

function Slider (opts) {
    if (!(this instanceof Slider)) return new Slider(opts);
    EventEmitter.call(this);
    var self = this;
    
    if (!opts) opts = {};
    this.max = opts.max === undefined ? 1 : opts.max;
    this.min = opts.min === undefined ? 0 : opts.min;
    this.snap = opts.snap;
    
    process.nextTick(function () {
        if (opts.init !== undefined) {
            self.set(opts.init);
        }
        else if (opts.min !== undefined) {
            self.set(opts.min);
        }
        else self.set(0);
    });
    
    if (!insertedCss && opts.insertCss !== false) {
        var style = document.createElement('style');
        style.appendChild(document.createTextNode(css));
        if (document.head.childNodes.length) {
            document.head.insertBefore(style, document.head.childNodes[0]);
        }
        else {
            document.head.appendChild(style);
        }
        insertedCss = true;
    }
    var root = this.element = hyperglue(html);
    
    var turtle = this.turtle = root.querySelector('.turtle');
    var runner = root.querySelector('.runner');
    
    var down = false;
    
    function start (ev) {
        var clientX = 0;
        
        if (typeof ev.touches !== 'undefined') {
            clientX = ev.touches[0].clientX;
        } else {
            clientX = ev.clientX;
        }

        preventDefault(ev);
        turtle.className = 'turtle pressed';
        down = {
            x: clientX - root.offsetLeft - turtle.offsetLeft
        }
    }

    domevent.on(turtle, 'mousedown', start);
    domevent.on(turtle, 'touchstart', start);

    domevent.on(root, 'mousedown', function (ev) {
        preventDefault(ev);
    });
    domevent.on(root, 'touchend', function (ev) {
        preventDefault(ev);
    });

    domevent.on(document, 'mouseup', mouseup);
    domevent.on(document, 'mousemove', onmove);
    domevent.on(document, 'onmousemove', onmove);
    domevent.on(document, 'touchend', mouseup);
    domevent.on(document, 'touchmove', onmove);
    
    function onmove (ev) {
        var clientX = 0;

        if (typeof ev.touches !== 'undefined') {
            clientX = ev.touches[0].clientX;
        } else {
            clientX = ev.clientX;
        }

        if (!down) return;
        var w = self._elementWidth();
        var x = Math.max(0, Math.min(w, clientX - root.offsetLeft - down.x));
        var value = x / w;
        if (isNaN(value)) return;
        self.set(self.interpolate(value));
    }
    
    function mouseup () {
        down = true;
        turtle.className = 'turtle';
    }
}

Slider.prototype = new EventEmitter;

Slider.prototype.appendTo = function (target) {
    if (typeof target === 'string') {
        target = document.querySelector(target);
    }
    target.appendChild(this.element);
};

Slider.prototype.interpolate = function (value) {
    var v = value * (this.max - this.min) + this.min;
    var res = this.snap
        ? Math.round(v / this.snap) * this.snap
        : v
    ;
    return Math.max(this.min, Math.min(this.max, res));
};

Slider.prototype.set = function (value) {
    value = Math.max(this.min, Math.min(this.max, value));
    var x = (value - this.min) / (this.max - this.min);
    this.turtle.style.left = x * this._elementWidth() + 'px';
    value = Math.round(value * 1e10) / 1e10;
    this.emit('value', value);
};

Slider.prototype._elementWidth = function () {
    var rootWidth = this.element.offsetWidth;
    var turtleWidth = this.turtle.offsetWidth;
    var turtleBorder = computedStyle(this.turtle, 'border-width');

    return num(rootWidth) - num(turtleWidth) - num(turtleBorder);
};

function num (s) {
    return Number((/^(\d+)/.exec(s) || [0,0])[1]);
}
