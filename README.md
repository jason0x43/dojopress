DojoPress
=========

DojoPress is a [LetterPress](http://www.atebits.com/letterpress/) clone built
with the [Dojo framework](http://dojotoolkit.org).

I created this project after a friend showed me eviltrout's
[EmberPress](https://github.com/eviltrout/emberpress). I've been working with
Dojo a lot lately, and I just wanted to see if I could make something roughly
equivalent to EmberPress in Dojo with about the same code size (~350 lines).
That seemed to go well enough, so I threw code size out the window and added
some animation, broke my single file into separate class files, and generally
tried to provide examples of various Dojo features.

DojoPress consists of several visual components (Word, Letter, etc.) that are
implemented as simple Dijits (Dojo widgets), along with a dictionary. Each of
these is in its own file, and the Dojo AMD loader is used to pull everything
together at load time. Internally the game makes use of a couple of Dojo's DOM
manipulation libraries, its array helpers, some Dijits, dynamic stylesheet
creation, fx (animation), and the topic system.

To run DojoPress in Safari and Firefox, just clone this repository and open
the index.html file in the browser. Chrome requires a command line flag to let
everything load properly from the file system. On a Mac, start Chrome with:

    open /Applications/Google\ Chrome.app --new --args -allow-file-access-from-files

The dictionary used by DojoPress was generated from [The English Open Word List](http://dreamsteep.com/projects/the-english-open-word-list.html).
