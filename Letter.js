//
// Represents a letter tile
//
define([
  'dojo/dom-construct',
  'dojo/dom-class',
  'dijit/_WidgetBase',
  'dojo/fx',
  'dojo/fx/easing',
  'dojo/_base/lang',
  'dojo/_base/declare'
], function(
  dom,
  domClass,
  _WidgetBase,
  fx,
  easing,
  lang,
  declare
) {
  return declare(_WidgetBase, {
    // true if this letter is defended
    defended: false,

    // the current owner of this letter
    owner: null,

    // the current {left, top} position of this letter
    position: null,

    constructor: function(val, row, col, home) {
      this.row = row;
      this.col = col;
      this.value = val;
      this.home = home;
    },

    // build the UI
    buildRendering: function() {
      this.inherited(arguments);
      this.domNode = dom.create('div', {
        class: 'letter',
        innerHTML: this.value,
        style: {left: this.home.left + 'px', top: this.home.top + 'px'}
      });
    },

    // post-build setup
    postCreate: function() {
      this.inherited(arguments);
      this.position = this.home;
    },

    // indicate whether the letter is moving from the grid to the word
    isMovingToWord: function(oldPos, newPos) {
      return (oldPos.top == this.home.top && newPos.top != this.home.top);
    },

    // move a letter to a new location and updated its selected state
    _setPositionAttr: function(pos) {
      pos = pos || this.home;
      if (this.isMovingToWord(this.position, pos)) {
        domClass.add(this.domNode, 'moving');
      }

      this._set('position', pos);

      fx.slideTo({
        node: this.domNode,
        top: pos.top,
        left: pos.left,
        duration: 600,
        easing: easing.expoOut,
        onEnd: lang.hitch(this, function() {
          domClass.remove(this.domNode, 'moving');
        })
      }).play();
    },

    // set the owner of this letter, updating the letter's CSS class
    _setOwnerAttr: function(owner) {
      domClass.replace(this.domNode, owner, this.owner);
      this._set('owner', owner);
    },

    // set to true to indicate that this letter is defended by it's owner
    _setDefendedAttr: function(defended) {
      this._set('defended', defended);
      var update = defended ? domClass.add : domClass.remove;
      update(this.domNode, 'defended');
    }
  });
});
