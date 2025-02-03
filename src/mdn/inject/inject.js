/* eslint-disable no-useless-escape,no-prototype-builtins */
// noinspection ES6ConvertVarToLetConst

'use strict';

/// region prismjs

/* PrismJS 1.29.0
https://prismjs.com/download.html#themes=prism&languages=markup+css+clike+javascript+json */
/// <reference lib="WebWorker"/>

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Lea Verou <https://lea.verou.me>
 * @namespace
 * @public
 */
var Prism = (function (_self) {

  // Private helper vars
  var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
  var uniqueId = 0;

  // The grammar object for plaintext
  var plainTextGrammar = {};


  var _ = {
    /**
     * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
     * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
     * additional languages or plugins yourself.
     *
     * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
     *
     * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
     * empty Prism object into the global scope before loading the Prism script like this:
     *
     * ```js
     * window.Prism = window.Prism || {};
     * Prism.manual = true;
     * // add a new <script> to load Prism's script
     * ```
     *
     * @default false
     * @type {boolean}
     * @memberof Prism
     * @public
     */
    manual: _self.Prism && _self.Prism.manual,
    /**
     * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
     * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
     * own worker, you don't want it to do this.
     *
     * By setting this value to `true`, Prism will not add its own listeners to the worker.
     *
     * You obviously have to change this value before Prism executes. To do this, you can add an
     * empty Prism object into the global scope before loading the Prism script like this:
     *
     * ```js
     * window.Prism = window.Prism || {};
     * Prism.disableWorkerMessageHandler = true;
     * // Load Prism's script
     * ```
     *
     * @default false
     * @type {boolean}
     * @memberof Prism
     * @public
     */
    disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

    /**
     * A namespace for utility methods.
     *
     * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
     * change or disappear at any time.
     *
     * @namespace
     * @memberof Prism
     */
    util: {
      encode: function encode(tokens) {
        if (tokens instanceof Token) {
          return new Token(tokens.type, encode(tokens.content), tokens.alias);
        } else if (Array.isArray(tokens)) {
          return tokens.map(encode);
        } else {
          return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
        }
      },

      /**
       * Returns the name of the type of the given value.
       *
       * @param {any} o
       * @returns {string}
       * @example
       * type(null)      === 'Null'
       * type(undefined) === 'Undefined'
       * type(123)       === 'Number'
       * type('foo')     === 'String'
       * type(true)      === 'Boolean'
       * type([1, 2])    === 'Array'
       * type({})        === 'Object'
       * type(String)    === 'Function'
       * type(/abc+/)    === 'RegExp'
       */
      type: function (o) {
        return Object.prototype.toString.call(o).slice(8, -1);
      },

      /**
       * Returns a unique number for the given object. Later calls will still return the same number.
       *
       * @param {Object} obj
       * @returns {number}
       */
      objId: function (obj) {
        if (!obj['__id']) {
          Object.defineProperty(obj, '__id', { value: ++uniqueId });
        }
        return obj['__id'];
      },

      /**
       * Creates a deep clone of the given object.
       *
       * The main intended use of this function is to clone language definitions.
       *
       * @param {T} o
       * @param {Record<number, any>} [visited]
       * @returns {T}
       * @template T
       */
      clone: function deepClone(o, visited) {
        visited = visited || {};

        var clone; var id;
        switch (_.util.type(o)) {
        case 'Object':
          id = _.util.objId(o);
          if (visited[id]) {
            return visited[id];
          }
          clone = /** @type {Record<string, any>} */ ({});
          visited[id] = clone;

          for (var key in o) {
            if (o.hasOwnProperty(key)) {
              clone[key] = deepClone(o[key], visited);
            }
          }

          return /** @type {any} */ (clone);

        case 'Array':
          id = _.util.objId(o);
          if (visited[id]) {
            return visited[id];
          }
          clone = [];
          visited[id] = clone;

          (/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
            clone[i] = deepClone(v, visited);
          });

          return /** @type {any} */ (clone);

        default:
          return o;
        }
      },

      /**
       * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
       *
       * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
       *
       * @param {Element} element
       * @returns {string}
       */
      getLanguage: function (element) {
        while (element) {
          var m = lang.exec(element.className);
          if (m) {
            return m[1].toLowerCase();
          }
          element = element.parentElement;
        }
        return 'none';
      },

      /**
       * Sets the Prism `language-xxxx` class of the given element.
       *
       * @param {Element} element
       * @param {string} language
       * @returns {void}
       */
      setLanguage: function (element, language) {
        // remove all `language-xxxx` classes
        // (this might leave behind a leading space)
        element.className = element.className.replace(RegExp(lang, 'gi'), '');

        // add the new `language-xxxx` class
        // (using `classList` will automatically clean up spaces for us)
        element.classList.add('language-' + language);
      },

      /**
       * Returns the script element that is currently executing.
       *
       * This does __not__ work for line script element.
       *
       * @returns {HTMLScriptElement | null}
       */
      currentScript: function () {
        if (typeof document === 'undefined') {
          return null;
        }
        if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */) {
          return /** @type {any} */ (document.currentScript);
        }

        // IE11 workaround
        // we'll get the src of the current script by parsing IE11's error stack trace
        // this will not work for inline scripts

        try {
          throw new Error();
        } catch (err) {
          // Get file src url from stack. Specifically works with the format of stack traces in IE.
          // A stack will look like this:
          //
          // Error
          //    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
          //    at Global code (http://localhost/components/prism-core.js:606:1)

          var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
          if (src) {
            var scripts = document.getElementsByTagName('script');
            for (var i in scripts) {
              if (scripts[i].src == src) {
                return scripts[i];
              }
            }
          }
          return null;
        }
      },

      /**
       * Returns whether a given class is active for `element`.
       *
       * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
       * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
       * given class is just the given class with a `no-` prefix.
       *
       * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
       * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
       * ancestors have the given class or the negated version of it, then the default activation will be returned.
       *
       * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
       * version of it, the class is considered active.
       *
       * @param {Element} element
       * @param {string} className
       * @param {boolean} [defaultActivation=false]
       * @returns {boolean}
       */
      isActive: function (element, className, defaultActivation) {
        var no = 'no-' + className;

        while (element) {
          var classList = element.classList;
          if (classList.contains(className)) {
            return true;
          }
          if (classList.contains(no)) {
            return false;
          }
          element = element.parentElement;
        }
        return !!defaultActivation;
      }
    },

    /**
     * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
     *
     * @namespace
     * @memberof Prism
     * @public
     */
    languages: {
      /**
       * The grammar for plain, unformatted text.
       */
      plain: plainTextGrammar,
      plaintext: plainTextGrammar,
      text: plainTextGrammar,
      txt: plainTextGrammar,

      /**
       * Creates a deep copy of the language with the given id and appends the given tokens.
       *
       * If a token in `redef` also appears in the copied language, then the existing token in the copied language
       * will be overwritten at its original position.
       *
       * ## Best practices
       *
       * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
       * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
       * understand the language definition because, normally, the order of tokens matters in Prism grammars.
       *
       * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
       * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
       *
       * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
       * @param {Grammar} redef The new tokens to append.
       * @returns {Grammar} The new language created.
       * @public
       * @example
       * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
       *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
       *     // at its original position
       *     'comment': { ... },
       *     // CSS doesn't have a 'color' token, so this token will be appended
       *     'color': /\b(?:red|green|blue)\b/
       * });
       */
      extend: function (id, redef) {
        var lang = _.util.clone(_.languages[id]);

        for (var key in redef) {
          lang[key] = redef[key];
        }

        return lang;
      },

      /**
       * Inserts tokens _before_ another token in a language definition or any other grammar.
       *
       * ## Usage
       *
       * This helper method makes it easy to modify existing languages. For example, the CSS language definition
       * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
       * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
       * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
       * this:
       *
       * ```js
       * Prism.languages.markup.style = {
       *     // token
       * };
       * ```
       *
       * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
       * before existing tokens. For the CSS example above, you would use it like this:
       *
       * ```js
       * Prism.languages.insertBefore('markup', 'cdata', {
       *     'style': {
       *         // token
       *     }
       * });
       * ```
       *
       * ## Special cases
       *
       * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
       * will be ignored.
       *
       * This behavior can be used to insert tokens after `before`:
       *
       * ```js
       * Prism.languages.insertBefore('markup', 'comment', {
       *     'comment': Prism.languages.markup.comment,
       *     // tokens after 'comment'
       * });
       * ```
       *
       * ## Limitations
       *
       * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
       * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
       * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
       * deleting properties which is necessary to insert at arbitrary positions.
       *
       * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
       * Instead, it will create a new object and replace all references to the target object with the new one. This
       * can be done without temporarily deleting properties, so the iteration order is well-defined.
       *
       * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
       * you hold the target object in a variable, then the value of the variable will not change.
       *
       * ```js
       * var oldMarkup = Prism.languages.markup;
       * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
       *
       * assert(oldMarkup !== Prism.languages.markup);
       * assert(newMarkup === Prism.languages.markup);
       * ```
       *
       * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
       * object to be modified.
       * @param {string} before The key to insert before.
       * @param {Grammar} insert An object containing the key-value pairs to be inserted.
       * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
       * object to be modified.
       *
       * Defaults to `Prism.languages`.
       * @returns {Grammar} The new grammar object.
       * @public
       */
      insertBefore: function (inside, before, insert, root) {
        root = root || /** @type {any} */ (_.languages);
        var grammar = root[inside];
        /** @type {Grammar} */
        var ret = {};

        for (var token in grammar) {
          if (grammar.hasOwnProperty(token)) {

            if (token == before) {
              for (var newToken in insert) {
                if (insert.hasOwnProperty(newToken)) {
                  ret[newToken] = insert[newToken];
                }
              }
            }

            // Do not insert token which also occur in insert. See #1525
            if (!insert.hasOwnProperty(token)) {
              ret[token] = grammar[token];
            }
          }
        }

        var old = root[inside];
        root[inside] = ret;

        // Update references in other language definitions
        _.languages.DFS(_.languages, function (key, value) {
          if (value === old && key != inside) {
            this[key] = ret;
          }
        });

        return ret;
      },

      // Traverse a language definition with Depth First Search
      DFS: function DFS(o, callback, type, visited) {
        visited = visited || {};

        var objId = _.util.objId;

        for (var i in o) {
          if (o.hasOwnProperty(i)) {
            callback.call(o, i, o[i], type || i);

            var property = o[i];
            var propertyType = _.util.type(property);

            if (propertyType === 'Object' && !visited[objId(property)]) {
              visited[objId(property)] = true;
              DFS(property, callback, null, visited);
            } else if (propertyType === 'Array' && !visited[objId(property)]) {
              visited[objId(property)] = true;
              DFS(property, callback, i, visited);
            }
          }
        }
      }
    },

    plugins: {},

    /**
     * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
     * and the language definitions to use, and returns a string with the HTML produced.
     *
     * The following hooks will be run:
     * 1. `before-tokenize`
     * 2. `after-tokenize`
     * 3. `wrap`: On each {@link Token}.
     *
     * @param {string} text A string with the code to be highlighted.
     * @param {Grammar} grammar An object containing the tokens to use.
     *
     * Usually a language definition like `Prism.languages.markup`.
     * @param {string} language The name of the language definition passed to `grammar`.
     * @returns {string} The highlighted HTML.
     * @memberof Prism
     * @public
     * @example
     * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
     */
    highlight: function (text, grammar, language) {
      var env = {
        code: text,
        grammar: grammar,
        language: language
      };
      _.hooks.run('before-tokenize', env);
      if (!env.grammar) {
        throw new Error('The language "' + env.language + '" has no grammar.');
      }
      env.tokens = _.tokenize(env.code, env.grammar);
      _.hooks.run('after-tokenize', env);
      return Token.stringify(_.util.encode(env.tokens), env.language);
    },

    /**
     * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
     * and the language definitions to use, and returns an array with the tokenized code.
     *
     * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
     *
     * This method could be useful in other contexts as well, as a very crude parser.
     *
     * @param {string} text A string with the code to be highlighted.
     * @param {Grammar} grammar An object containing the tokens to use.
     *
     * Usually a language definition like `Prism.languages.markup`.
     * @returns {TokenStream} An array of strings and tokens, a token stream.
     * @memberof Prism
     * @public
     * @example
     * let code = `var foo = 0;`;
     * let tokens = Prism.tokenize(code, Prism.languages.javascript);
     * tokens.forEach(token => {
     *     if (token instanceof Prism.Token && token.type === 'number') {
     *         console.log(`Found numeric literal: ${token.content}`);
     *     }
     * });
     */
    tokenize: function (text, grammar) {
      var rest = grammar.rest;
      if (rest) {
        for (var token in rest) {
          grammar[token] = rest[token];
        }

        delete grammar.rest;
      }

      var tokenList = new LinkedList();
      addAfter(tokenList, tokenList.head, text);

      matchGrammar(text, tokenList, grammar, tokenList.head, 0);

      return toArray(tokenList);
    },

    /**
     * @namespace
     * @memberof Prism
     * @public
     */
    hooks: {
      all: {},

      /**
       * Adds the given callback to the list of callbacks for the given hook.
       *
       * The callback will be invoked when the hook it is registered for is run.
       * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
       *
       * One callback function can be registered to multiple hooks and the same hook multiple times.
       *
       * @param {string} name The name of the hook.
       * @param {HookCallback} callback The callback function which is given environment variables.
       * @public
       */
      add: function (name, callback) {
        var hooks = _.hooks.all;

        hooks[name] = hooks[name] || [];

        hooks[name].push(callback);
      },

      /**
       * Runs a hook invoking all registered callbacks with the given environment variables.
       *
       * Callbacks will be invoked synchronously and in the order in which they were registered.
       *
       * @param {string} name The name of the hook.
       * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
       * @public
       */
      run: function (name, env) {
        var callbacks = _.hooks.all[name];

        if (!callbacks || !callbacks.length) {
          return;
        }

        for (var i = 0, callback; (callback = callbacks[i++]);) {
          callback(env);
        }
      }
    },

    Token: Token
  };
  _self.Prism = _;


  // Typescript note:
  // The following can be used to import the Token type in JSDoc:
  //
  //   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

  /**
   * Creates a new token.
   *
   * @param {string} type See {@link Token#type type}
   * @param {string | TokenStream} content See {@link Token#content content}
   * @param {string|string[]} [alias] The alias(es) of the token.
   * @param {string} [matchedStr=""] A copy of the full string this token was created from.
   * @class
   * @global
   * @public
   */
  function Token(type, content, alias, matchedStr) {
    /**
     * The type of the token.
     *
     * This is usually the key of a pattern in a {@link Grammar}.
     *
     * @type {string}
     * @see GrammarToken
     * @public
     */
    this.type = type;
    /**
     * The strings or tokens contained by this token.
     *
     * This will be a token stream if the pattern matched also defined an `inside` grammar.
     *
     * @type {string | TokenStream}
     * @public
     */
    this.content = content;
    /**
     * The alias(es) of the token.
     *
     * @type {string|string[]}
     * @see GrammarToken
     * @public
     */
    this.alias = alias;
    // Copy of the full string this token was created from
    this.length = (matchedStr || '').length | 0;
  }

  /**
   * A token stream is an array of strings and {@link Token Token} objects.
   *
   * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
   * them.
   *
   * 1. No adjacent strings.
   * 2. No empty strings.
   *
   *    The only exception here is the token stream that only contains the empty string and nothing else.
   *
   * @typedef {Array<string | Token>} TokenStream
   * @global
   * @public
   */

  /**
   * Converts the given token or token stream to an HTML representation.
   *
   * The following hooks will be run:
   * 1. `wrap`: On each {@link Token}.
   *
   * @param {string | Token | TokenStream} o The token or token stream to be converted.
   * @param {string} language The name of current language.
   * @returns {string} The HTML representation of the token or token stream.
   * @memberof Token
   * @static
   */
  Token.stringify = function stringify(o, language) {
    if (typeof o == 'string') {
      return o;
    }
    if (Array.isArray(o)) {
      var s = '';
      o.forEach(function (e) {
        s += stringify(e, language);
      });
      return s;
    }

    var env = {
      type: o.type,
      content: stringify(o.content, language),
      tag: 'span',
      classes: ['token', o.type],
      attributes: {},
      language: language
    };

    var aliases = o.alias;
    if (aliases) {
      if (Array.isArray(aliases)) {
        Array.prototype.push.apply(env.classes, aliases);
      } else {
        env.classes.push(aliases);
      }
    }

    _.hooks.run('wrap', env);

    var attributes = '';
    for (var name in env.attributes) {
      attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
    }

    return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
  };

  /**
   * @param {RegExp} pattern
   * @param {number} pos
   * @param {string} text
   * @param {boolean} lookbehind
   * @returns {RegExpExecArray | null}
   */
  function matchPattern(pattern, pos, text, lookbehind) {
    pattern.lastIndex = pos;
    var match = pattern.exec(text);
    if (match && lookbehind && match[1]) {
      // change the match to remove the text matched by the Prism lookbehind group
      var lookbehindLength = match[1].length;
      match.index += lookbehindLength;
      match[0] = match[0].slice(lookbehindLength);
    }
    return match;
  }

  /**
   * @param {string} text
   * @param {LinkedList<string | Token>} tokenList
   * @param {any} grammar
   * @param {LinkedListNode<string | Token>} startNode
   * @param {number} startPos
   * @param {RematchOptions} [rematch]
   * @returns {void}
   * @private
   *
   * @typedef RematchOptions
   * @property {string} cause
   * @property {number} reach
   */
  function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
    for (var token in grammar) {
      if (!grammar.hasOwnProperty(token) || !grammar[token]) {
        continue;
      }

      var patterns = grammar[token];
      patterns = Array.isArray(patterns) ? patterns : [patterns];

      for (var j = 0; j < patterns.length; ++j) {
        if (rematch && rematch.cause == token + ',' + j) {
          return;
        }

        var patternObj = patterns[j];
        var inside = patternObj.inside;
        var lookbehind = !!patternObj.lookbehind;
        var greedy = !!patternObj.greedy;
        var alias = patternObj.alias;

        if (greedy && !patternObj.pattern.global) {
          // Without the global flag, lastIndex won't work
          var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
          patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
        }

        /** @type {RegExp} */
        var pattern = patternObj.pattern || patternObj;

        for ( // iterate the token list and keep track of the current token/string position
          var currentNode = startNode.next, pos = startPos;
          currentNode !== tokenList.tail;
          pos += currentNode.value.length, currentNode = currentNode.next
        ) {

          if (rematch && pos >= rematch.reach) {
            break;
          }

          var str = currentNode.value;

          if (tokenList.length > text.length) {
            // Something went terribly wrong, ABORT, ABORT!
            return;
          }

          if (str instanceof Token) {
            continue;
          }

          var removeCount = 1; // this is the to parameter of removeBetween
          var match;

          if (greedy) {
            match = matchPattern(pattern, pos, text, lookbehind);
            if (!match || match.index >= text.length) {
              break;
            }

            var from = match.index;
            var to = match.index + match[0].length;
            var p = pos;

            // find the node that contains the match
            p += currentNode.value.length;
            while (from >= p) {
              currentNode = currentNode.next;
              p += currentNode.value.length;
            }
            // adjust pos (and p)
            p -= currentNode.value.length;
            pos = p;

            // the current node is a Token, then the match starts inside another Token, which is invalid
            if (currentNode.value instanceof Token) {
              continue;
            }

            // find the last node which is affected by this match
            for (
              var k = currentNode;
              k !== tokenList.tail && (p < to || typeof k.value === 'string');
              k = k.next
            ) {
              removeCount++;
              p += k.value.length;
            }
            removeCount--;

            // replace with the new match
            str = text.slice(pos, p);
            match.index -= pos;
          } else {
            match = matchPattern(pattern, 0, str, lookbehind);
            if (!match) {
              continue;
            }
          }

          // eslint-disable-next-line no-redeclare
          var from = match.index;
          var matchStr = match[0];
          var before = str.slice(0, from);
          var after = str.slice(from + matchStr.length);

          var reach = pos + str.length;
          if (rematch && reach > rematch.reach) {
            rematch.reach = reach;
          }

          var removeFrom = currentNode.prev;

          if (before) {
            removeFrom = addAfter(tokenList, removeFrom, before);
            pos += before.length;
          }

          removeRange(tokenList, removeFrom, removeCount);

          var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
          currentNode = addAfter(tokenList, removeFrom, wrapped);

          if (after) {
            addAfter(tokenList, currentNode, after);
          }

          if (removeCount > 1) {
            // at least one Token object was removed, so we have to do some rematching
            // this can only happen if the current pattern is greedy

            /** @type {RematchOptions} */
            var nestedRematch = {
              cause: token + ',' + j,
              reach: reach
            };
            matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

            // the reach might have been extended because of the rematching
            if (rematch && nestedRematch.reach > rematch.reach) {
              rematch.reach = nestedRematch.reach;
            }
          }
        }
      }
    }
  }

  /**
   * @typedef LinkedListNode
   * @property {T} value
   * @property {LinkedListNode<T> | null} prev The previous node.
   * @property {LinkedListNode<T> | null} next The next node.
   * @template T
   * @private
   */

  /**
   * @template T
   * @private
   */
  function LinkedList() {
    /** @type {LinkedListNode<T>} */
    var head = { value: null, prev: null, next: null };
    /** @type {LinkedListNode<T>} */
    var tail = { value: null, prev: head, next: null };
    head.next = tail;

    /** @type {LinkedListNode<T>} */
    this.head = head;
    /** @type {LinkedListNode<T>} */
    this.tail = tail;
    this.length = 0;
  }

  /**
   * Adds a new node with the given value to the list.
   *
   * @param {LinkedList<T>} list
   * @param {LinkedListNode<T>} node
   * @param {T} value
   * @returns {LinkedListNode<T>} The added node.
   * @template T
   */
  function addAfter(list, node, value) {
    // assumes that node != list.tail && values.length >= 0
    var next = node.next;

    var newNode = { value: value, prev: node, next: next };
    node.next = newNode;
    next.prev = newNode;
    list.length++;

    return newNode;
  }
  /**
   * Removes `count` nodes after the given node. The given node will not be removed.
   *
   * @param {LinkedList<T>} list
   * @param {LinkedListNode<T>} node
   * @param {number} count
   * @template T
   */
  function removeRange(list, node, count) {
    var next = node.next;
    for (var i = 0; i < count && next !== list.tail; i++) {
      next = next.next;
    }
    node.next = next;
    next.prev = node;
    list.length -= i;
  }
  /**
   * @param {LinkedList<T>} list
   * @returns {T[]}
   * @template T
   */
  function toArray(list) {
    var array = [];
    var node = list.head.next;
    while (node !== list.tail) {
      array.push(node.value);
      node = node.next;
    }
    return array;
  }


  if (!_self.document) {
    if (!_self.addEventListener) {
      // in Node.js
      return _;
    }

    if (!_.disableWorkerMessageHandler) {
      // In worker
      _self.addEventListener('message', function (evt) {
        var message = JSON.parse(evt.data);
        var lang = message.language;
        var code = message.code;
        var immediateClose = message.immediateClose;

        _self.postMessage(_.highlight(code, _.languages[lang], lang));
        if (immediateClose) {
          _self.close();
        }
      }, false);
    }

    return _;
  }

  // Get current script and highlight
  _.manual = true;

  return _;

}(window));

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
  global.Prism = Prism;
}

