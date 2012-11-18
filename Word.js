//
// Represents the current word
//
// This is a logical container; it has a dom node, but the node is only used
// for positioning.
//
define([
  'dojo/dom-construct',
  'dojo/dom-class',
  'dijit/_WidgetBase',
  'dojo/topic',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/_base/declare'
], function(
  dom,
  domClass,
  _WidgetBase,
  topic,
  array,
  lang,
  declare
) {
  return declare(_WidgetBase, {
    // number of letters in this word
    length: 0,

    constructor: function(cfg) {
      this.config = {
        gridWidth: 0,
        letterWidth: 0,
        wordTop: 0,
        shouldScale: false
      };
      lang.mixin(this.config, cfg);

      this._letters = [];
      this._scale = 1.0;
    },

    // build the UI
    buildRendering: function() {
      this.inherited(arguments);
      this.domNode = dom.create('div', {class: 'word'});
    },

    // scale letters
    _squeeze: function(letter, oldScale, newScale) {
      var start = 'scale(' + oldScale + ', 1)';
      var end = 'scale(' + newScale + ', 1)';
      var duration = (newScale > oldScale) ? 500 : 100;
      baseFx.animateProperty({
        node: letter.domNode,
        duration: duration,
        properties: {transform: {start: start, end: end}}
      }).play();
    },

    // update letter positions
    _placeLetters: function() {
      var cfg = this.config;
      var lw = cfg.letterWidth;
      var width = this._letters.length * cfg.letterWidth;

      if (width > cfg.gridWidth && this._shouldScale) {
        width = cfg.gridWidth;
        lw = cfg.gridWidth / this._letters.length;
        var scale = lw / cfg.letterWidth;
        array.forEach(this._letters, function(ltr) {
          this._squeeze(ltr, this._scale, scale);
        }, this);
        this._scale = scale;
      }

      var start = (cfg.gridWidth / 2) - (width / 2);
      start -= (cfg.letterWidth - lw) / 2;

      for (var i = 0; i < this._letters.length; i++) {
        var pos = {left: start + i*lw, top: cfg.wordTop};
        this._letters[i].set('position', pos);
      }
      this.set('length', this._letters.length);
    },

    // indicate whether this word contains the given letter
    contains: function(letter) {
      return this._letters.indexOf(letter) != -1;
    },

    // add a letter to the word, moving it to the word area
    add: function(letter) {
      var oldLetters = array.map(this._letters, function(x) { return x; });
      this._letters.push(letter);
      domClass.add(letter.domNode, 'selected');
      this._placeLetters();
      topic.publish('word.changed', oldLetters, this._letters)
    },

    // remove a letter from the word, returning it to the grid
    remove: function(letter) {
      if (this._scale < 1.0 && this._shouldScale) {
        this._squeeze(letter, 1.0);
      }
      var oldLetters = array.map(this._letters, function(x) { return x; });
      this._letters.splice(this._letters.indexOf(letter), 1);
      domClass.remove(letter.domNode, 'selected');
      letter.set('position', null);
      this._placeLetters();
      topic.publish('word.changed', oldLetters, this._letters);
    },

    // return this word as a string
    toString: function() {
      var s = array.map(this._letters, function(x) { return x.value; });
      return s.join('');
    },

    // clear the word
    clear: function() {
      array.forEach(this._letters, function(letter) {
        if (this._shouldScale) {
          this._squeeze(letter, this._scale, 1.0);
        }
        letter.set('position', null);
      }, this);

      var oldLetters = this._letters;
      this._scale = 1.0;
      this._letters = [];
      this.set('length', 0);
      topic.publish('word.changed', oldLetters, []);
    },

    // set the owner of all the characters in this word
    setOwner: function(owner) {
      array.forEach(this._letters, function(x) {
        if (!x.get('defended')) x.set('owner', owner);
      });
    }
  });
});
