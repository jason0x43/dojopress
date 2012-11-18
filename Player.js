//
// Represents a player
// 
// Objects of this class display a player's current and forecasted scores.
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
    // the player's score
    score: 0,

    // true if it's this player's turn
    turn: false,

    constructor: function(id, name) {
      this.id = id;
      this.name = name || id;
    },

    // build the UI
    buildRendering: function() {
      this.inherited(arguments);
      this.domNode = dom.create('div', {
        class: 'player ' + this.id, innerHTML: this.score
      });

      topic.subscribe('word.changed', lang.hitch(this, function(oldL, newL) {
        this._updateForecast(oldL, newL);
      }));

      topic.subscribe('player', lang.hitch(this, function(id) {
        this.set('turn', id == this.id);
      }));
    },

    // update the current forecasted score based on the addition or
    // removal of letters from the word
    _updateForecast: function(oldLetters, letters) {
      if (0 == letters.length) {
        this.domNode.innerHTML = this.score;
        domClass.remove(this.domNode, 'forecast');
        delete this._forecast;
      } else {
        domClass.add(this.domNode, 'forecast');
        this._forecast = this.score;

        var undefended = array.filter(letters, function(x) {
          return !x.get('defended');
        });

        array.forEach(undefended, function(letter) {
          if (this.turn && letter.get('owner') != this.id) {
            this._forecast++;
          } else if (!this.turn && letter.get('owner') == this.id) {
            this._forecast--;
          }
        }, this);

        this.domNode.innerHTML = this._forecast;
      }
    },

    // setter for 'turn' field
    _setTurnAttr: function(turn) {
      this._set('turn', turn);
      var update = turn ? domClass.add : domClass.remove;
      update(this.domNode, 'turn');
    },

    // setter for 'score' field
    _setScoreAttr: function(score) {
      this._set('score', score);
      this.domNode.innerHTML = score;
    }
  });
});