// some additional documentation/types

/**
 * The expansion of a simple `RegExp` literal to support additional properties.
 *
 * @typedef GrammarToken
 * @property {RegExp} pattern The regular expression of the token.
 * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
 * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
 * @property {boolean} [greedy=false] Whether the token is greedy.
 * @property {string|string[]} [alias] An optional alias or list of aliases.
 * @property {Grammar} [inside] The nested grammar of this token.
 *
 * The `inside` grammar will be used to tokenize the text value of each token of this kind.
 *
 * This can be used to make nested and even recursive language definitions.
 *
 * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
 * each another.
 * @global
 * @public
 */

/**
 * @typedef Grammar
 * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
 * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
 * @global
 * @public
 */

/**
 * A function which will invoked after an element was successfully highlighted.
 *
 * @callback HighlightCallback
 * @param {Element} element The element successfully highlighted.
 * @returns {void}
 * @global
 * @public
 */

/**
 * @callback HookCallback
 * @param {Object<string, any>} env The environment variables of the hook.
 * @returns {void}
 * @global
 * @public
 */

Prism.languages.markup = {
  'comment': {
    pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
    greedy: true
  },
  'prolog': {
    pattern: /<\?[\s\S]+?\?>/,
    greedy: true
  },
  'doctype': {
    // https://www.w3.org/TR/xml/#NT-doctypedecl
    pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    greedy: true,
    inside: {
      'internal-subset': {
        pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
        lookbehind: true,
        greedy: true,
        inside: null // see below
      },
      'string': {
        pattern: /"[^"]*"|'[^']*'/,
        greedy: true
      },
      'punctuation': /^<!|>$|[[\]]/,
      'doctype-tag': /^DOCTYPE/i,
      'name': /[^\s<>'"]+/
    }
  },
  'cdata': {
    pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    greedy: true
  },
  'tag': {
    pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    greedy: true,
    inside: {
      'tag': {
        pattern: /^<\/?[^\s>\/]+/,
        inside: {
          'punctuation': /^<\/?/,
          'namespace': /^[^\s>\/:]+:/
        }
      },
      'special-attr': [],
      'attr-value': {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
        inside: {
          'punctuation': [
            {
              pattern: /^=/,
              alias: 'attr-equals'
            },
            {
              pattern: /^(\s*)["']|["']$/,
              lookbehind: true
            }
          ]
        }
      },
      'punctuation': /\/?>/,
      'attr-name': {
        pattern: /[^\s>\/]+/,
        inside: {
          'namespace': /^[^\s>\/:]+:/
        }
      }

    }
  },
  'entity': [
    {
      pattern: /&[\da-z]{1,8};/i,
      alias: 'named-entity'
    },
    /&#x?[\da-f]{1,8};/i
  ]
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
  Prism.languages.markup['entity'];
Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function (env) {

  if (env.type === 'entity') {
    env.attributes['title'] = env.content.replace(/&amp;/, '&');
  }
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
  /**
   * Adds an inlined language to markup.
   *
   * An example of an inlined language is CSS with `<style>` tags.
   *
   * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
   * case insensitive.
   * @param {string} lang The language key.
   * @example
   * addInlined('style', 'css');
   */
  value: function addInlined(tagName, lang) {
    var includedCdataInside = {};
    includedCdataInside['language-' + lang] = {
      pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
      lookbehind: true,
      inside: Prism.languages[lang]
    };
    includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

    var inside = {
      'included-cdata': {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        inside: includedCdataInside
      }
    };
    inside['language-' + lang] = {
      pattern: /[\s\S]+/,
      inside: Prism.languages[lang]
    };

    var def = {};
    def[tagName] = {
      pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
      lookbehind: true,
      greedy: true,
      inside: inside
    };

    Prism.languages.insertBefore('markup', 'cdata', def);
  }
});
Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
  /**
   * Adds an pattern to highlight languages embedded in HTML attributes.
   *
   * An example of an inlined language is CSS with `style` attributes.
   *
   * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
   * case insensitive.
   * @param {string} lang The language key.
   * @example
   * addAttribute('style', 'css');
   */
  value: function (attrName, lang) {
    Prism.languages.markup.tag.inside['special-attr'].push({
      pattern: RegExp(
        /(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
        'i'
      ),
      lookbehind: true,
      inside: {
        'attr-name': /^[^\s=]+/,
        'attr-value': {
          pattern: /=[\s\S]+/,
          inside: {
            'value': {
              pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
              lookbehind: true,
              alias: [lang, 'language-' + lang],
              inside: Prism.languages[lang]
            },
            'punctuation': [
              {
                pattern: /^=/,
                alias: 'attr-equals'
              },
              /"|'/
            ]
          }
        }
      }
    });
  }
});

Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;
Prism.languages.vue = Prism.languages.markup;

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.ssml = Prism.languages.xml;
Prism.languages.atom = Prism.languages.xml;
Prism.languages.rss = Prism.languages.xml;

