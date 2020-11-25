//
// This is the main game controller. It contains all the letter tiles, the
// buttons, and the players.
//
define([
  './Letter.js',
  './Word.js',
  './Player.js',
  './WordList.js',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dijit/_WidgetBase',
  'dojo/topic',
  'dijit/Dialog',
  'dijit/form/Button',
  'dojox/html/styles',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/declare'
], function(
  Letter,
  Word,
  Player,
  WordList,
  dom,
  domStyle,
  _WidgetBase,
  topic,
  Dialog,
  Button,
  styles,
  lang,
  array,
  declare
) {
  // simple ASCII character source
  rawChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // ASCII character source weighted by English letter frequency; doesn't
  // generate very interesting boards
  // letter frequencies based on en.wikipedia.org/wiki/Letter_frequency
  engChars = Array( 82).join('A') +
             Array( 15).join('B') +
             Array( 28).join('C') +
             Array( 43).join('D') +
             Array(127).join('E') +
             Array( 22).join('F') +
             Array( 20).join('G') +
             Array( 61).join('H') +
             Array( 70).join('I') +
             Array(  2).join('J') +
             Array(  8).join('K') +
             Array( 40).join('L') +
             Array( 24).join('M') +
             Array( 67).join('N') +
             Array( 75).join('O') +
             Array( 19).join('P') +
             Array(  1).join('Q') +
             Array( 60).join('R') +
             Array( 63).join('S') +
             Array( 91).join('T') +
             Array( 28).join('U') +
             Array( 10).join('V') +
             Array( 24).join('W') +
             Array(  2).join('X') +
             Array( 20).join('Y') +
             Array(  1).join('Z');

  return declare(_WidgetBase, {
    // the current player
    player: null,

    // construct a new game with the given parameters (none, some, or all of
    // these may be specified)
    //
    //   letterWidth: width of a letter in pixels
    //   letterHeight: height of a letter in pixels
    //   rows: number of rows in the grid
    //   columns: number of rows in the grid
    //   wordTop: the position of the top of the current word, relative to
    //            the bottom of the player avatars
    //   letters: letters to populate the grid
    //
    constructor: function(cfg) {
      config = { 
        letterWidth: 50,
        letterHeight: 50,
        rows: 5,
        columns: 5,
        wordTop: 30,
        letters: null
      };
      lang.mixin(config, cfg);
      this.config = config;

      if (config.test) {
        config.rows = 3;
        config.columns = 3;
        config.letters = 'PDDODAGIP';
      }

      config.letterCount = config.rows * config.columns;
      config.gridTop = config.letterHeight + 2*config.wordTop;
    },

    // build the UI
    buildRendering: function() {
      this.inherited(arguments);

      var lw = this.config.letterWidth;
      var lh = this.config.letterHeight;
      var gridWidth = this.config.columns * lw;
      var gridHeight = this.config.rows * lh;
      var boardHeight = this.config.gridTop + gridHeight;

      var addRule = lang.hitch(this, function(selector, rule) {
        selector = '#' + this.id + '.game' + (selector ? ' ' + selector : '');
        styles.insertCssRule(selector, rule);
      });

      // set styles for various game elements
      addRule(null,        'width:'  + gridWidth + 'px');
      addRule('.board',    'height:' + boardHeight + 'px');
      addRule('.board',    'width:'  + gridWidth + 'px');
      addRule('.buttons',  'width:'  + gridWidth + 'px');
      addRule('.players',  'width:'  + gridWidth + 'px');
      addRule('.wordlist', 'left:'   + (gridWidth + 10) + 'px');
      addRule('.wordlist', 'height:' + gridHeight + 'px');
      addRule('.letter',   'width:'  + lw + 'px');
      addRule('.letter',   'height:' + lh + 'px');
      addRule('.letter',   'line-height:' + lh + 'px');
      addRule('.letter',   'font-size:'   + (lh - 10) + 'px');

      var wordListTop = config.gridTop + 48;
      addRule('.wordlist', 'top:' + wordListTop + 'px');

      // make the grid cover be the same size as the grid
      addRule('.cover',    'top:' + wordListTop + 'px');
      addRule('.cover',    'height:' + gridHeight + 'px');

      var players = dom.create('div', {class: 'players'}, this.domNode);
      this.player1 = new Player('player1');
      players.appendChild(this.player1.domNode);
      this.player2 = new Player('player2');
      players.appendChild(this.player2.domNode);

      this._word = new Word({
        gridWidth: gridWidth,
        letterWidth: this.config.letterWidth,
        wordTop: this.config.wordTop
      });
      this.domNode.appendChild(this._word.domNode);

      this._board = dom.create('div', {class: 'board'}, this.domNode);

      // a 'cover' to drop over the board when the game is over
      this._gridCover = dom.create('div', {
        class: 'board cover'
      }, this.domNode);

      this._wordlist = new WordList();
      this.domNode.appendChild(this._wordlist.domNode);

      var buttons = dom.create('div', {class: 'buttons'}, this.domNode);

      var clear = new Button({
        label: 'Clear',
        disabled: true,
        onClick: lang.hitch(this, function() { this._word.clear(); })
      });
      buttons.appendChild(clear.domNode);

      var pass = new Button({
        label: 'Pass',
        onClick: lang.hitch(this, function() {
          this.player.passed = true;
          this._finishTurn();
        })
      });
      buttons.appendChild(pass.domNode);

      var submit = new Button({
        label: 'Submit',
        disabled: true,
        onClick: lang.hitch(this, function() { this._submitWord(); })
      });
      buttons.appendChild(submit.domNode);

      this._word.watch('length', function(_name, _oVal, nVal) {
        submit.set('disabled', 0 == nVal);
        clear.set('disabled', 0 == nVal);
      });
    },

    // things to do after the UI has been setup
    postCreate: function() {
      this.inherited(arguments);
      this.reset();
    },

    // reset the game state
    reset: function() {
      dom.empty(this._board);
      this._word.clear();
      this._grid = [];
      this.player1.set('score', 0);
      this.player2.set('score', 0);
      this.set('player', this.player1);
      this._wordlist.clear();
      domStyle.set(this._gridCover, 'display', 'none');

      var letters = this.test ? this.config.letters
                              : this._randomLetters(this.config.letterCount, engChars);

      array.forEach(letters, function(letter, i) {
        var col = i % this.config.columns;
        var row = Math.floor(i / this.config.rows);
        this._addLetter(row, col, letter);
      }, this);
    },

    // generate a string of random capital ASCII characters based on the given
    // character source, defaulting to simple ASCII
    _randomLetters: function(count, source) {
      var letters = [];
      source = source || rawChars;
      for (var i = 0; i < count; i++) {
        letters.push(source[Math.floor(Math.random()*source.length)]);
      }
      return letters.join('');
    },

    // add a letter to the grid
    _addLetter: function(row, col, ltr) {
      var letter = new Letter(ltr, row, col, {
        top: this.config.gridTop + row*this.config.letterHeight,
        left: col*this.config.letterWidth
      });
      this._board.appendChild(letter.domNode);

      var row = this._grid[row] || [];
      if (0 == row.length) this._grid.push(row);
      row.push(letter);

      letter.on('click', lang.hitch(this, function() {
        // ignore clicks on letters defended by the other player
        const defender = this._getLetterDefender(letter.row, letter.col);
        if (defender && defender !== this.player.id) {
          return;
        }

        if (this._word.contains(letter)) {
          this._word.remove(letter);
        } else {
          this._word.add(letter);
        }
      }));
    },

    // accept or reject the current word
    _submitWord: function() {
      var wordStr = this._word.toString();

      if (-1 == this.dictionary.indexOf(wordStr.toLowerCase())) {
        this._error('Oops!', '"' + wordStr + '" is not in the dictionary');
      } else if (-1 != this._wordlist.words.indexOf(wordStr)) {
        this._error('Oops!', '"' + wordStr + '" has already been played');
      } else {
        this._wordlist.add(this._word.toString(), this.player.id);
        this._word.setOwner(this.player.id);
        this.player.passed = false;
        this._finishTurn();
      }
    },

    // return true if all letters are owned
    _gridIsOwned: function() {
      for (var r = 0; r < this._grid.length; r++) {
        var row = this._grid[r];
        for (var c = 0; c < row.length; c++) {
          if (!row[c].get('owner')) {
            return false;
          }
        }
      }
      return true;
    },

    // update the board state and switch players
    _finishTurn: function() {
      var scores = {player1: 0, player2: 0, null: 0};
      for (var r = 0; r < this.config.rows; r++) {
        for (var c = 0; c < this.config.columns; c++) {
          var letter = this._grid[r][c];
          scores[letter.get('owner')]++;
          letter.set('defended', this._getLetterDefender(r, c) != null);
        }
      }

      this.player1.set('score', scores.player1);
      this.player2.set('score', scores.player2);

      this._word.clear();
      
      // the game is over if all letters are owned or if both players pass
      if (this._gridIsOwned() || (this.player1.passed && this.player2.passed)) {
        // drop the cover over the board
        domStyle.set(this._gridCover, 'display', 'block');

        if (scores.player1 != scores.player2) {
          var winner = scores.player1 > scores.player2 ? this.player1.name
                                                       : this.player2.name;
          this._message('Game Over', winner + ' has won the game!');
        } else {
          this._message('Game Over', 'The game was a tie!');
        }
      } else {
        this.set('player', null);
      }
    },

    // show an error message
    _error: function(title, message) {
      this._message(title, message, 'error');
    },

    // show an alert message
    _message: function(title, message, cls) {
      new Dialog({
        title: title,
        content: message,
        draggable: false,
        class: cls || ''
      }).show();
    },

    // get the defender of a letter at a given row and column, if it is
    // defended
    _getLetterDefender: function(row, col) {
      var owner = this._grid[row][col].get('owner');
      var lc = this.config.columns - 1;
      var lr = this.config.rows - 1;
      if (
        owner &&
        (col == 0  || this._grid[row][col-1].get('owner') == owner) &&
        (row == 0  || this._grid[row-1][col].get('owner') == owner) &&
        (col == lc || this._grid[row][col+1].get('owner') == owner) &&
        (row == lr || this._grid[row+1][col].get('owner') == owner)
      ) {
        return owner;
      }
    },

    // set the current player
    // passing null or undefined for 'player' will toggle the current player
    _setPlayerAttr: function(player) {
      if (!player) {
        player = this.player == this.player1 ? this.player2 : this.player1;
      }
      this._set('player', player);
      topic.publish('player', player.id)
    },
  });
});
