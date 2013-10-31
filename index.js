var hyperglue = require('hyperglue');
var EventEmitter = require('events').EventEmitter;
var html = require('./static/html');
var css = require('./static/css');

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
    
    turtle.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        turtle.className = 'turtle pressed';
        down = {
            x: ev.clientX - root.offsetLeft - turtle.offsetLeft
        }
    });
    root.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
    });
    window.addEventListener('mouseup', mouseup);
    window.addEventListener('mousemove', onmove);
    
    function onmove (ev) {
        ev.preventDefault();
        if (!down) return;
        var w = self._elementWidth();
        var x = Math.max(0, Math.min(w, ev.clientX - root.offsetLeft - down.x));
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
    var style = {
        root: window.getComputedStyle(this.element),
        turtle: window.getComputedStyle(this.turtle)
    };
    return num(style.root.width) - num(style.turtle.width)
        - num(style.turtle['border-width'])
    ;
};

function num (s) {
    return Number((/^(\d+)/.exec(s) || [0,0])[1]);
}