(function (Prism) {

  var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

  Prism.languages.css = {
    'comment': /\/\*[\s\S]*?\*\//,
    'atrule': {
      pattern: RegExp('@[\\w-](?:' + /[^;{\s"']|\s+(?!\s)/.source + '|' + string.source + ')*?' + /(?:;|(?=\s*\{))/.source),
      inside: {
        'rule': /^@[\w-]+/,
        'selector-function-argument': {
          pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
          lookbehind: true,
          alias: 'selector'
        },
        'keyword': {
          pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
          lookbehind: true
        }
        // See rest below
      }
    },
    'url': {
      // https://drafts.csswg.org/css-values-3/#urls
      pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
      greedy: true,
      inside: {
        'function': /^url/i,
        'punctuation': /^\(|\)$/,
        'string': {
          pattern: RegExp('^' + string.source + '$'),
          alias: 'url'
        }
      }
    },
    'selector': {
      pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
      lookbehind: true
    },
    'string': {
      pattern: string,
      greedy: true
    },
    'property': {
      pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
      lookbehind: true
    },
    'important': /!important\b/i,
    'function': {
      pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
      lookbehind: true
    },
    'punctuation': /[(){};:,]/
  };

  Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

  var markup = Prism.languages.markup;
  if (markup) {
    markup.tag.addInlined('style', 'css');
    markup.tag.addAttribute('style', 'css');
  }

}(Prism));

Prism.languages.clike = {
  'comment': [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
      lookbehind: true,
      greedy: true
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: true,
      greedy: true
    }
  ],
  'string': {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  'class-name': {
    pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
    lookbehind: true,
    inside: {
      'punctuation': /[.\\]/
    }
  },
  'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
  'boolean': /\b(?:false|true)\b/,
  'function': /\b\w+(?=\()/,
  'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
  'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
  'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
  'class-name': [
    Prism.languages.clike['class-name'],
    {
      pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
      lookbehind: true
    }
  ],
  'keyword': [
    {
      pattern: /((?:^|\})\s*)catch\b/,
      lookbehind: true
    },
    {
      pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
      lookbehind: true
    },
  ],
  // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
  'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
  'number': {
    pattern: RegExp(
      /(^|[^\w$])/.source +
      '(?:' +
      (
        // eslint-disable-next-line indent
        /NaN|Infinity/.source +
        '|' +
        // binary integer
        /0[bB][01]+(?:_[01]+)*n?/.source +
        '|' +
        // octal integer
        /0[oO][0-7]+(?:_[0-7]+)*n?/.source +
        '|' +
        // hexadecimal integer
        /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
        '|' +
        // decimal bigint
        /\d+(?:_\d+)*n/.source +
        '|' +
        // decimal number (integer or float) but no bigint
        /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
      ) +
      ')' +
      /(?![\w$])/.source
    ),
    lookbehind: true
  },
  'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
  'regex': {
    pattern: RegExp(
      // lookbehind
      /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
      // Regex pattern:
      // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
      // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
      // with the only syntax, so we have to define 2 different regex patterns.
      /\//.source +
      '(?:' +
      /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source +
      '|' +
      // `v` flag syntax. This supports 3 levels of nested character classes.
      /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source +
      ')' +
      // lookahead
      /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
    ),
    lookbehind: true,
    greedy: true,
    inside: {
      'regex-source': {
        pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
        lookbehind: true,
        alias: 'language-regex',
        inside: Prism.languages.regex
      },
      'regex-delimiter': /^\/|\/$/,
      'regex-flags': /^[a-z]+$/,
    }
  },
  // This must be declared before keyword because we use "function" inside the look-forward
  'function-variable': {
    pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
    alias: 'function'
  },
  'parameter': [
    {
      pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
      lookbehind: true,
      inside: Prism.languages.javascript
    },
    {
      pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
      lookbehind: true,
      inside: Prism.languages.javascript
    },
    {
      pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
      lookbehind: true,
      inside: Prism.languages.javascript
    },
    {
      pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
      lookbehind: true,
      inside: Prism.languages.javascript
    }
  ],
  'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
  'hashbang': {
    pattern: /^#!.*/,
    greedy: true,
    alias: 'comment'
  },
  'template-string': {
    pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
    greedy: true,
    inside: {
      'template-punctuation': {
        pattern: /^`|`$/,
        alias: 'string'
      },
      'interpolation': {
        pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
        lookbehind: true,
        inside: {
          'interpolation-punctuation': {
            pattern: /^\$\{|\}$/,
            alias: 'punctuation'
          },
          rest: Prism.languages.javascript
        }
      },
      'string': /[\s\S]+/
    }
  },
  'string-property': {
    pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
    lookbehind: true,
    greedy: true,
    alias: 'property'
  }
});

Prism.languages.insertBefore('javascript', 'operator', {
  'literal-property': {
    pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
    lookbehind: true,
    alias: 'property'
  },
});

if (Prism.languages.markup) {
  Prism.languages.markup.tag.addInlined('script', 'javascript');

  // add attribute support for all DOM events.
  // https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
  Prism.languages.markup.tag.addAttribute(
    /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
    'javascript'
  );
}

Prism.languages.js = Prism.languages.javascript;

// https://www.json.org/json-en.html
Prism.languages.json = {
  'property': {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
    lookbehind: true,
    greedy: true
  },
  'string': {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
    lookbehind: true,
    greedy: true
  },
  'comment': {
    pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
    greedy: true
  },
  'number': /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
  'punctuation': /[{}[\],]/,
  'operator': /:/,
  'boolean': /\b(?:false|true)\b/,
  'null': {
    pattern: /\bnull\b/,
    alias: 'keyword'
  }
};

Prism.languages.webmanifest = Prism.languages.json;

(function (Prism) {

  /**
   * Returns the placeholder for the given language id and index.
   *
   * @param {string} language
   * @param {string|number} index
   * @returns {string}
   */
  function getPlaceholder(language, index) {
    return '___' + language.toUpperCase() + index + '___';
  }

  Object.defineProperties(Prism.languages['markup-templating'] = {}, {
    buildPlaceholders: {
      /**
       * Tokenize all inline templating expressions matching `placeholderPattern`.
       *
       * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
       * `true` will be replaced.
       *
       * @param {object} env The environment of the `before-tokenize` hook.
       * @param {string} language The language id.
       * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
       * @param {(match: string) => boolean} [replaceFilter]
       */
      value: function (env, language, placeholderPattern, replaceFilter) {
        if (env.language !== language) {
          return;
        }

        var tokenStack = env.tokenStack = [];

        env.code = env.code.replace(placeholderPattern, function (match) {
          if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
            return match;
          }
          var i = tokenStack.length;
          var placeholder;

          // Check for existing strings
          while (env.code.indexOf(placeholder = getPlaceholder(language, i)) !== -1) {
            ++i;
          }

          // Create a sparse array
          tokenStack[i] = match;

          return placeholder;
        });

        // Switch the grammar to markup
        env.grammar = Prism.languages.markup;
      }
    },
    tokenizePlaceholders: {
      /**
       * Replace placeholders with proper tokens after tokenizing.
       *
       * @param {object} env The environment of the `after-tokenize` hook.
       * @param {string} language The language id.
       */
      value: function (env, language) {
        if (env.language !== language || !env.tokenStack) {
          return;
        }

        // Switch the grammar back
        env.grammar = Prism.languages[language];

        var j = 0;
        var keys = Object.keys(env.tokenStack);

        function walkTokens(tokens) {
          for (var i = 0; i < tokens.length; i++) {
            // all placeholders are replaced already
            if (j >= keys.length) {
              break;
            }

            var token = tokens[i];
            if (typeof token === 'string' || (token.content && typeof token.content === 'string')) {
              var k = keys[j];
              var t = env.tokenStack[k];
              var s = typeof token === 'string' ? token : token.content;
              var placeholder = getPlaceholder(language, k);

              var index = s.indexOf(placeholder);
              if (index > -1) {
                ++j;

                var before = s.substring(0, index);
                var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), 'language-' + language, t);
                var after = s.substring(index + placeholder.length);

                var replacement = [];
                if (before) {
                  replacement.push.apply(replacement, walkTokens([before]));
                }
                replacement.push(middle);
                if (after) {
                  replacement.push.apply(replacement, walkTokens([after]));
                }

                if (typeof token === 'string') {
                  tokens.splice.apply(tokens, [i, 1].concat(replacement));
                } else {
                  token.content = replacement;
                }
              }
            } else if (token.content /* && typeof token.content !== 'string' */) {
              walkTokens(token.content);
            }
          }

          return tokens;
        }

        walkTokens(env.tokens);
      }
    }
  });

}(Prism));

