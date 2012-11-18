//
// Displays the list of played words
//
define([
  'dojo/dom-construct',
  'dijit/_WidgetBase',
  'dojo/_base/declare'
], function(
  dom,
  _WidgetBase,
  declare
) {
  return declare(_WidgetBase, {
    constructor: function() {
      this.words = [];
    },

    buildRendering: function() {
      this.inherited(arguments);
      this.domNode = dom.create('ul', {class: 'wordlist'});
    },

    add: function(word, owner) {
      dom.create('li', {innerHTML: word, class: owner}, this.domNode);
      this.words.push(word);
    },

    clear: function() {
      dom.empty(this.domNode);
      this.words = [];
    }
  });
});