/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 * Rewritten by Tom Pavelec
 *
 * Supports PHP 5.3 - 8.0
 */
(function (Prism) {
  var comment = /\/\*[\s\S]*?\*\/|\/\/.*|#(?!\[).*/;
  var constant = [
    {
      pattern: /\b(?:false|true)\b/i,
      alias: 'boolean'
    },
    {
      pattern: /(::\s*)\b[a-z_]\w*\b(?!\s*\()/i,
      greedy: true,
      lookbehind: true,
    },
    {
      pattern: /(\b(?:case|const)\s+)\b[a-z_]\w*(?=\s*[;=])/i,
      greedy: true,
      lookbehind: true,
    },
    /\b(?:null)\b/i,
    /\b[A-Z_][A-Z0-9_]*\b(?!\s*\()/,
  ];
  var number = /\b0b[01]+(?:_[01]+)*\b|\b0o[0-7]+(?:_[0-7]+)*\b|\b0x[\da-f]+(?:_[\da-f]+)*\b|(?:\b\d+(?:_\d+)*\.?(?:\d+(?:_\d+)*)?|\B\.\d+)(?:e[+-]?\d+)?/i;
  var operator = /<?=>|\?\?=?|\.{3}|\??->|[!=]=?=?|::|\*\*=?|--|\+\+|&&|\|\||<<|>>|[?~]|[/^|%*&<>.+-]=?/;
  var punctuation = /[{}\[\](),:;]/;

  Prism.languages.php = {
    'delimiter': {
      pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
      alias: 'important'
    },
    'comment': comment,
    'variable': /\$+(?:\w+\b|(?=\{))/,
    'package': {
      pattern: /(namespace\s+|use\s+(?:function\s+)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
      lookbehind: true,
      inside: {
        'punctuation': /\\/
      }
    },
    'class-name-definition': {
      pattern: /(\b(?:class|enum|interface|trait)\s+)\b[a-z_]\w*(?!\\)\b/i,
      lookbehind: true,
      alias: 'class-name'
    },
    'function-definition': {
      pattern: /(\bfunction\s+)[a-z_]\w*(?=\s*\()/i,
      lookbehind: true,
      alias: 'function'
    },
    'keyword': [
      {
        pattern: /(\(\s*)\b(?:array|bool|boolean|float|int|integer|object|string)\b(?=\s*\))/i,
        alias: 'type-casting',
        greedy: true,
        lookbehind: true
      },
      {
        pattern: /([(,?]\s*)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|object|self|static|string)\b(?=\s*\$)/i,
        alias: 'type-hint',
        greedy: true,
        lookbehind: true
      },
      {
        pattern: /(\)\s*:\s*(?:\?\s*)?)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|never|object|self|static|string|void)\b/i,
        alias: 'return-type',
        greedy: true,
        lookbehind: true
      },
      {
        pattern: /\b(?:array(?!\s*\()|bool|float|int|iterable|mixed|object|string|void)\b/i,
        alias: 'type-declaration',
        greedy: true
      },
      {
        pattern: /(\|\s*)(?:false|null)\b|\b(?:false|null)(?=\s*\|)/i,
        alias: 'type-declaration',
        greedy: true,
        lookbehind: true
      },
      {
        pattern: /\b(?:parent|self|static)(?=\s*::)/i,
        alias: 'static-context',
        greedy: true
      },
      {
        // yield from
        pattern: /(\byield\s+)from\b/i,
        lookbehind: true
      },
      // `class` is always a keyword unlike other keywords
      /\bclass\b/i,
      {
        // https://www.php.net/manual/en/reserved.keywords.php
        //
        // keywords cannot be preceded by "->"
        // the complex lookbehind means `(?<!(?:->|::)\s*)`
        pattern: /((?:^|[^\s>:]|(?:^|[^-])>|(?:^|[^:]):)\s*)\b(?:abstract|and|array|as|break|callable|case|catch|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|never|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield|__halt_compiler)\b/i,
        lookbehind: true
      }
    ],
    'argument-name': {
      pattern: /([(,]\s*)\b[a-z_]\w*(?=\s*:(?!:))/i,
      lookbehind: true
    },
    'class-name': [
      {
        pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self|\s+static))\s+|\bcatch\s*\()\b[a-z_]\w*(?!\\)\b/i,
        greedy: true,
        lookbehind: true
      },
      {
        pattern: /(\|\s*)\b[a-z_]\w*(?!\\)\b/i,
        greedy: true,
        lookbehind: true
      },
      {
        pattern: /\b[a-z_]\w*(?!\\)\b(?=\s*\|)/i,
        greedy: true
      },
      {
        pattern: /(\|\s*)(?:\\?\b[a-z_]\w*)+\b/i,
        alias: 'class-name-fully-qualified',
        greedy: true,
        lookbehind: true,
        inside: {
          'punctuation': /\\/
        }
      },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+\b(?=\s*\|)/i,
        alias: 'class-name-fully-qualified',
        greedy: true,
        inside: {
          'punctuation': /\\/
        }
      },
      {
        pattern: /(\b(?:extends|implements|instanceof|new(?!\s+self\b|\s+static\b))\s+|\bcatch\s*\()(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
        alias: 'class-name-fully-qualified',
        greedy: true,
        lookbehind: true,
        inside: {
          'punctuation': /\\/
        }
      },
      {
        pattern: /\b[a-z_]\w*(?=\s*\$)/i,
        alias: 'type-declaration',
        greedy: true
      },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
        alias: ['class-name-fully-qualified', 'type-declaration'],
        greedy: true,
        inside: {
          'punctuation': /\\/
        }
      },
      {
        pattern: /\b[a-z_]\w*(?=\s*::)/i,
        alias: 'static-context',
        greedy: true
      },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*::)/i,
        alias: ['class-name-fully-qualified', 'static-context'],
        greedy: true,
        inside: {
          'punctuation': /\\/
        }
      },
      {
        pattern: /([(,?]\s*)[a-z_]\w*(?=\s*\$)/i,
        alias: 'type-hint',
        greedy: true,
        lookbehind: true
      },
      {
        pattern: /([(,?]\s*)(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
        alias: ['class-name-fully-qualified', 'type-hint'],
        greedy: true,
        lookbehind: true,
        inside: {
          'punctuation': /\\/
        }
      },
      {
        pattern: /(\)\s*:\s*(?:\?\s*)?)\b[a-z_]\w*(?!\\)\b/i,
        alias: 'return-type',
        greedy: true,
        lookbehind: true
      },
      {
        pattern: /(\)\s*:\s*(?:\?\s*)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
        alias: ['class-name-fully-qualified', 'return-type'],
        greedy: true,
        lookbehind: true,
        inside: {
          'punctuation': /\\/
        }
      }
    ],
    'constant': constant,
    'function': {
      pattern: /(^|[^\\\w])\\?[a-z_](?:[\w\\]*\w)?(?=\s*\()/i,
      lookbehind: true,
      inside: {
        'punctuation': /\\/
      }
    },
    'property': {
      pattern: /(->\s*)\w+/,
      lookbehind: true
    },
    'number': number,
    'operator': operator,
    'punctuation': punctuation
  };

  var string_interpolation = {
    pattern: /\{\$(?:\{(?:\{[^{}]+\}|[^{}]+)\}|[^{}])+\}|(^|[^\\{])\$+(?:\w+(?:\[[^\r\n\[\]]+\]|->\w+)?)/,
    lookbehind: true,
    inside: Prism.languages.php
  };

  var string = [
    {
      pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/,
      alias: 'nowdoc-string',
      greedy: true,
      inside: {
        'delimiter': {
          pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
          alias: 'symbol',
          inside: {
            'punctuation': /^<<<'?|[';]$/
          }
        }
      }
    },
    {
      pattern: /<<<(?:"([^"]+)"[\r\n](?:.*[\r\n])*?\1;|([a-z_]\w*)[\r\n](?:.*[\r\n])*?\2;)/i,
      alias: 'heredoc-string',
      greedy: true,
      inside: {
        'delimiter': {
          pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
          alias: 'symbol',
          inside: {
            'punctuation': /^<<<"?|[";]$/
          }
        },
        'interpolation': string_interpolation
      }
    },
    {
      pattern: /`(?:\\[\s\S]|[^\\`])*`/,
      alias: 'backtick-quoted-string',
      greedy: true
    },
    {
      pattern: /'(?:\\[\s\S]|[^\\'])*'/,
      alias: 'single-quoted-string',
      greedy: true
    },
    {
      pattern: /"(?:\\[\s\S]|[^\\"])*"/,
      alias: 'double-quoted-string',
      greedy: true,
      inside: {
        'interpolation': string_interpolation
      }
    }
  ];

  Prism.languages.insertBefore('php', 'variable', {
    'string': string,
    'attribute': {
      pattern: /#\[(?:[^"'\/#]|\/(?![*/])|\/\/.*$|#(?!\[).*$|\/\*(?:[^*]|\*(?!\/))*\*\/|"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*')+\](?=\s*[a-z$#])/im,
      greedy: true,
      inside: {
        'attribute-content': {
          pattern: /^(#\[)[\s\S]+(?=\]$)/,
          lookbehind: true,
          // inside can appear subset of php
          inside: {
            'comment': comment,
            'string': string,
            'attribute-class-name': [
              {
                pattern: /([^:]|^)\b[a-z_]\w*(?!\\)\b/i,
                alias: 'class-name',
                greedy: true,
                lookbehind: true
              },
              {
                pattern: /([^:]|^)(?:\\?\b[a-z_]\w*)+/i,
                alias: [
                  'class-name',
                  'class-name-fully-qualified'
                ],
                greedy: true,
                lookbehind: true,
                inside: {
                  'punctuation': /\\/
                }
              }
            ],
            'constant': constant,
            'number': number,
            'operator': operator,
            'punctuation': punctuation
          }
        },
        'delimiter': {
          pattern: /^#\[|\]$/,
          alias: 'punctuation'
        }
      }
    },
  });

  Prism.hooks.add('before-tokenize', function (env) {
    if (!/<\?/.test(env.code)) {
      return;
    }

    var phpPattern = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#(?!\[))(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|#\[|\/\*(?:[^*]|\*(?!\/))*(?:\*\/|$))*?(?:\?>|$)/g;
    Prism.languages['markup-templating'].buildPlaceholders(env, 'php', phpPattern);
  });

  Prism.hooks.add('after-tokenize', function (env) {
    Prism.languages['markup-templating'].tokenizePlaceholders(env, 'php');
  });

}(Prism));

Prism.languages.python = {
  'comment': {
    pattern: /(^|[^\\])#.*/,
    lookbehind: true,
    greedy: true
  },
  'string-interpolation': {
    pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
    greedy: true,
    inside: {
      'interpolation': {
        // "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
        pattern: /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
        lookbehind: true,
        inside: {
          'format-spec': {
            pattern: /(:)[^:(){}]+(?=\}$)/,
            lookbehind: true
          },
          'conversion-option': {
            pattern: /![sra](?=[:}]$)/,
            alias: 'punctuation'
          },
          rest: null
        }
      },
      'string': /[\s\S]+/
    }
  },
  'triple-quoted-string': {
    pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
    greedy: true,
    alias: 'string'
  },
  'string': {
    pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
    greedy: true
  },
  'function': {
    pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
    lookbehind: true
  },
  'class-name': {
    pattern: /(\bclass\s+)\w+/i,
    lookbehind: true
  },
  'decorator': {
    pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
    lookbehind: true,
    alias: ['annotation', 'punctuation'],
    inside: {
      'punctuation': /\./
    }
  },
  'keyword': /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
  'builtin': /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
  'boolean': /\b(?:False|None|True)\b/,
  'number': /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
  'operator': /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
  'punctuation': /[{}[\];(),.:]/
};

Prism.languages.python['string-interpolation'].inside['interpolation'].inside.rest = Prism.languages.python;

Prism.languages.py = Prism.languages.python;
(function (Prism) {
  // $ set | grep '^[A-Z][^[:space:]]*=' | cut -d= -f1 | tr '\n' '|'
  // + LC_ALL, RANDOM, REPLY, SECONDS.
  // + make sure PS1..4 are here as they are not always set,
  // - some useless things.
  var envVars = '\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b';

  var commandAfterHeredoc = {
    pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
    lookbehind: true,
    alias: 'punctuation', // this looks reasonably well in all themes
    inside: null // see below
  };

  var insideString = {
    'bash': commandAfterHeredoc,
    'environment': {
      pattern: RegExp('\\$' + envVars),
      alias: 'constant'
    },
    'variable': [
      // [0]: Arithmetic Environment
      {
        pattern: /\$?\(\([\s\S]+?\)\)/,
        greedy: true,
        inside: {
          // If there is a $ sign at the beginning highlight $(( and )) as variable
          'variable': [
            {
              pattern: /(^\$\(\([\s\S]+)\)\)/,
              lookbehind: true
            },
            /^\$\(\(/
          ],
          'number': /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
          // Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
          'operator': /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
          // If there is no $ sign at the beginning highlight (( and )) as punctuation
          'punctuation': /\(\(?|\)\)?|,|;/
        }
      },
      // [1]: Command Substitution
      {
        pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
        greedy: true,
        inside: {
          'variable': /^\$\(|^`|\)$|`$/
        }
      },
      // [2]: Brace expansion
      {
        pattern: /\$\{[^}]+\}/,
        greedy: true,
        inside: {
          'operator': /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
          'punctuation': /[\[\]]/,
          'environment': {
            pattern: RegExp('(\\{)' + envVars),
            lookbehind: true,
            alias: 'constant'
          }
        }
      },
      /\$(?:\w+|[#?*!@$])/
    ],
    // Escape sequences from echo and printf's manuals, and escaped quotes.
    'entity': /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/
  };

  Prism.languages.bash = {
    'shebang': {
      pattern: /^#!\s*\/.*/,
      alias: 'important'
    },
    'comment': {
      pattern: /(^|[^"{\\$])#.*/,
      lookbehind: true
    },
    'function-name': [
      // a) function foo {
      // b) foo() {
      // c) function foo() {
      // but not “foo {”
      {
        // a) and c)
        pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,
        lookbehind: true,
        alias: 'function'
      },
      {
        // b)
        pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/,
        alias: 'function'
      }
    ],
    // Highlight variable names as variables in for and select beginnings.
    'for-or-select': {
      pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
      alias: 'variable',
      lookbehind: true
    },
    // Highlight variable names as variables in the left-hand part
    // of assignments (“=” and “+=”).
    'assign-left': {
      pattern: /(^|[\s;|&]|[<>]\()\w+(?:\.\w+)*(?=\+?=)/,
      inside: {
        'environment': {
          pattern: RegExp('(^|[\\s;|&]|[<>]\\()' + envVars),
          lookbehind: true,
          alias: 'constant'
        }
      },
      alias: 'variable',
      lookbehind: true
    },
    // Highlight parameter names as variables
    'parameter': {
      pattern: /(^|\s)-{1,2}(?:\w+:[+-]?)?\w+(?:\.\w+)*(?=[=\s]|$)/,
      alias: 'variable',
      lookbehind: true
    },
    'string': [
      // Support for Here-documents https://en.wikipedia.org/wiki/Here_document
      {
        pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
        lookbehind: true,
        greedy: true,
        inside: insideString
      },
      // Here-document with quotes around the tag
      // → No expansion (so no “inside”).
      {
        pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
        lookbehind: true,
        greedy: true,
        inside: {
          'bash': commandAfterHeredoc
        }
      },
      // “Normal” string
      {
        // https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html
        pattern: /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
        lookbehind: true,
        greedy: true,
        inside: insideString
      },
      {
        // https://www.gnu.org/software/bash/manual/html_node/Single-Quotes.html
        pattern: /(^|[^$\\])'[^']*'/,
        lookbehind: true,
        greedy: true
      },
      {
        // https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
        pattern: /\$'(?:[^'\\]|\\[\s\S])*'/,
        greedy: true,
        inside: {
          'entity': insideString.entity
        }
      }
    ],
    'environment': {
      pattern: RegExp('\\$?' + envVars),
      alias: 'constant'
    },
    'variable': insideString.variable,
    'function': {
      pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cargo|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|java|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|sysctl|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    'keyword': {
      pattern: /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    // https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
    'builtin': {
      pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
      lookbehind: true,
      // Alias added to make those easier to distinguish from strings.
      alias: 'class-name'
    },
    'boolean': {
      pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    'file-descriptor': {
      pattern: /\B&\d\b/,
      alias: 'important'
    },
    'operator': {
      // Lots of redirections here, but not just that.
      pattern: /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
      inside: {
        'file-descriptor': {
          pattern: /^\d/,
          alias: 'important'
        }
      }
    },
    'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
    'number': {
      pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
      lookbehind: true
    }
  };

  commandAfterHeredoc.inside = Prism.languages.bash;

  /* Patterns in command substitution. */
  var toBeCopied = [
    'comment',
    'function-name',
    'for-or-select',
    'assign-left',
    'parameter',
    'string',
    'environment',
    'function',
    'keyword',
    'builtin',
    'boolean',
    'file-descriptor',
    'operator',
    'punctuation',
    'number'
  ];
  var inside = insideString.variable[1].inside;
  for (var i = 0; i < toBeCopied.length; i++) {
    inside[toBeCopied[i]] = Prism.languages.bash[toBeCopied[i]];
  }

  Prism.languages.sh = Prism.languages.bash;
  Prism.languages.shell = Prism.languages.bash;
}(Prism));
(function (Prism) {

  /**
   * @param {string} name
   * @returns {RegExp}
   */
  function headerValueOf(name) {
    return RegExp('(^(?:' + name + '):[ \t]*(?![ \t]))[^]+', 'i');
  }

  Prism.languages.http = {
    'request-line': {
      pattern: /^(?:CONNECT|DELETE|GET|HEAD|OPTIONS|PATCH|POST|PRI|PUT|SEARCH|TRACE)\s(?:https?:\/\/|\/)\S*\sHTTP\/[\d.]+/m,
      inside: {
        // HTTP Method
        'method': {
          pattern: /^[A-Z]+\b/,
          alias: 'property'
        },
        // Request Target e.g. http://example.com, /path/to/file
        'request-target': {
          pattern: /^(\s)(?:https?:\/\/|\/)\S*(?=\s)/,
          lookbehind: true,
          alias: 'url',
          inside: Prism.languages.uri
        },
        // HTTP Version
        'http-version': {
          pattern: /^(\s)HTTP\/[\d.]+/,
          lookbehind: true,
          alias: 'property'
        },
      }
    },
    'response-status': {
      pattern: /^HTTP\/[\d.]+ \d+ .+/m,
      inside: {
        // HTTP Version
        'http-version': {
          pattern: /^HTTP\/[\d.]+/,
          alias: 'property'
        },
        // Status Code
        'status-code': {
          pattern: /^(\s)\d+(?=\s)/,
          lookbehind: true,
          alias: 'number'
        },
        // Reason Phrase
        'reason-phrase': {
          pattern: /^(\s).+/,
          lookbehind: true,
          alias: 'string'
        }
      }
    },
    'header': {
      pattern: /^[\w-]+:.+(?:(?:\r\n?|\n)[ \t].+)*/m,
      inside: {
        'header-value': [
          {
            pattern: headerValueOf(/Content-Security-Policy/.source),
            lookbehind: true,
            alias: ['csp', 'languages-csp'],
            inside: Prism.languages.csp
          },
          {
            pattern: headerValueOf(/Public-Key-Pins(?:-Report-Only)?/.source),
            lookbehind: true,
            alias: ['hpkp', 'languages-hpkp'],
            inside: Prism.languages.hpkp
          },
          {
            pattern: headerValueOf(/Strict-Transport-Security/.source),
            lookbehind: true,
            alias: ['hsts', 'languages-hsts'],
            inside: Prism.languages.hsts
          },
          {
            pattern: headerValueOf(/[^:]+/.source),
            lookbehind: true
          }
        ],
        'header-name': {
          pattern: /^[^:]+/,
          alias: 'keyword'
        },
        'punctuation': /^:/
      }
    }
  };

  // Create a mapping of Content-Type headers to language definitions
  var langs = Prism.languages;
  var httpLanguages = {
    'application/javascript': langs.javascript,
    'application/json': langs.json || langs.javascript,
    'application/xml': langs.xml,
    'text/xml': langs.xml,
    'text/html': langs.html,
    'text/css': langs.css,
    'text/plain': langs.plain
  };

  // Declare which types can also be suffixes
  var suffixTypes = {
    'application/json': true,
    'application/xml': true
  };

  /**
   * Returns a pattern for the given content type which matches it and any type which has it as a suffix.
   *
   * @param {string} contentType
   * @returns {string}
   */
  function getSuffixPattern(contentType) {
    var suffix = contentType.replace(/^[a-z]+\//, '');
    var suffixPattern = '\\w+/(?:[\\w.-]+\\+)+' + suffix + '(?![+\\w.-])';
    return '(?:' + contentType + '|' + suffixPattern + ')';
  }

  // Insert each content type parser that has its associated language
  // currently loaded.
  var options;
  for (var contentType in httpLanguages) {
    if (httpLanguages[contentType]) {
      options = options || {};

      var pattern = suffixTypes[contentType] ? getSuffixPattern(contentType) : contentType;
      options[contentType.replace(/\//g, '-')] = {
        pattern: RegExp(
          '(' + /content-type:\s*/.source + pattern + /(?:(?:\r\n?|\n)[\w-].*)*(?:\r(?:\n|(?!\n))|\n)/.source + ')' +
          // This is a little interesting:
          // The HTTP format spec required 1 empty line before the body to make everything unambiguous.
          // However, when writing code by hand (e.g. to display on a website) people can forget about this,
          // so we want to be liberal here. We will allow the empty line to be omitted if the first line of
          // the body does not start with a [\w-] character (as headers do).
          /[^ \t\w-][\s\S]*/.source,
          'i'
        ),
        lookbehind: true,
        inside: httpLanguages[contentType]
      };
    }
  }
  if (options) {
    Prism.languages.insertBefore('http', 'header', options);
  }

}(Prism));

/// endregion prismjs

/* global document window navigator */
!function () {
  /// region top-level vars
  // noinspection ES6ConvertVarToLetConst
  var htabs, desktops, mobiles, len, i, j, htab, links, a,
    // yari new compatibility table
    newTables, status = null,
    // yari expandable top menu
    pageHeader, menuToggleBtn, pageHeaderMain, toggleSearchBtn,
    // yari main-menu nojs
    mainMenuNoJs,
    // yari search box on main page
    searchBox,
    // yari theme menu
    themeBtn, themeMenu, currentTheme,
    // yari mobile left sidebar
    sidebarBtn, sidebarContainer, sidebarCurrentElem,
    // yari mask-image to background fix
    linkCss, linkPreload;

  /// endregion top-level vars

  /// region class utils
  /**
   * @param {Element} elem
   * @param {string} className
   * @return {void}
   */
  function addClass(elem, className) {
    if ('classList' in elem && typeof elem.classList.add === 'function') {
      elem.classList.add(className);
      return;
    }
    // noinspection ES6ConvertVarToLetConst
    var classes = elem.className.split(/\s+/), i;
    for (i = 0; i < classes.length; i++) {
      if (classes[i] === className) {
        return;
      }
    }
    elem.setAttribute('class',
      elem.className + ' ' + className);
  }

  /**
   * @param {Element} elem
   * @param {string} className
   * @return {void}
   */
  function removeClass(elem, className) {
    if ('classList' in elem && typeof elem.classList.remove === 'function') {
      elem.classList.remove(className);
      return;
    }
    // noinspection ES6ConvertVarToLetConst
    var classes = elem.className.split(/\s+/), copy = [], i, j = 0;
    for (i = 0; i < classes.length; i++) {
      if (classes[i] !== className) {
        copy[j++] = classes[i];
      }
    }
    if (copy.length < classes.length) {
      elem.setAttribute('class', copy.join(' '));
    }
  }

  /**
   * @param {Element} elem
   * @param {string} className
   * @return {boolean}
   */
  function hasClass(elem, className) {
    if ('classList' in elem && typeof elem.classList.contains === 'function') {
      return elem.classList.contains(className);
    }
    // noinspection ES6ConvertVarToLetConst
    var classes = elem.className.split(/\s+/), i;
    for (i = 0; i < classes.length; i++) {
      if (classes[i] === className) {
        return true;
      }
    }
    return false;
  }
  /// endregion class utils

  /// region old compatibility table
  // old compatibility table script, missing from official site
  // implemented with pure js
  // noinspection ES6ConvertVarToLetConst
  htabs = 'getElementsByClassName' in document ?
    document.getElementsByClassName('htab') :
    document.querySelectorAll('.htab');
  desktops = document.querySelectorAll('div[id=compat-desktop]');
  mobiles = document.querySelectorAll('div[id=compat-mobile]');
  len = htabs.length;

  function changeTabListener(e) {
    // noinspection JSDeprecatedSymbols
    e = e || window.event;
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    // noinspection ES6ConvertVarToLetConst
    var li, ul, i, index, selfIndex, elems, tab;
    if (!(li = this.parentNode)) return false;
    if ((ul = li.parentNode)) {
      index = 0;
      elems = ul.childNodes;
      for (i = 0; i < elems.length; i++) {
        if (elems[i].tagName !== 'LI') {
          continue;
        }
        if (elems[i] === li) {
          selfIndex = index;
          addClass(elems[i], 'selected');
        } else {
          removeClass(elems[i], 'selected');
        }
        ++index;
      }
    }
    if ((tab = ul.parentNode)) {
      index = 0;
      elems = tab.childNodes;
      for (i = 0; i < elems.length; i++) {
        if (elems[i].tagName !== 'DIV') {
          continue;
        }
        if (index++ === selfIndex) {
          elems[i].style.display = '';
        } else {
          elems[i].style.display = 'none';
        }
      }
    }
  }

  for (i = 0; i < len; i++) {
    htab = htabs[i];
    links = htab.querySelectorAll('ul>li>a');
    if (desktops[i]) {
      // noinspection JSCheckFunctionSignatures
      htab.appendChild(desktops[i]);
    }
    if (mobiles[i]) {
      // noinspection JSCheckFunctionSignatures
      htab.appendChild(mobiles[i]);
    }
    for (j = 0; j < links.length; j++) {
      a = links[j];
      a.onclick = changeTabListener;
      if (j === 0) {
        changeTabListener.call(a);
      }
    }
  }
  /// endregion old compatibility table

  /// region yari new compatibility table
  // https://github.com/website-local/mdn-local/issues/630
  newTables ='getElementsByClassName' in document ?
    document.getElementsByClassName('bc-table') :
    document.querySelectorAll('.bc-table');
  len = newTables.length;
  for (i = 0; i < len; i++) {
    newTables[i].onclick = browserCompatibilityTableClickListener;
  }

  function browserCompatibilityTableClickListener(e) {
    // noinspection JSDeprecatedSymbols
    e = e || window.event;
    // noinspection ES6ConvertVarToLetConst
    var node, td, button, onToggle, index, i, tr, table, closeTd, section;
    // noinspection JSDeprecatedSymbols
    node = e.target || e.srcElement;
    if (node.tagName === 'TD') {
      td = node;
    } else {
      while (node && (node = node.parentNode)) {
        if (node.tagName === 'TD') {
          td = node;
          break;
        }
      }
    }
    if (!td) return;
    // td.classList.contains('bc-has-history')
    if (!hasClass(td, 'bc-has-history')) {
      return;
    }
    onToggle = td.getAttribute('data-on-toggle');
    if (!onToggle) return;
    onToggle = onToggle.split(',');
    index = onToggle[0];
    i = onToggle[1];
    node = td;
    while (node && (node = node.parentNode)) {
      if (node.tagName === 'TABLE') {
        table = node;
        break;
      }
    }
    if (!table) return;
    if (status !== null) {
      closeHistory();
      if (index === status[0] && i === status[1]) {
        status = null;
        return;
      }
    }
    status = onToggle;
    td.setAttribute('aria-expanded', 'true');
    // this might be removed
    button = td.querySelector('.bc-history-link');
    if (button) {
      addClass(button, 'bc-history-link-inverse');
    }
    section = td.querySelector('.bc-notes-list');
    if (section) {
      removeClass(section, 'bc-hidden');
    }
    tr = table.querySelector('tr.bc-history[key="' + status[0] + '"]');
    if (tr) {
      removeClass(tr, 'bc-hidden');
      node = tr.querySelector('.bc-notes-list');
      if (node && section) {
        node.innerHTML = section.innerHTML;
      }
    }

    function closeHistory() {
      if (!table) return;
      tr = table.querySelector('tr.bc-content-row[key="' + status[0] + '"]');
      if (!tr) return;
      closeTd = tr.querySelector(
        'td[data-on-toggle="' + status.join(',') + '"]');
      if (!closeTd) return;
      closeTd.setAttribute('aria-expanded', 'false');
      button = closeTd.querySelector('.bc-history-link');
      if (button) {
        removeClass(button, 'bc-history-link-inverse');
      }
      section = closeTd.querySelector('.bc-history');
      if (section) {
        addClass(section, 'bc-hidden');
      }
      tr = table.querySelector('tr.bc-history[key="' + status[0] + '"]');
      if (tr) {
        addClass(tr, 'bc-hidden');
      }

    }
  }

  /// endregion yari new compatibility table

  /// region yari expandable top menu
  // https://github.com/website-local/mdn-local/issues/783
  pageHeader = document.querySelector('.main-document-header-container') ||
    document.querySelector('.sticky-header-container');
  menuToggleBtn = pageHeader && pageHeader.querySelector('.main-menu-toggle');
  pageHeaderMain = pageHeader && (
    pageHeader.querySelector('.page-header-main') ||
    pageHeader.querySelector('.main-menu'));
  if (menuToggleBtn && pageHeaderMain) {
    menuToggleBtn.onclick = function menuToggleBtnClick() {
      // noinspection ES6ConvertVarToLetConst JSDeprecatedSymbols
      var spanIcon = menuToggleBtn.querySelector('span.icon'),
        spanText = menuToggleBtn.querySelector('span.visually-hidden');
      if (hasClass(pageHeader,'show-nav')) {
        removeClass(pageHeader, 'show-nav');
        menuToggleBtn.title = 'Open main menu';
        removeClass(spanIcon, 'icon-cancel');
        addClass(spanIcon, 'icon-menu');
      } else {
        addClass(pageHeader, 'show-nav');
        menuToggleBtn.title = 'Close main menu';
        addClass(spanIcon, 'icon-cancel');
        removeClass(spanIcon, 'icon-menu');
      }
      menuToggleBtn.setAttribute('aria-label', menuToggleBtn.title);
      spanText.innerText = menuToggleBtn.title;
    };
  }
  if (pageHeaderMain) {
    pageHeaderMain.onclick = function pageHeaderMainClick(e) {
      // noinspection JSDeprecatedSymbols
      e = e || window.event;
      // noinspection ES6ConvertVarToLetConst JSDeprecatedSymbols
      var node = e.target, button, li, ul, attr, nodes, i;
      if (!node) {
        // noinspection JSDeprecatedSymbols
        node = e.srcElement;
      }
      if (node.tagName === 'LI' &&
        hasClass(node, 'top-level-entry-container')) {
        li = node;
        button = li.querySelector('button.top-level-entry');
      } else if (node.tagName === 'BUTTON' &&
        hasClass(node, 'top-level-entry')) {
        button = node;
        li = node.parentNode;
      } else {
        return;
      }
      if (!button || !li) return;
      ul = li.querySelector('ul');
      if (!ul) return;
      attr = button.getAttribute('aria-expanded');
      if (attr === 'true') {
        button.setAttribute('aria-expanded', 'false');
        // ul.classList.remove('show')
        addClass(ul, 'hidden');
      } else {
        button.setAttribute('aria-expanded', 'true');
        removeClass(ul, 'hidden');
        nodes = li.parentNode && li.parentNode.children;
        if (!nodes) {
          return;
        }
        for (i = 0; i < nodes.length; i++) {
          if (nodes[i] === li) continue;
          ul = nodes[i].querySelector('ul');
          if (ul) {
            addClass(ul, 'hidden');
          }
          button = nodes[i].querySelector('button.top-level-entry');
          if (button) {
            button.setAttribute('aria-expanded', 'false');
          }
        }
      }
    };
    // https://github.com/website-local/mdn-local/issues/360
    window.onblur = function windowOnBlurCloseHeaderMenu() {
      // noinspection ES6ConvertVarToLetConst JSDeprecatedSymbols
      var el = pageHeader.querySelector(
        '.top-level-entry[aria-expanded="true"]');
      if (el) {
        el.click();
      }
    };
    window.onclick = function windowOnClickCloseHeaderMenu(e) {

      // noinspection JSDeprecatedSymbols
      e = e || window.event;
      // noinspection ES6ConvertVarToLetConst JSDeprecatedSymbols
      var node = e.target;
      if (!node) {
        // noinspection JSDeprecatedSymbols
        node = e.srcElement;
      }
      do {
        if (node === pageHeader) {
          return;
        }
      } while ((node = node.parentNode));
      window.onblur(e);
    };
  }

  /// endregion yari expandable top menu

  searchBox = document.querySelector('.homepage-hero-search');
  if (searchBox) {
    addClass(searchBox, 'hide');
  }

  /// region yari expandable mobile search
  toggleSearchBtn = document.querySelector('.toggle-form');
  if (toggleSearchBtn) {
    toggleSearchBtn.onclick = function toggleSearchBtnClick() {
      // noinspection ES6ConvertVarToLetConst
      var parent, closeIcon, searchIcon;
      parent = toggleSearchBtn.parentNode;
      if (!parent) {
        return;
      }
      closeIcon = toggleSearchBtn.querySelector('.close-icon');
      searchIcon = toggleSearchBtn.querySelector('.search-icon');
      if (hasClass(parent, 'show-form')) {
        removeClass(parent, 'show-form');
        if (closeIcon) {
          // Uncaught TypeError: setting getter-only property "className"
          // this is a svg
          removeClass(closeIcon, 'hide');
        }
        if (searchIcon) {
          addClass(searchIcon, 'hide');
        }
      } else {
        addClass(parent, 'show-form');
        if (closeIcon) {
          addClass(closeIcon, 'hide');
        }
        if (searchIcon) {
          removeClass(searchIcon, 'hide');
        }
      }
    };
  }
  /// endregion yari expandable mobile search

  /// region yari lowercase all anchor IDs and recover if not lowercase
  // https://github.com/mdn/yari/pull/2266
  function lowerCaseLocationHash() {
    // noinspection ES6ConvertVarToLetConst
    var location = document.location;
    // Did you arrive on this page with a location hash?
    if (location.hash && location.hash !== location.hash.toLowerCase()) {
      // The location hash isn't lowercase. That probably means it's from before
      // we made all `<h2 id>` and `<h3 id>` values always lowercase.
      // Let's see if it can easily be fixed, but let's be careful and
      // only do this if there is an element that matches.
      try {
        if (document.querySelector(location.hash.toLowerCase())) {
          // use location.replace to perform better in forward/back actions
          location.replace(location.hash.toLowerCase());
        }
      } catch (error) {
        // You can't assume that the anchor on the page is a valid string
        // for `document.querySelector()`.
        // E.g. /en-US/docs/Web/HTML/Element/input#Form_<input>_types
        // So if that the case, just ignore the error.
        // It's not that critical to correct anyway.
        // https://github.com/mdn/yari/issues/2475
      }
    }
  }

  window.onhashchange = lowerCaseLocationHash;
  lowerCaseLocationHash();

  /// endregion yari lowercase all anchor IDs and recover if not lowercase

  /// region yari main-menu nojs
  if (pageHeader) {
    mainMenuNoJs = document.querySelector('.main-menu.nojs');
    if (mainMenuNoJs) {
      removeClass(mainMenuNoJs, 'nojs');
    }
  }
  /// endregion yari main-menu nojs

  /// region yari theme menu
  // https://github.com/website-local/mdn-local/issues/782
  themeBtn = document.querySelector('button.theme-switcher-menu');
  if (themeBtn) {
    themeMenu = document.createElement('ul');
    themeMenu.style.display = 'none';
    themeMenu.style.right = '1rem';
    themeMenu.className = 'submenu themes-menu inline-submenu-lg';
    themeMenu.setAttribute('aria-labelledby', 'themes-menu-button');
    themeBtn.parentNode.append(themeMenu);
    themeMenu.innerHTML = '<li>\n' +
      '<button type="button" class="button primary has-icon active-menu-item">\n' +
      '<span class="button-wrap">\n' +
      '<span class="icon icon-theme-os-default"></span>OS Default</span>\n' +
      '</button></li>\n' +
      '<li>\n' +
      '<button type="button" class="button primary has-icon">\n' +
      '<span class="button-wrap"><span class="icon icon-theme-light"></span>Light</span>\n' +
      '</button>\n' +
      '</li>\n' +
      '<li>\n' +
      '<button type="button" class="button primary has-icon">\n' +
      '<span class="button-wrap"><span class="icon icon-theme-dark"></span>Dark</span>\n' +
      '</button>\n' +
      '</li>';
    themeBtn.onclick = function () {
      if (themeMenu.style.display === 'none') {
        themeMenu.style.display = '';
      } else {
        themeMenu.style.display = 'none';
      }
    };
    themeBtn = themeBtn.querySelector('span.icon');
    themeMenu.onclick = function (e) {
      // noinspection ES6ConvertVarToLetConst
      var theme, el;
      if (e && e.target) {
        switch (e.target.tagName) {
        case 'SPAN':
          if (e.target.className === 'button-wrap') {
            el = e.target.querySelector('span.icon');
          } else if (e.target.className.indexOf('icon-theme-') > -1) {
            el = e.target;
          }
          break;
        case 'BUTTON':
        case 'LI':
          el = e.target.querySelector('span.icon');
          break;
        }
        if (el) {
          theme = el.className.match(/icon-theme-([^ ]+)/);
          if (theme) {
            theme = theme[1];
            if (theme) {
              switchTheme(theme);
            }
          }
        }
      }
    };
    currentTheme = window.localStorage ?
      window.localStorage.getItem('theme') : '';
    if (!currentTheme) {
      currentTheme = 'os-default';
    } else {
      switchTheme(currentTheme);
    }
  }

  /**
   * Posts the name of the theme we are changing to the
   * interactive examples `iframe`.
   * @param theme - The theme to switch to
   */
  function postToIEx(theme) {
    // noinspection ES6ConvertVarToLetConst
    var iexFrame = document.querySelector('.interactive');

    if (iexFrame) {
      if (iexFrame.getAttribute('data-readystate') === 'complete' &&
        iexFrame.contentWindow) {
        iexFrame.contentWindow.postMessage({ theme: theme }, '*');
      }
    }
  }

  function switchTheme(theme) {
    // noinspection ES6ConvertVarToLetConst
    var html = document.documentElement, btn;

    if (window && html) {
      html.className = theme;
      html.style.backgroundColor = '';
      try {
        window.localStorage.setItem('theme', theme);
      } catch (err) {
        console.warn('Unable to write theme to localStorage', err);
      }
      themeBtn.className = 'icon icon-theme-' + theme;
      currentTheme = theme;
      btn = themeMenu.querySelector('.active-menu-item');
      if (btn) {
        removeClass(btn, 'active-menu-item');
      }
      btn = themeMenu.querySelector('.icon-theme-' + theme);
      if (btn) {
        btn = btn.parentNode;
        if (btn) {
          btn = btn.parentNode;
          if (btn) {
            addClass(btn, 'active-menu-item');
          }
        }
      }
      themeMenu.style.display = 'none';
      postToIEx(theme);
    }
  }
  /// endregion yari theme menu

  /// region yari mobile left sidebar
  // https://github.com/website-local/mdn-local/issues/784
  sidebarBtn = document.querySelector('.sidebar-button');
  sidebarContainer = document.getElementById('sidebar-quicklinks');
  if (sidebarBtn && sidebarContainer) {
    sidebarBtn.onclick = function () {
      if (hasClass(sidebarContainer, 'is-expanded')) {
        removeClass(sidebarContainer, 'is-expanded');
        removeClass(document.body, 'mobile-overlay-active');
        sidebarBtn.setAttribute('aria-label', 'Expand sidebar');
        sidebarBtn.setAttribute('aria-expanded', 'false');
      } else {
        addClass(sidebarContainer, 'is-expanded');
        addClass(document.body, 'mobile-overlay-active');
        sidebarBtn.setAttribute('aria-label', 'Collapse sidebar');
        sidebarBtn.setAttribute('aria-expanded', 'true');
      }
    };
    sidebarCurrentElem = sidebarContainer.querySelector('.sidebar em');
    if (sidebarCurrentElem &&
      typeof sidebarCurrentElem.scrollIntoView === 'function') {
      sidebarCurrentElem.scrollIntoView({ block: 'center' });
    }

  }
  /// endregion yari mobile left sidebar

  /// region yari mask-image to background fix
  // https://github.com/website-local/mdn-local/issues/785
  if (window.location.protocol === 'file:') {
    addClass(document.body ||
      document.getElementsByTagName('body')[0], 'mask-fix');
    linkCss = document.querySelector('link[rel="stylesheet"][href*="main."]');
    if (linkCss) {
      linkPreload = document.createElement('link');
      linkPreload.href = linkCss.href.replace(/\.css$/, '_file.css');
      linkPreload.rel = 'preload';
      linkPreload.as = 'style';
      document.head.appendChild(linkPreload);
      setTimeout(function () {
        linkCss.href =  linkPreload.href;
      }, 30);

    }
  }
  /// endregion yari mask-image to background fix
}();

// playground code from yari codebase, rewritten to legacy grammar
// 20230716 yari version v2.28.2 53314f5
// https://github.com/website-local/mdn-local/issues/888
!function () {
  // old code not needed since https://github.com/website-local/mdn-local/issues/1105

  // https://github.com/mdn/yari/blob/v4.3.0/client/src/document/hooks.ts#L98
  document
    .querySelectorAll('div.code-example pre:not(.hidden)')
    .forEach(function (element) {
      var header = element.parentElement &&
        element.parentElement.querySelector('.example-header');
      // Paused for now
      // addExplainButton(header, element);
      if (!navigator.clipboard) {
        console.log(
          'Copy-to-clipboard disabled because your browser does not appear to support it.'
        );

      } else {
        addCopyToClipboardButton(element, header);
      }
      if (header) {
        // https://github.com/website-local/mdn-local/issues/974
        // https://github.com/website-local/mdn-local/issues/1109
        var languageName = header.querySelector('.language-name');
        if (languageName) {
          // https://github.com/mdn/yari/blob/v4.3.0/client/src/document/code/syntax-highlight.tsx#L68
          var resolvedLanguage = languageName.textContent;
          var prismLanguage = Prism.languages[resolvedLanguage];
          if (prismLanguage) {
            try {
              var highlighted = Prism.highlight(element.textContent, prismLanguage, resolvedLanguage);
              if (highlighted) {
                element.innerHTML = `<code>${highlighted}</code>`;
              }
            } catch (err) {
              console.warn('Syntax highlighting: prism error', err);
            }
          }
        }
      }
    });
  function addCopyToClipboardButton(element, header) {
    if (!header || header.querySelector('.copy-icon')) return;
    if (typeof navigator !== 'object' || !navigator.clipboard) {
      return;
    }

    var button = document.createElement('button');
    var span = document.createElement('span');
    var liveregion = document.createElement('span');

    span.textContent = 'Copy to Clipboard';

    button.setAttribute('type', 'button');
    button.setAttribute('class', 'icon copy-icon');
    span.setAttribute('class', 'visually-hidden');
    liveregion.classList.add('copy-icon-message', 'visually-hidden');
    liveregion.setAttribute('role', 'alert');

    button.appendChild(span);
    header.appendChild(button);
    header.appendChild(liveregion);
    button.onclick = function () {
      return Promise.resolve().then(function () {
        var text = element.textContent || '';
        return navigator.clipboard.writeText(text);
      }).then(function () {
        return true;
      }, function () {
        return false;
      }).then(function (copiedSuccessfully) {

        if (copiedSuccessfully) {
          button.classList.add('copied');
          showCopiedMessage(header, 'Copied!');
        } else {
          button.classList.add('failed');
          showCopiedMessage(header, 'Error trying to copy to clipboard!');
        }

        setTimeout(
          function () {
            hideCopiedMessage(header);
          },
          copiedSuccessfully ? 1000 : 3000
        );
      });
    };

  }
  function showCopiedMessage(wrapper, msg) {
    var element = getCopiedMessageElement(wrapper);
    element.textContent = msg;
    element.classList.remove('visually-hidden');
  }

  function hideCopiedMessage(wrapper) {
    var element = getCopiedMessageElement(wrapper);
    element.textContent = ''; // ensure contents change, so that they are picked up by the live region
    if (element) {
      element.classList.add('visually-hidden');
    }
  }

  function getCopiedMessageElement(wrapper) {
    var className = 'copy-icon-message';
    var element = wrapper.querySelector(`span.${className}`);
    if (!element) {
      element = document.createElement('span');
      element.classList.add(className);
      element.classList.add('visually-hidden');
      element.setAttribute('role', 'alert');
      wrapper.appendChild(element);
    }
    return element;
  }

}();

// 20231003 mdn: scroll to highlight on sidebar
// https://github.com/website-local/mdn-local/issues/834
!function () {

  /// region toc-scroll-to-highlight
  // https://github.com/mdn/yari/blob/v2.20.2/client/src/document/hooks.ts#L192
  // https://github.com/mdn/yari/blob/v2.20.2/client/src/document/organisms/toc/index.tsx#L77

  function determineStickyHeaderHeight() {
    if (typeof getComputedStyle !== 'function') {
      // old browser
      return 0;
    }
    var sidebar = document.querySelector('.sidebar-container');

    if (sidebar) {
      return parseFloat(window.getComputedStyle(sidebar).top);
    }

    var styles = window.getComputedStyle(document.documentElement);
    var stickyHeaderHeight = styles
      .getPropertyValue('--sticky-header-height')
      .trim();

    if (stickyHeaderHeight.endsWith('rem')) {
      var fontSize = styles.fontSize.trim();
      if (fontSize.endsWith('px')) {
        return parseFloat(stickyHeaderHeight) * parseFloat(fontSize);
      } else {
        console.warn(
          `[useStickyHeaderHeight] fontSize has unexpected unit: ${fontSize}`
        );
        return 0;
      }
    } else if (stickyHeaderHeight.endsWith('px')) {
      return parseFloat(stickyHeaderHeight);
    } else {
      console.warn(
        `[useStickyHeaderHeight] --sticky-header-height has unexpected unit: ${
          stickyHeaderHeight
        }`
      );
      return 0;
    }
  }
  var tocElements = document.querySelectorAll(
    '.toc .document-toc-container > .document-toc > ul.document-toc-list > li > a');
  var tocElementIdMap = {};
  var currentTocId = '', currentTocElementMap;
  function tocFirstVisibleElementChange(element) {
    if (!element) {
      return;
    }
    if (currentTocElementMap && currentTocElementMap.get) {
      element = currentTocElementMap.get(element) || element;
    }
    var id = element ? '#' + element.id : '',
      i = 0, len = tocElements.length, el;
    if (id === currentTocId) {
      return;
    }
    for (; i < len; i++) {
      el = tocElements[i];
      if (el) {
        if (el.getAttribute('href') === id) {
          el.setAttribute('aria-current', 'true');
        } else {
          el.removeAttribute('aria-current');
        }
      }
    }
    currentTocId = id;
  }

  var tocObserver;
  function rebuildIntersectionObserver(observedElements, rootMargin) {
    if (tocObserver) {
      tocObserver.disconnect();
    }
    if (typeof IntersectionObserver === 'undefined' || typeof Map === 'undefined') {
      // SSR or old browser.
      return;
    }

    var visibilityByElement = new Map();

    function manageVisibility(entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        visibilityByElement.set(entry.target, entry.isIntersecting);
      }
    }

    function manageFirstVisibleElement() {
      var visibleElements = Array.from(visibilityByElement.entries())
        .filter(function (entry) {
          return entry[1];
        })
        .map(function (entry) {
          return entry[0];
        });

      tocFirstVisibleElementChange(visibleElements[0] || null);
    }

    var observer = new window.IntersectionObserver(
      function (entries) {
        manageVisibility(entries);
        manageFirstVisibleElement();
      },
      {
        rootMargin,
        threshold: [0.0, 1.0],
      }
    );
    tocObserver = observer;

    observedElements.forEach(function (element) {
      visibilityByElement.set(element, false);
      observer.observe(element);
    });
  }
  function initOrRebuildTocHighlightOnScroll() {

    var stickyHeaderHeight = determineStickyHeaderHeight();
    var rootMargin = `-${stickyHeaderHeight}px 0px 0px 0px`;

    var mainElement = document.querySelector('main') || document;
    var elements = mainElement.querySelectorAll(
      'h1, h1 ~ *:not(section), h2:not(.document-toc-heading), h2:not(.document-toc-heading) ~ *:not(section), h3, h3 ~ *:not(section)'
    );
    var observedElements = Array.from(elements);
    var lastElementWithId = null;
    var elementMap = new Map();
    for (var i = 0; i < elements.length; i++) {
      var elem =  elements[i];
      if (tocElementIdMap[elem.id]) {
        elementMap.set(elem, elem);
        lastElementWithId = elem;
      } else {
        if (lastElementWithId) {
          elementMap.set(elem, lastElementWithId);
        } else {
          elementMap.set(elem, elem);
        }
      }
    }
    currentTocElementMap = elementMap;
    rebuildIntersectionObserver(observedElements, rootMargin);

  }

  function initTocHighlightOnScroll() {
    tocElementIdMap = {};
    for (var i = 0; i < tocElements.length; i++) {
      let tocElement = tocElements[i];
      let href = tocElement.getAttribute('href');
      let id = href ? href.slice(1) : '';
      if (id) {
        tocElementIdMap[id] = true;
      }
    }

    var timeout = null;
    // Unfortunately we cannot observe the CSS variable using MutationObserver,
    // but we know that it may change when the width of the window changes.

    function debouncedListener() {
      if (timeout) {
        window.clearTimeout(timeout);
      }
      timeout = setTimeout(function () {
        initOrRebuildTocHighlightOnScroll();
        timeout = null;
      }, 250);
    }

    initOrRebuildTocHighlightOnScroll();
    window.addEventListener('resize', debouncedListener);
  }

  try {
    initTocHighlightOnScroll();
  } catch (e) {
    console.warn('toc-scroll-highlight', e);
  }
  /// endregion toc-scroll-highlight

  /// region scrim-inline
  // mdn: handle scrim-inline elements #1071
  // https://github.com/website-local/mdn-local/issues/1071
  function scrimCustomElement() {
    // Create a class for the element
    class ScrimInline extends window.HTMLElement {
      constructor() {
        super();
        var a = document.createElement('a');
        a.href = this.getAttribute('url');
        a.innerText = this.getAttribute('scrimtitle');
        a.className = 'external';
        a.target = '_blank';
        this.appendChild(a);
      }
    }

    // Define the new element
    window.customElements.define('scrim-inline', ScrimInline);

  }

  try {
    scrimCustomElement();
  } catch (e) {
    console.warn('scrim-inline', e);
  }
  /// endregion scrim-inline

  /// region set-html-lang
  function setHtmlLang() {
    var meta = document.querySelector('meta[property="og:locale"]');
    if (meta) {
      document.documentElement.setAttribute('lang',
        meta.getAttribute('content').replace('_', '-'));
    }
  }
  try {
    setHtmlLang();
  } catch (e) {
    console.warn('set-html-lang', e);
  }
  /// endregion set-html-lang
}();

// 20250203 mdn: sidebar filters
// https://github.com/website-local/mdn-local/issues/1020
!function () {
  /**
   * Used by quicksearch and sidebar filters.
   */
  function splitQuery(term) {
    return term.trim().toLowerCase().replace('.', ' .') // Allows to find `Map.prototype.get()` via `Map.get`.
      .split(/[ ,]+/);
  }
  class SidebarFilterer {
    constructor(root) {
      var _root$closest$querySe, _root$closest;
      this.allHeadings = void 0;
      this.allParents = void 0;
      this.items = void 0;
      this.toc = void 0;
      this.allHeadings = Array.from(root.querySelectorAll('li strong'));
      this.allParents = Array.from(root.querySelectorAll('details'));
      const links = Array.from(root.querySelectorAll('a[href]'));
      this.items = links.map(link => {
        var _link$textContent;
        return {
          haystack: ((_link$textContent = link.textContent) != null ? _link$textContent : '').toLowerCase(),
          link,
          container: this.getContainerOf(link),
          heading: this.getHeadingOf(link),
          parents: this.getParentsOf(link)
        };
      });
      this.toc = (_root$closest$querySe = (_root$closest = root.closest('.sidebar')) == null ? void 0 : _root$closest.querySelector('.in-nav-toc')) != null ? _root$closest$querySe : null;
    }
    applyFilter(query) {
      if (query) {
        this.toggleTOC(false);
        return this.showOnlyMatchingItems(query);
      } else {
        this.toggleTOC(true);
        this.showAllItems();
        return undefined;
      }
    }
    toggleTOC(show) {
      if (this.toc) {
        this.toggleElement(this.toc, show);
      }
    }
    toggleElement(el, show) {
      el.style.display = show ? '' : 'none';
    }
    showAllItems() {
      this.items.forEach(({
        link
      }) => this.resetLink(link));
      this.allHeadings.forEach(heading => this.resetHeading(heading));
      this.allParents.forEach(parent => this.resetParent(parent));
    }
    resetLink(link) {
      this.resetHighlighting(link);
      const container = this.getContainerOf(link);
      this.toggleElement(container, true);
    }
    getContainerOf(el) {
      return el.closest('li') || el;
    }
    resetHeading(heading) {
      const container = this.getContainerOf(heading);
      this.toggleElement(container, true);
    }
    resetParent(parent) {
      const container = this.getContainerOf(parent);
      this.toggleElement(container, true);
      if (parent.dataset.wasOpen) {
        parent.open = JSON.parse(parent.dataset.wasOpen);
        delete parent.dataset.wasOpen;
      }
    }
    resetHighlighting(link) {
      const nodes = Array.from(link.querySelectorAll('span, mark'));
      const parents = new Set();
      nodes.forEach(node => {
        var _node$textContent;
        const parent = node.parentElement;
        node.replaceWith(document.createTextNode((_node$textContent = node.textContent) != null ? _node$textContent : ''));
        if (parent) {
          parents.add(parent);
        }
      });
      parents.forEach(parent => parent.normalize());
    }
    showOnlyMatchingItems(query) {
      this.allHeadings.forEach(heading => this.hideHeading(heading));
      this.allParents.forEach(parent => this.collapseParent(parent));

      // Show/hide items (+ show parents).
      const terms = splitQuery(query);
      let matchCount = 0;
      this.items.forEach(({
        haystack,
        link,
        container,
        heading,
        parents
      }) => {
        this.resetHighlighting(link);
        const isMatch = terms.every(needle => haystack.includes(needle));
        this.toggleElement(container, isMatch);
        if (isMatch) {
          matchCount++;
          this.highlightMatches(link, terms);
          if (heading) {
            this.showHeading(heading);
          }
          for (const parent of parents) {
            this.expandParent(parent);
          }
        }
      });
      return matchCount;
    }
    hideHeading(heading) {
      const container = this.getContainerOf(heading);
      this.toggleElement(container, false);
    }
    collapseParent(parent) {
      var _parent$dataset$wasOp;
      const container = this.getContainerOf(parent);
      this.toggleElement(container, false);
      parent.dataset.wasOpen = (_parent$dataset$wasOp = parent.dataset.wasOpen) != null ? _parent$dataset$wasOp : String(parent.open);
      parent.open = false;
    }
    highlightMatches(el, terms) {
      const nodes = this.getTextNodesOf(el);
      nodes.forEach(node => {
        var _node$textContent2;
        const haystack = (_node$textContent2 = node.textContent) == null ? void 0 : _node$textContent2.toLowerCase();
        if (!haystack) {
          return;
        }
        const ranges = new Map();
        terms.forEach(needle => {
          const index = haystack.indexOf(needle);
          if (index !== -1) {
            ranges.set(index, index + needle.length);
          }
        });
        const sortedRanges = Array.from(ranges.entries()).sort(([x1, y1], [x2, y2]) => x1 - x2 || y1 - y2);
        const span = this.replaceChildNode(node, 'span');
        span.className = 'highlight-container';
        let rest = span.childNodes[0];
        let cursor = 0;
        for (const [rangeBegin, rangeEnd] of sortedRanges) {
          if (rangeBegin < cursor) {
            // Just ignore conflicting range.
            continue;
          }

          // Split.
          const match = rest.splitText(rangeBegin - cursor);
          const newRest = match.splitText(rangeEnd - rangeBegin);

          // Convert text node to HTML element.
          this.replaceChildNode(match, 'mark');
          rest = newRest;
          cursor = rangeEnd;
        }
      });
    }
    getTextNodesOf(node) {
      const parents = [node];
      const nodes = [];
      for (const parent of parents) {
        for (const childNode of parent.childNodes) {
          // eslint-disable-next-line no-undef
          if (childNode.nodeType === Node.TEXT_NODE) {
            nodes.push(childNode);
          } else if (childNode.hasChildNodes()) {
            parents.push(childNode);
          }
        }
      }
      return nodes;
    }
    replaceChildNode(node, tagName) {
      const text = node.textContent;
      const newNode = document.createElement(tagName);
      newNode.innerText = text != null ? text : '';
      node.replaceWith(newNode);
      return newNode;
    }
    showHeading(heading) {
      const container = heading && this.getContainerOf(heading);
      if (container) {
        this.toggleElement(container, true);
      }
    }
    getHeadingOf(el) {
      return this.findFirstElementBefore(el, this.allHeadings);
    }
    findFirstElementBefore(el, candidates) {
      // eslint-disable-next-line no-undef
      return candidates.slice().reverse().find(candidate => candidate.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    }
    expandParent(parent) {
      const container = this.getContainerOf(parent);
      this.toggleElement(container, true);
      parent.open = true;
    }
    getParentsOf(el) {
      var _el$parentElement;
      const parents = [];
      let parent = (_el$parentElement = el.parentElement) == null ? void 0 : _el$parentElement.closest('details');
      while (parent) {
        var _parent$parentElement;
        // eslint-disable-next-line no-undef
        if (parent instanceof HTMLDetailsElement) {
          parents.push(parent);
        }
        parent = (_parent$parentElement = parent.parentElement) == null ? void 0 : _parent$parentElement.closest('details');
      }
      return parents;
    }
  }
  function usePersistedScrollPosition(refs) {
    return {
      saveScrollPosition() {
        refs.forEach(ref => {
          const el = ref;
          if (el && typeof el.dataset.lastScrollTop === 'undefined' && el.scrollTop > 0) {
            el.dataset.lastScrollTop = String(el.scrollTop);
            el.scrollTop = 0;
          }
        });
      },
      restoreScrollPosition() {
        refs.forEach(ref => {
          const el = ref;
          if (el && typeof el.dataset.lastScrollTop === 'string') {
            el.scrollTop = Number(el.dataset.lastScrollTop);
            delete el.dataset.lastScrollTop;
          }
        });
      }
    };
  }
  var input = document.getElementById('sidebar-filter-input');
  var btn = document.querySelector('.clear-sidebar-filter-button');
  var quicklinks = document.getElementById('sidebar-quicklinks');
  if (!input || !btn || !quicklinks) {
    return;
  }
  btn.onclick = function () {
    input.classList.remove('is-active');
    input.value = '';
    input.parentElement.classList.remove('has-input');
    setQuery('');
  };

  // Scrolls on mobile.
  var sidebarInnerNav =
    quicklinks.querySelector('.sidebar-inner-nav');
  var obj = usePersistedScrollPosition([quicklinks, sidebarInnerNav]);
  var saveScrollPosition = obj.saveScrollPosition;
  var restoreScrollPosition = obj.restoreScrollPosition;
  var filterer;
  function setQuery(query) {
    if (!filterer) {

      var root = quicklinks.querySelector('.sidebar-body');

      if (!root) {
        return;
      }

      filterer = new SidebarFilterer(root);
    }

    const trimmedQuery = query.trim();

    // Save scroll position.
    if (trimmedQuery) {
      saveScrollPosition();
    }
    filterer.applyFilter(trimmedQuery);
    // TODO: setMatchCount
    // const items = filterer.applyFilter(trimmedQuery);
    // setMatchCount(items);

    // Restore scroll position.
    if (!trimmedQuery) {
      restoreScrollPosition();
    }
  }
  input.oninput = function () {
    setQuery(input.value);
    if (input.value) {
      input.parentElement.classList.add('has-input');
    }
  };
  input.onfocus = function () {
    input.classList.add('is-active');
  };
  var container = document.querySelector('.sidebar-filter-container');
  if (container) {
    container.classList.remove('hide');
  }
}();
