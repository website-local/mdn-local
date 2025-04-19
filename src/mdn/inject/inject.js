/* eslint-disable no-useless-escape,no-prototype-builtins,@typescript-eslint/no-unused-expressions,@typescript-eslint/no-unused-vars,no-case-declarations */
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
    const items = filterer.applyFilter(trimmedQuery);
    setMatchCount(items);

    // Restore scroll position.
    if (!trimmedQuery) {
      restoreScrollPosition();
    }
  }
  // https://github.com/website-local/mdn-local/issues/1111
  function setMatchCount(matchCount) {
    var span = input.parentElement.querySelector('.sidebar-filter-count');
    if (!span) {
      span = document.createElement('span');
      span.className = 'sidebar-filter-count';
      input.parentElement.insertBefore(span, input.nextElementSibling || input);
    }
    if (matchCount === undefined) {
      span.style.display = 'none';
      return;
    }
    span.style.display = '';
    span.innerText = matchCount === 0
      ? 'No matches'
      : `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`;
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

// 20250323 interactive-example
// https://github.com/website-local/mdn-local/issues/1142
// Currently based on https://github.com/mdn/yari/tree/v4.8.0/client/src/lit
!function () {
  const currSrc = document.currentScript.src;
  const relativeRoot = new URL('../../', currSrc).toString();
  const customElements = window.customElements;
  const HTMLElement = window.HTMLElement;
  /// region play-console
  // https://github.com/mdn/yari/commit/33de34d9df9f57f3afe9577403bcf6007507be63
  // Copied from https://github.com/mdn/bob/blob/9da42cd641d7f2a9796bf3406e74cad411ce9438/editor/js/editor-libs/console-utils.ts
  /**
   * Formats arrays:
   * - quotes around strings in arrays
   * - square brackets around arrays
   * - adds commas appropriately (with spacing)
   * designed to be used recursively
   * @param {any} input - The output to log.
   * @returns Formatted output as a string.
   */
  function formatArray(input) {
    let output = '';
    for (let i = 0, l = input.length; i < l; i++) {
      if (typeof input[i] === 'string') {
        output += '"' + input[i] + '"';
      } else if (Array.isArray(input[i])) {
        output += 'Array [';
        output += formatArray(input[i]);
        output += ']';
      } else {
        output += formatOutput(input[i]);
      }

      if (i < input.length - 1) {
        output += ', ';
      }
    }
    return output;
  }

  /**
   * Formats objects:
   * ArrayBuffer, DataView, SharedArrayBuffer,
   * Int8Array, Int16Array, Int32Array,
   * Uint8Array, Uint16Array, Uint32Array,
   * Uint8ClampedArray, Float32Array, Float64Array
   * Symbol
   * @param {any} input - The output to log.
   * @returns Formatted output as a string.
   */
  function formatObject(input) {
    const bufferDataViewRegExp = /^(ArrayBuffer|SharedArrayBuffer|DataView)$/;
    const complexArrayRegExp =
      /^(Int8Array|Int16Array|Int32Array|Uint8Array|Uint16Array|Uint32Array|Uint8ClampedArray|Float32Array|Float64Array|BigInt64Array|BigUint64Array)$/;

    const objectName = input.constructor ? input.constructor.name : input;

    if (objectName === 'String') {
      // String object
      return `String { "${input.valueOf()}" }`;
    }

    if (input === JSON) {
      // console.log(JSON) is outputed as "JSON {}" in browser console
      return 'JSON {}';
    }

    if (objectName.match && objectName.match(bufferDataViewRegExp)) {
      return objectName + ' {}';
    }

    if (objectName.match && objectName.match(complexArrayRegExp)) {
      const arrayLength = input.length;

      if (arrayLength > 0) {
        return objectName + ' [' + formatArray(input) + ']';
      } else {
        return objectName + ' []';
      }
    }

    if (objectName === 'Symbol' && input !== undefined) {
      return input.toString();
    }

    if (objectName === 'Object') {
      if (input?._MDNPlaySerializedObject) {
        return input._MDNPlaySerializedObject;
      }
      let formattedChild = '';
      let start = true;
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          if (start) {
            start = false;
          } else {
            formattedChild = formattedChild + ', ';
          }
          formattedChild = formattedChild + key + ': ' + formatOutput(input[key]);
        }
      }
      return objectName + ' { ' + formattedChild + ' }';
    }

    // Special object created with `OrdinaryObjectCreate(null)` returned by, for
    // example, named capture groups in https://mzl.la/2RERfQL
    // @see https://github.com/mdn/bob/issues/574#issuecomment-858213621
    if (!input.constructor && !input.prototype) {
      let formattedChild = '';
      let start = true;
      for (const key in input) {
        if (start) {
          start = false;
        } else {
          formattedChild = formattedChild + ', ';
        }
        formattedChild = formattedChild + key + ': ' + formatOutput(input[key]);
      }
      return 'Object { ' + formattedChild + ' }';
    }

    return input;
  }

  /**
   * Formats output to indicate its type:
   * - quotes around strings
   * - single quotes around strings containing double quotes
   * - square brackets around arrays
   * (also copes with arrays of arrays)
   * does NOT detect Int32Array etc
   * @param {any} input - The output to log.
   * @returns Formatted output as a string.
   */
  function formatOutput(input) {
    if (input === undefined || input === null || typeof input === 'boolean') {
      return String(input);
    } else if (typeof input === 'number') {
      // Negative zero
      if (Object.is(input, -0)) {
        return '-0';
      }
      return String(input);
    } else if (typeof input === 'bigint') {
      return String(input) + 'n';
    } else if (typeof input === 'string') {
      // string literal
      if (input.includes('"')) {
        return '\'' + input + '\'';
      } else {
        return '"' + input + '"';
      }
    } else if (Array.isArray(input)) {
      // check the contents of the array
      return 'Array [' + formatArray(input) + ']';
    } else {
      return formatObject(input);
    }
  }

  /** @implements {Partial<Console>} */
  class VirtualConsole {

    /** @param {PlayConsole} host  */
    constructor(host) {
      this.host = host;
    }

    clear() {
      this.host._messages = [];
      this.host.updated();
    }

    /** @param {...any} args */
    debug(...args) {
      return this.log(...args);
    }

    /** @param {...any} args */
    error(...args) {
      return this.log(...args);
    }

    /** @param {...any} args */
    info(...args) {
      return this.log(...args);
    }

    /** @param {...any} args */
    log(...args) {
      if (args.length > 1 && typeof args[0] === 'string') {
        // https://developer.mozilla.org/en-US/docs/Web/API/console#using_string_substitutions
        // TODO: add unit testing of this
        args[0] = args[0].replace(
          /%(?:\.([0-9]+))?(.)/g,
          (match, formatArg, format) => {
            switch (format) {
            case 'o':
            case 'O':
              const O = args.splice(1, 1)[0];
              return formatOutput(O);
            case 'd':
            case 'i':
              const i = args.splice(1, 1)[0];
              return Math.trunc(i).toFixed(0).padStart(formatArg, '0');
            case 's':
              const s = args.splice(1, 1)[0];
              return s.toString();
            case 'f':
              const f = args.splice(1, 1)[0];
              return (typeof f === 'number' ? f : parseFloat(f)).toFixed(
                formatArg ?? 6
              );
            case 'c':
              // TODO: Not implemented yet, so just remove the argument
              args.splice(1, 1);
              return '';
            case '%':
              return '%';
            default:
              return match;
            }
          }
        );
      }
      this.host._messages = [
        ...this.host._messages,
        args.map((x) => formatOutput(x)).join(' '),
      ];
      this.host.updated();
    }

    /** @param {...any} args */
    warn(...args) {
      return this.log(...args);
    }
  }

  class PlayConsole extends HTMLElement {

    constructor() {
      super();
      this.vconsole = new VirtualConsole(this);
      /** @type {string[]} */
      this._messages = [];
      this.render();
    }

    /** @param {CustomEvent<VConsole>} e */
    onConsole({ detail }) {
      if (detail.prop in this.vconsole) {
        const prop = /** @type keyof typeof this.vconsole */ (detail.prop);
        detail.args ? this.vconsole[prop](...detail.args) : this.vconsole[prop]();
      } else {
        this.vconsole.warn(
          '[Playground] Unsupported console message (see browser console)'
        );
      }
    }

    render() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
<style>:host { background-color: var(--code-background-inline); box-sizing: border-box; display: flex; flex-direction: column; font-size: 0.875rem; margin: 0px; overflow: auto; width: 100%; }
ul { list-style: none; margin: 0px; padding: 0px; }
li { padding: 0px 0.5em; }
li::before { content: ">"; }
code { font-family: var(--font-code); tab-size: 4; }</style>
      <ul>
        ${this._messages.map((message) => {
    return `
            <li>
              <code>${message}</code>
            </li>
          `;
  }).join('')}
      </ul>
    `;
    }

    updated() {
      this.render();
      this.scrollTo({ top: this.scrollHeight });
    }
  }

  customElements.define('play-console', PlayConsole);
  /// endregion play-console


  /// region render-html
  // https://github.com/mdn/yari/blob/v4.7.2/libs/play/index.js#L212
  /**
   * @param {Theme} [theme]
   * @returns {string}
   */
  function renderThemeStyles(theme) {
    return theme === 'os-default'
      ? `<style>
        :root {
          --text-primary: #1b1b1b;
          --background-primary: #fff;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --text-primary: #fff;
            --background-primary: #1b1b1b;
          }
        }
      </style>`
      : theme === 'light'
        ? `<style>
          :root {
            --text-primary: #1b1b1b;
            --background-primary: #fff;
          }
        </style>`
        : theme === 'dark'
          ? `<style>
            :root {
              --text-primary: #fff;
              --background-primary: #1b1b1b;
            }
          </style>`
          : '';
  }
  /**
   * @param {State | null} [state=null]
   */
  function renderHtml(state = null) {
    const {
      css,
      html: htmlCode,
      js,
      defaults,
      theme,
    } = state || { css: '', html: '', js: '' };
    // noinspection CssUnresolvedCustomProperty,CssUnknownTarget
    return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${renderThemeStyles(theme)}
        ${defaults === undefined
    ? `<style>
              /* Legacy css to support existing live samples */
              body {
                padding: 0;
                margin: 0;
              }

              svg:not(:root) {
                display: block;
              }

              .playable-code {
                background-color: #f4f7f8;
                border: none;
                border-left: 6px solid #558abb;
                border-width: medium medium medium 6px;
                color: #4d4e53;
                height: 100px;
                width: 90%;
                padding: 10px 10px 0;
              }

              .playable-canvas {
                border: 1px solid #4d4e53;
                border-radius: 2px;
              }

              .playable-buttons {
                text-align: right;
                width: 90%;
                padding: 5px 10px 5px 26px;
              }
            </style>`
    : ''}
        ${defaults === 'ix-tabbed'
    ? `<style>
              @font-face {
                font-family: "Inter";
                src:
                  url("${relativeRoot}shared-assets/fonts/Inter.var.woff2")
                    format("woff2 supports variations"),
                  url("${relativeRoot}shared-assets/fonts/Inter.var.woff2")
                    format("woff2-variations");
                font-weight: 1 999;
                font-stretch: 75% 100%;
                font-style: oblique 0deg 20deg;
                font-display: swap;
              }

              /* fonts used by the examples rendered inside the shadow dom. Because
                 @font-face does not work in shadow dom:
                 http://robdodson.me/at-font-face-doesnt-work-in-shadow-dom/ */
              @font-face {
                font-family: "Fira Sans";
                src:
                  local("FiraSans-Regular"),
                  url("${relativeRoot}shared-assets/fonts/FiraSans-Regular.woff2")
                    format("woff2");
              }

              @font-face {
                font-family: "Fira Sans";
                font-weight: normal;
                font-style: oblique;
                src:
                  local("FiraSans-SemiBoldItalic"),
                  url("${relativeRoot}shared-assets/fonts/FiraSans-SemiBoldItalic.woff2")
                    format("woff2");
              }

              @font-face {
                font-family: "Dancing Script";
                src: url("${relativeRoot}shared-assets/fonts/dancing-script/dancing-script-regular.woff2")
                  format("woff2");
              }

              @font-face {
                font-family: molot;
                src: url("${relativeRoot}shared-assets/fonts/molot.woff2") format("woff2");
              }

              @font-face {
                font-family: rapscallion;
                src: url("${relativeRoot}shared-assets/fonts/rapscall.woff2") format("woff2");
              }

              body {
                background-color: #fff;
                font:
                  400 1rem/1.1876 Inter,
                  BlinkMacSystemFont,
                  "Segoe UI",
                  "Roboto",
                  "Oxygen",
                  "Ubuntu",
                  "Cantarell",
                  "Fira Sans",
                  "Droid Sans",
                  "Helvetica Neue",
                  sans-sans;
                color: #15141aff;
                font-size: 0.9rem;
                line-height: 1.5;
                padding: 2rem 1rem 1rem;
                margin: 0;
                min-width: min-content;
              }

              body math {
                font-size: 1.5rem;
              }
            </style>`
    : ''}
        ${defaults === 'ix-choice'
    ? `<style>
              @font-face {
                font-family: "Inter";
                src:
                  url("${relativeRoot}shared-assets/fonts/Inter.var.woff2")
                    format("woff2 supports variations"),
                  url("${relativeRoot}shared-assets/fonts/Inter.var.woff2")
                    format("woff2-variations");
                font-weight: 1 999;
                font-stretch: 75% 100%;
                font-style: oblique 0deg 20deg;
                font-display: swap;
              }

              body {
                color: var(--text-primary);
                background-color: var(--background-primary);
                font:
                  400 1rem/1.1876 Inter,
                  BlinkMacSystemFont,
                  "Segoe UI",
                  "Roboto",
                  "Oxygen",
                  "Ubuntu",
                  "Cantarell",
                  "Fira Sans",
                  "Droid Sans",
                  "Helvetica Neue",
                  sans-sans;
                height: 300px;
                overflow: hidden;
                position: relative;
                background-color: var(--background-primary);
                overflow: hidden;
                padding: 1rem;
                margin: 0;
                box-sizing: border-box;
              }

              section {
                height: 100%;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              section.flex-column {
                flex-direction: column;
                align-items: initial;
              }

              /* some examples does not work with a flex display on the container */
              section.display-block {
                display: block;
              }

              section img {
                flex-grow: 0;
              }

              section.hidden {
                display: none;
              }

              .transition-all {
                transition: all 0.3s ease-in;
              }

              * {
                box-sizing: border-box;
              }
            </style>`
    : ''}
        <style id="css-output">
          ${css}
        </style>
        <script>
          const consoleProxy = new Proxy(console, {
            get(target, prop) {
              if (typeof target[prop] === "function") {
                return (...args) => {
                  try {
                    window.parent.postMessage(
                      { typ: "console", prop, args },
                      "*"
                    );
                  } catch {
                    try {
                      window.parent.postMessage(
                        {
                          typ: "console",
                          prop,
                          args: args.map((x) => {
                            try {
                              window.structuredClone(x);
                              return x;
                            } catch {
                              return { _MDNPlaySerializedObject: x.toString() };
                            }
                          }),
                        },
                        "*"
                      );
                    } catch {
                      window.parent.postMessage(
                        {
                          typ: "console",
                          prop: "warn",
                          args: [
                            "[Playground] Unsupported console message (see browser console)",
                          ],
                        },
                        "*"
                      );
                    }
                  }
                  target[prop](...args);
                };
              }
              return target[prop];
            },
          });

          window.console = consoleProxy;
          window.addEventListener("error", (e) => console.log(e.error));
        </script>
        ${defaults === 'ix-tabbed'
    ? `<script>
              window.addEventListener("click", (event) => {
                // open links in parent frame if they have no "_target" set
                const target = event.target;
                if (
                  target instanceof HTMLAnchorElement ||
                  target instanceof HTMLAreaElement
                ) {
                  const hrefAttr = target.getAttribute("href");
                  const targetAttr = target.getAttribute("target");
                  if (hrefAttr && !hrefAttr.startsWith("#") && !targetAttr) {
                    target.target = "_parent";
                  }
                }
              });
            </script>`
    : ''}
        ${defaults === 'ix-choice'
    ? `<script>
              /** @param {string} code */
              function setChoice(code) {
                const element = document.getElementById("example-element");
                if (element) {
                  element.style.cssText = code;
                }
              }

              window.addEventListener("message", ({ data }) => {
                if (data.typ === "choice") {
                  setChoice(data.code);
                }
              });
            </script>`
    : ''}
      </head>
      <body>
        ${htmlCode}
        <script type="${defaults === 'ix-wat' ? 'module' : ''}">
          ${js};
        </script>
        <script>
          try {
            window.parent.postMessage({ typ: "ready" }, "*");
          } catch (e) {
            console.error("[Playground] Failed to post ready message", e);
          }
        </script>
      </body>
    </html>
  `;
  }

  /// endregion render-html


  /// region play-runner

  // https://github.com/mdn/yari/blob/v4.7.2/client/src/lit/play/runner.js
  /**
   * @import { RunnerDefaults, VConsole } from "./types"
   * @import { EventName } from "@lit/react"
   * @import { Ref } from "lit/directives/ref.js"; */

  class PlayRunner extends HTMLElement {

    constructor() {
      super();
      /** @type {Record<string, string> | undefined} */
      this._code = undefined;
      /** @type {RunnerDefaults | undefined} */
      this.defaults = this.getAttribute('defaults');
      this.sandbox = this.getAttribute('sandbox');
      /** @type {Promise<true>} */
      this.ready = new Promise((resolve) => {
        this._resolveReady = () => resolve(true);
      });
      this.render();
    }

    /** @param {MessageEvent} e  */
    _onMessage({ data: { typ, prop, args } }) {
      if (typ === 'console') {
        /** @type {VConsole} */
        const detail = { prop, args };
        this.dispatchEvent(
          new CustomEvent('console', { bubbles: true, composed: true, detail })
        );
      } else if (typ === 'ready') {
        this._resolveReady();
      }
    }
    get code() {
      return this._code;
    }
    set code(v) {
      this._code = v;
      this._updateSrc();
    }

    async _updateSrc() {
      const {code, defaults, theme} = this;
      if (code && code.js && code.wat) {
        const watUrl = await compileAndEncodeWatToDataUrl(code.wat);
        code.js = code.js.replace('{%wasm-url%}', watUrl);
      }
      // TODO: theme
      const state  = {
        html: code?.html || '',
        css: code?.css || '',
        js: code?.js || '',
        defaults: defaults,
        theme: theme,
      };
      // update iframe src without adding to browser history
      this._iframe.srcdoc = renderHtml(state);
    }

    connectedCallback() {
      this._onMessage = this._onMessage.bind(this);
      window.addEventListener('message', this._onMessage);
    }

    /** @param {any} message */
    async postMessage(message) {
      await this.ready;
      this._iframe.contentWindow?.postMessage(message, '*');
    }

    render() {
      this.innerHTML = `
      <style>iframe { border: medium; height: 100%; width: 100%; }</style>
      <iframe
        title="runner"
        sandbox="allow-scripts allow-same-origin allow-forms ${this.sandbox}"
      ></iframe>
    `;
      this._iframe = this.querySelector('iframe');
      this._updateSrc();
    }

    disconnectedCallback() {
      window.removeEventListener('message', this._onMessage);
    }
  }

  /**
   * Converts a Uint8Array to a base64 encoded string
   * @param {Uint8Array} bytes - The array of bytes to convert
   * @returns {string} The base64 encoded string representation of the input bytes
   */
  function uInt8ArrayToBase64(bytes) {
    const binString = Array.from(bytes, (byte) =>
      String.fromCodePoint(byte)
    ).join('');
    return btoa(binString);
  }

  /**
   * compiles the wat code to wasm
   * @param {string} wat
   * @returns {Promise<string>} a data-url with the compiled wasm, base64 encoded
   */
  async function compileAndEncodeWatToDataUrl(wat) {

    const { default: init, watify } = await import(relativeRoot + 'static/js/watify.js');
    await init();
    const binary = watify(wat);
    const b64 = `data:application/wasm;base64,${uInt8ArrayToBase64(binary)}`;
    return b64;
  }

  customElements.define('play-runner', PlayRunner);

  /// endregion play-runner


  /// region play-editor

  class PlayEditor extends HTMLElement {

    /** @type {EditorView | undefined} */
    _editor;

    /** @type {number} */
    _updateTimer = -1;

    constructor() {
      super();
      // TODO: theme
      this.theme = {};
      this.language = this.getAttribute('language');
      this.minimal = this.hasAttribute('minimal');
      this._value = '';
      this.delay = Number(this.getAttribute('delay')) || 1000;
      this.render();
    }

    /** @param {string} value */
    set value(value) {
      this._value = value;
      if (this._editor) {
        const EditorState = window.CM['@codemirror/state'].EditorState;
        let state = EditorState.create({
          doc: value,
          extensions: this._extensions(),
        });
        this._editor.setState(state);
      }
    }

    get value() {
      return this._editor ? this._editor.state.doc.toString() : this._value;
    }

    /**
     * @param {string} type
     */
    _dispatch(type) {
      this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
    }
    _extensions() {
      const EditorView = window.CM.codemirror.EditorView;
      const minimalSetup = window.CM.codemirror.minimalSetup;
      const langJS = window.CM['@codemirror/lang-javascript'].javascript;
      const langHTML = window.CM['@codemirror/lang-html'].html;
      const langCSS = window.CM['@codemirror/lang-css'].css;
      const langWat = window.CM['@codemirror/lang-wast'].wast;
      const { indentOnInput, bracketMatching } = window.CM['@codemirror/language'];
      const { defaultKeymap, indentWithTab } = window.CM['@codemirror/commands'];
      const {
        autocompletion,
        completionKeymap,
        closeBrackets,
        closeBracketsKeymap,
      } = window.CM['@codemirror/autocomplete'];
      const { lintKeymap } = window.CM['@codemirror/lint'];
      const { keymap, highlightActiveLine, lineNumbers } = window.CM['@codemirror/view'];
      const { oneDark } = window.CM['@codemirror/theme-one-dark'];
      const language = (() => {
        switch (this.language) {
        case 'js':
          return [langJS()];
        case 'html':
          return [langHTML()];
        case 'css':
          return [langCSS()];
        case 'wat':
          return [langWat()];
        default:
          return [];
        }
      })();

      return [
        minimalSetup,
        bracketMatching(),
        closeBrackets(),
        ...(!this.minimal
          ? [
            lineNumbers(),
            indentOnInput(),
            autocompletion(),
            highlightActiveLine(),
            keymap.of([
              ...closeBracketsKeymap,
              ...defaultKeymap,
              ...completionKeymap,
              ...lintKeymap,
              indentWithTab,
            ]),
            EditorView.lineWrapping,
          ]
          : []),
        ...(this.theme.value === 'dark' ? [oneDark] : []),
        ...language,
        EditorView.focusChangeEffect.of((_, focusing) => {
          this._dispatch(focusing ? 'focus' : 'blur');
          return null;
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (this._updateTimer !== -1) {
              clearTimeout(this._updateTimer);
            }
            this._updateTimer = window?.setTimeout(() => {
              this._updateTimer = -1;
              this._dispatch('update');
            }, this.delay);
          }
        }),
      ];
    }

    async format() {
      // TODO: seems this is not used, but just keep an error here
      throw new Error('PlayEditor.format');
    }

    /** @param {PropertyValues} changedProperties */
    willUpdate(changedProperties) {
      const StateEffect = window.CM['@codemirror/state'].StateEffect;
      if (
        changedProperties.has('language') ||
        changedProperties.has('ThemeController.value')
      ) {
        this._editor?.dispatch({
          effects: StateEffect.reconfigure.of(this._extensions()),
        });
      }
    }

    render() {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>:host { display: block; font-size: 0.875rem; }
.editor { height: 100%; }
.editor.minimal { display: flex; flex-direction: column; justify-content: center; }
.editor.minimal .cm-content { align-self: center; min-height: auto; }
.editor.minimal .cm-focused { outline: none; }
.editor.minimal .cm-line { padding: 0px 12px; }
.editor .cm-editor { height: 100%; width: 100%; }
.editor .cm-editor * { font-family: var(--font-code)  !important; }</style><div
      class=${this.minimal ? 'editor minimal' : 'editor'}
    ></div>`;
      if (!PlayEditor._ready) {
        PlayEditor._ready = new Promise((resolve, reject) => {
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = relativeRoot + 'static/js/codemirror.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.getElementsByTagName('head')[0].appendChild(script);
        });
      }
      PlayEditor._ready.then(() => this.firstUpdated());
    }

    firstUpdated() {
      const EditorView = window.CM.codemirror.EditorView;
      const EditorState = window.CM['@codemirror/state'].EditorState;
      let startState = EditorState.create({
        doc: this._value,
        extensions: this._extensions(),
      });
      this._editor = new EditorView({
        state: startState,
        parent: this.shadowRoot.querySelector('div') || undefined,
      });
    }
  }

  customElements.define('play-editor', PlayEditor);

  /// endregion play-editor
  class PlayController extends HTMLElement {
    constructor() {
      super();
      // Create shadow root and render initial content.
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: contents;
        }
      </style>
      <slot></slot>
    `;

      // Default property values.
      this.runOnStart = false;
      this.runOnChange = false;
      this.srcPrefix = '';
      /** @type {Record<string, string>} */
      this._code = {};
      /** @type {Record<string, string>} */
      this._hiddenCode = {};
      this.initialCode = undefined;
    }

    // List of attributes we want to observe and reflect to properties.
    static get observedAttributes() {
      return ['run-on-start', 'run-on-change'];
    }

    // When attributes are changed, update properties.
    attributeChangedCallback(name, oldValue, newValue) {
      const isTruthy = newValue !== null && newValue !== 'false';
      if (name === 'run-on-start') {
        this.runOnStart = isTruthy;
      } else if (name === 'run-on-change') {
        this.runOnChange = isTruthy;
      }
    }

    // Setter for code property.
    /**
     * @param {Record<string, string>} code
     */
    set code(code) {
      // Filter out code for non-hidden editors.
      this._code = Object.fromEntries(
        Object.entries(code).filter(([language]) => !language.endsWith('-hidden'))
      );
      // Filter out and modify hidden-code.
      this._hiddenCode = Object.fromEntries(
        Object.entries(code)
          .filter(([language]) => language.endsWith('-hidden'))
          .map(([language, value]) => [language.replace(/-hidden$/, ''), value])
      );
      if (!this.initialCode) {
        this.initialCode = code;
      }

      // Update <play-editor> elements inside the light DOM.
      this.querySelectorAll('play-editor').forEach((editor) => {
        const language = editor.language;
        if (language) {
          const value = code[language];
          if (value !== undefined) {
            editor.value = value;
          }
        }
      });

      if (this.runOnStart) {
        this.run();
      }
    }

    // Getter for code property.
    get code() {
      // Get current code from editors.
      const code = { ...this._code };
      this.querySelectorAll('play-editor').forEach((editor) => {
        const language = editor.language;
        if (language) {
          code[language] = editor.value;
        }
      });
      // Prepend hidden code if available.
      Object.entries(this._hiddenCode).forEach(([language, value]) => {
        code[language] = code[language] ? `${value}\n${code[language]}` : value;
      });
      return code;
    }

    // Format each play-editor by calling its format method.
    async format() {
      try {
        const editors = Array.from(this.querySelectorAll('play-editor'));
        await Promise.all(editors.map(e => e.format()));
      } catch (e) {
        console.error(e);
      }
    }

    // Run the code by sending it to the runner.
    run() {
      // Clear the console first.
      const playConsole = this.querySelector('play-console');
      if (playConsole && playConsole.vconsole) {
        playConsole.vconsole.clear();
      }
      // Find the runner element and send code to it.
      const runner = this.querySelector('play-runner');
      if (runner) {
        runner.srcPrefix = this.srcPrefix;
        runner.code = this.code;
        // runner._updateSrc();
      }
    }

    // Reset the code to its initial state.
    reset() {
      if (this.initialCode) {
        this.code = this.initialCode;
      }
      if (this.runOnStart) {
        this.run();
      } else {
        const playConsole = this.querySelector('play-console');
        if (playConsole && playConsole.vconsole) {
          playConsole.vconsole.clear();
        }
        const runner = this.querySelector('play-runner');
        if (runner) {
          runner.code = undefined;
          // runner._updateSrc();
        }
      }
    }

    // Handler for editor updates.
    _onEditorUpdate() {
      if (this.runOnChange) {
        this.run();
      }
    }

    // Handler for console events from slotted nodes.
    /** @param {CustomEvent} ev */
    _onConsole(ev) {
      const playConsole = this.querySelector('play-console');
      if (playConsole && typeof playConsole.onConsole === 'function') {
        playConsole.onConsole(ev);
      }
    }

    connectedCallback() {
      // Listen for events bubbled from light DOM children.
      this.addEventListener('update', this._onEditorUpdate);
      this.addEventListener('console', this._onConsole);
    }

    disconnectedCallback() {
      // Clean up event listeners.
      this.removeEventListener('update', this._onEditorUpdate);
      this.removeEventListener('console', this._onConsole);
    }
  }

  customElements.define('play-controller', PlayController);

  /**
   * Checks if the CSS code is supported by the current browser.
   *
   * @param {string} code
   */
  function isCSSSupported(code) {
    // http://regexr.com/3fvik
    const cssCommentsMatch = /(\/\*)[\s\S]+(\*\/)/g;
    const element = document.createElement('div');

    // strip out any CSS comments before applying the code
    code = code.replace(cssCommentsMatch, '');

    const vendorPrefixMatch = /^-(?:webkit|moz|ms|o)-/;
    const style = element.style;
    // Expecting declarations to be separated by ";"
    // Declarations with just white space are ignored
    const declarationsArray = code
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    /**
     * @param {string} declaration
     * @returns {boolean} - true if declaration starts with -webkit-, -moz-, -ms- or -o-
     */
    function hasVendorPrefix(declaration) {
      return vendorPrefixMatch.test(declaration);
    }

    /**
     * Looks for property name by cutting off optional vendor prefix at the beginning
     * and then cutting off rest of the declaration, starting from any whitespace or ":" in property name.
     * @param {string} declaration - single css declaration, with not white space at the beginning
     * @returns {string} - property name without vendor prefix.
     */
    function getPropertyNameNoPrefix(declaration) {
      const prefixMatch = vendorPrefixMatch.exec(declaration);
      const prefix = prefixMatch === null ? '' : prefixMatch[0];
      const declarationNoPrefix =
        prefix === null ? declaration : declaration.slice(prefix.length);
      // Expecting property name to be over, when any whitespace or ":" is found
      const propertyNameSeparator = /[\s:]/;
      return declarationNoPrefix.split(propertyNameSeparator)[0] ?? '';
    }

    // Clearing previous state
    style.cssText = '';

    // List of found and applied properties with vendor prefix
    const appliedPropertiesWithPrefix = new Set();
    // List of not applied properties - because of lack of support for its name or value
    const notAppliedProperties = new Set();

    for (const declaration of declarationsArray) {
      const previousCSSText = style.cssText;
      // Declarations are added one by one, because browsers sometimes combine multiple declarations into one
      // For example Chrome changes "column-count: auto;column-width: 8rem;" into "columns: 8rem auto;"
      style.cssText += declaration + ';'; // ";" was previous removed while using split method
      // In case property name or value is not supported, browsers skip single declaration, while leaving rest of them intact
      const correctlyApplied = style.cssText !== previousCSSText;

      const vendorPrefixFound = hasVendorPrefix(declaration);
      const propertyName = getPropertyNameNoPrefix(declaration);

      if (correctlyApplied && vendorPrefixFound) {
        // We are saving applied properties with prefix, so equivalent property with no prefix doesn't need to be supported
        appliedPropertiesWithPrefix.add(propertyName);
      } else if (!correctlyApplied && !vendorPrefixFound) {
        notAppliedProperties.add(propertyName);
      }
    }

    if (notAppliedProperties.size !== 0) {
      // If property with vendor prefix is supported, we can ignore the fact that browser doesn't support property with no prefix
      for (const substitute of appliedPropertiesWithPrefix) {
        notAppliedProperties.delete(substitute);
      }
      // If any other declaration is not supported, whole block should be marked as invalid
      if (notAppliedProperties.size !== 0) return false;
    }
    return true;
  }


  /* ================================
   Interactive Example Component
   ================================ */

  class InteractiveExampleBase extends HTMLElement {
    constructor() {
      super();
      // Attach shadow DOM if desired.
      this.attachShadow({ mode: 'open' });
      this.name = this.getAttribute('name') || '';
      this._languages = []; // e.g. ["html", "js", "css", "wat"]
      this._code = {};      // language keyed code
      this._choices = [];   // for choices
      this._template = '';  // "choices", "console", or "tabbed"

      // References to child elements
      this._controllerEl = null;
      this._runnerEl = null;
    }

    connectedCallback() {
      // Render the base template once connected.
      this._code = this._initialCode();
      this._template = this._determineTemplate();
      this.render();
    }

    _initialCode() {
      // Look upward for a section that contains code examples.
      // This is a simplified version of the Lit code.
      const section = this.closest('section');
      const code = {};
      if (section) {
        const exampleNodes = section.querySelectorAll(
          '.code-example pre.interactive-example'
        );
        exampleNodes.forEach((pre) => {
          const language = Array.from(pre.classList).find((cls) =>
            ['html', 'js', 'css', 'wat'].includes(cls)
          );
          if (language && pre.textContent) {
            if (code[language]) {
              code[language] += '\n' + pre.textContent;
            } else {
              code[language] = pre.textContent;
            }
          }
        });
        const choiceNodes = section.querySelectorAll(
          '.code-example pre.interactive-example-choice'
        );
        this._choices = Array.from(choiceNodes).map(
          (pre) => pre.textContent.trim()
        );
      }
      this._languages = Object.keys(code);
      return code;
    }

    _determineTemplate() {
      if (this._choices.length) {
        return 'choices';
      }
      if (
        (this._languages.length === 1 && this._languages[0] === 'js') ||
        (this._languages.includes('js') && this._languages.includes('wat'))
      ) {
        return 'console';
      }
      return 'tabbed';
    }

    _langName(lang) {
      if (lang === 'js') {
        return 'JavaScript';
      }
      return lang.toUpperCase();
    }

    // Methods to update/run/reset code
    _run() {
      // In your implementation, you might call a method on a controller.
      if (this._controllerEl && typeof this._controllerEl.run === 'function') {
        this._controllerEl.run();
      }
    }
    _reset() {
      if (this._controllerEl && typeof this._controllerEl.reset === 'function') {
        this._controllerEl.reset();
      }
    }

    render() {
      // Clear shadow DOM content.
      this.shadowRoot.innerHTML = '';
      // Optionally include styles (imported externally or inline)
      // For demonstration, we insert a simple style tag.
      document.querySelectorAll('style, li[rel=stylesheet]').forEach(el => {
        this.shadowRoot.appendChild(el.cloneNode(true));
      });

      // Render based on the chosen template.
      let container = document.createElement('div');
      container.style.height = '100%';
      if (this._template === 'choices') {
        container.innerHTML = this._renderChoices();
      } else if (this._template === 'console') {
        container.innerHTML = this._renderConsole();
      } else if (this._template === 'tabbed') {
        container.innerHTML = this._renderTabs();
      }
      this.shadowRoot.appendChild(container);
      let style = document.createElement('style');
      style.textContent = `:host { --border: 1px solid var(--border-secondary); --tabbed-font-heading: 600 0.625rem/1.2 var(--font-heading); }
header { align-items: center; border-bottom: var(--border); border-top-left-radius: var(--elem-radius); border-top-right-radius: var(--elem-radius); display: flex; grid-area: header; justify-content: space-between; padding: 0.5rem 1rem; }
header h4 { font-size: 1rem; font-weight: normal; line-height: 1.1876; margin: 0px; }
header #reset { background-color: rgba(0, 0, 0, 0); border: 0px; border-radius: var(--elem-radius); color: var(--text-primary); cursor: pointer; font: var(--tabbed-font-heading); height: 2rem; letter-spacing: 1.5px; margin: 0px; max-width: 100px; padding: 0.7em 0.9em; text-transform: uppercase; }
header #reset:hover { background-color: var(--button-secondary-hover); }
play-editor { grid-area: editor; height: 100%; overflow: auto; }
.buttons { display: flex; flex-direction: column; gap: 0.5rem; grid-area: buttons; }
.buttons button { --button-bg: var(--button-secondary-default); --button-bg-hover: var(--button-secondary-hover); --button-bg-active: var(--button-secondary-active); --button-border-color: var(--border-primary); --button-color: var(--text-secondary); --button-font: var(--type-emphasis-m); --button-padding: 0.43rem 1rem; --button-radius: var(--elem-radius, 0.25rem); background-color: var(--button-bg); border: 1px solid var(--button-border-color); border-radius: var(--button-radius); color: var(--button-color); display: inline-block; font: var(--button-font); letter-spacing: normal; padding: var(--button-padding); text-align: center; text-decoration: none; }
.buttons button.external::after { display: none; }
.buttons button:hover { --button-border-color: var(--button-bg-hover); --button-bg: var(--button-bg-hover); }
.buttons button:active { --button-bg: var(--button-bg-active); }
play-console { border: var(--border); border-radius: var(--elem-radius); grid-area: console; }
.tabbed { grid-area: tabs; }
.template-console { align-content: start; display: grid; gap: 0.5rem; grid-template: "header header" max-content "editor editor" 1fr "buttons console" 8rem / max-content 1fr; height: 100%; }
.template-console header { border: var(--border); }
.template-console play-runner { display: none; }
.template-console > play-editor, .template-console .tabbed { border-bottom-left-radius: var(--elem-radius); border-bottom-right-radius: var(--elem-radius); border-top: 0px; grid-area: editor; margin-top: -0.5rem; }
@media (max-width: 426px) {
  .template-console { grid-template: "header" max-content "editor" 1fr "buttons" max-content "console" 8rem / 1fr; }
  .template-console .buttons { flex-direction: row; justify-content: space-between; }
}
.template-tabbed { border: var(--border); border-radius: var(--elem-radius); display: grid; grid-template: "header header" max-content "tabs runner" 1fr / 6fr 4fr; height: 100%; overflow: hidden; }
.template-tabbed .output-wrapper { border-left: var(--border); grid-area: runner; overflow: hidden; position: relative; }
.template-tabbed .output-wrapper h4 { background-color: var(--background-secondary); border-bottom-left-radius: var(--elem-radius); color: var(--text-secondary); font: var(--tabbed-font-heading); margin: 0px; padding: 0.5rem 1.6rem; position: absolute; right: 0px; text-transform: uppercase; top: 0px; z-index: 2; }
@media (max-width: 992px) {
  .template-tabbed { grid-template: "header" max-content "tabs" 1fr "runner" 1fr / 1fr; }
  .template-tabbed .output-wrapper { border-left: 0px; border-top: var(--border); }
}
.template-choices { border: var(--border); border-radius: var(--elem-radius); display: grid; grid-template: "header header" max-content "choice runner" 1fr / minmax(0px, 1fr) minmax(0px, 1fr); height: 100%; }
@media (max-width: 992px) {
  .template-choices { grid-template-areas: "header" "choice" "runner"; grid-template-columns: 1fr; }
}
.template-choices .choice-wrapper { border-right: var(--border); display: flex; flex-direction: column; grid-area: choice; overflow-y: auto; padding: 1rem 0px 1rem 1rem; row-gap: 0.4rem; }
@media (max-width: 992px) {
  .template-choices .choice-wrapper { border-bottom: var(--border); border-right: medium; padding-right: 1em; }
}
.template-choices .choice-wrapper .choice { --field-focus-border: #0085f2; --focus-01: 0 0 0 3px rgba(0, 144, 237, 0.4); align-items: center; display: flex; flex-grow: 1; }
.template-choices .choice-wrapper .choice::after { color: var(--field-focus-border); content: "▶"; font-size: 0.5rem; opacity: 0; padding: 0px 1rem 0px 0.25rem; width: 1rem; }
@media (max-width: 992px) {
  .template-choices .choice-wrapper .choice::after { display: none; }
}
.template-choices .choice-wrapper .choice.selected play-editor { border-color: var(--field-focus-border); box-shadow: var(--focus-01); cursor: text; }
.template-choices .choice-wrapper .choice.selected::after { opacity: 1; padding-left: 0.75rem; padding-right: 0.5rem; transition: 0.2s ease-out; }
.template-choices .choice-wrapper .choice.unsupported play-editor { border-color: rgb(255, 184, 0); }
.template-choices .choice-wrapper .choice.unsupported::after { background-image: url("https://developer.mozilla.org/static/media/warning.334964ef472eac4cfb78.svg"); background-position: center center; background-repeat: no-repeat; background-size: 1rem; content: ""; height: 1rem; opacity: 1; transition: none; width: 1rem; }
.template-choices .choice-wrapper .choice play-editor { border: var(--border); border-radius: var(--elem-radius); cursor: pointer; width: 100%; }
.template-choices .output-wrapper { height: 300px; overflow: hidden; }
.template-console .tabbed { border-left: var(--border); border-right: var(--border); border-bottom: var(--border); }
.tabbed { display: flex; flex-direction: column; overflow: hidden; }
.panel-wrapper { flex: 1 1 0%; min-height: 0px; }
.tab-panel { height: 100%; }
.tab-wrapper { background: var(--background-secondary); border-bottom: 1px solid var(--border-secondary); display: flex; flex-shrink: 0; gap: 0.5rem; overflow-x: auto; }
.tab { background-color: rgba(0, 0, 0, 0); border-width: 3px 0px; border-style: solid none; border-color: rgba(0, 0, 0, 0) currentcolor; border-image: none; color: var(--text-secondary); cursor: pointer; font: var(--type-emphasis-m); padding: 0.5em 30px; transition: color 0.2s, background-color 0.2s; }
.tab:hover, .tab:focus { background-color: var(--ix-tab-background-active); color: var(--text-primary); }
.tab.active { background-color: var(--ix-tab-background-active); border-bottom-color: var(--accent-primary); color: var(--accent-primary); }
`;
      this.shadowRoot.appendChild(style);

      // Find controller and runner elements if they exist.
      this._controllerEl = this.shadowRoot.querySelector('play-controller');
      this._runnerEl = this.shadowRoot.querySelector('play-runner');

      // In a real app, you might pass the code to the controller.
      if (this._controllerEl && this._code) {
        // Suppose your play-controller has a 'code' property.
        this._controllerEl.code = this._code;
      }
    } // end render

    /* ================
     Template Renderers
     ================ */

    _renderConsole() {
      // Render a header, an editor (or tabbed editor if _languages>1),
      // Run and Reset buttons, and output console.
      let inner = `
      <play-controller>
        <div class="template-console">
          <header>
            <h4>${this.name}</h4>
          </header>
    `;
      if (this._languages.length === 1) {
        inner += `<play-editor id="editor" language="${this._languages[0]}"></play-editor>`;
      } else {
        inner += '<div class="tabbed"><div class="tab-wrapper">';
        // Create tabs and panels – note that activation will be handled later.
        this._languages.forEach((lang, i) => {
          inner += `
        <div class="tab" data-lang="${lang}" data-index="${i}" role="tab">${this._langName(lang)}</div>
      `;
        });
        inner += '</div><div class="panel-wrapper">';
        this._languages.forEach((lang, i) => {
          inner += `
        <div class="tab-panel" data-lang-panel="${lang}" data-index="${i}" role="tabpanel">
          <play-editor language="${lang}"></play-editor>
        </div>
      `;
        });
        inner += '</div></div>';

        // Attach events after render.
        setTimeout(() => {
          const resetBtn = this.shadowRoot.getElementById('reset');
          if (resetBtn) {
            resetBtn.addEventListener('click', () => this._reset());
          }
          // Activate first tab and listen for clicks.
          const tabs = this.shadowRoot.querySelectorAll('.tab');
          if(tabs.length){
            tabs.forEach(tab => {
              tab.addEventListener('click', (ev) => {
                this._setActiveTab(ev.currentTarget);
              });
            });
            // Initialize first tab as active.
            this._setActiveTab(tabs[0]);
          }
        });
      }
      inner += `
          <div class="buttons">
            <button id="execute">Run</button>
            <button id="reset">Reset</button>
          </div>
          <play-console id="console"></play-console>
          <play-runner defaults="${this._languages.includes('wat') ? 'ix-wat' : ''}"></play-runner>
        </div>
      </play-controller>
    `;
      // Attach button events after rendering.
      setTimeout(() => {
        const runBtn = this.shadowRoot.getElementById('execute');
        if (runBtn) {
          runBtn.addEventListener('click', () => this._run());
        }
        const resetBtn = this.shadowRoot.getElementById('reset');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => this._reset());
        }
      });
      return inner;
    }

    _renderTabs() {
      let inner = `
      <play-controller run-on-start run-on-change>
        <div class="template-tabbed">
          <header>
            <h4>${(this.name)}</h4>
            <button id="reset">Reset</button>
          </header>
          <div class="tabbed">
          <div class="tab-wrapper">
    `;
      // Create tabs and panels – note that activation will be handled later.
      this._languages.forEach((lang, i) => {
        inner += `
        <div class="tab" data-lang="${lang}" data-index="${i}" role="tab">${this._langName(lang)}</div>
      `;
      });
      inner += '</div><div class="panel-wrapper">';
      this._languages.forEach((lang, i) => {
        inner += `
        <div class="tab-panel" data-lang-panel="${lang}" data-index="${i}" role="tabpanel">
          <play-editor language="${lang}"></play-editor>
        </div>
      `;
      });
      inner += `
          </div></div>
          <div class="output-wrapper">
            <h4>Output</h4>
            <play-runner sandbox="allow-top-navigation-by-user-activation" defaults="ix-tabbed"></play-runner>
          </div>
        </div>
      </play-controller>
    `;
      // Attach events after render.
      setTimeout(() => {
        const resetBtn = this.shadowRoot.getElementById('reset');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => this._reset());
        }
        // Activate first tab and listen for clicks.
        const tabs = this.shadowRoot.querySelectorAll('.tab');
        if(tabs.length){
          tabs.forEach(tab => {
            tab.addEventListener('click', (ev) => {
              this._setActiveTab(ev.currentTarget);
            });
          });
          // Initialize first tab as active.
          this._setActiveTab(tabs[0]);
        }
      });
      return inner;
    }

    _renderChoices() {
      // Render template for choices. We assume choices are simple text which appears in
      // a play-editor of language "css". (Your implementation may vary.)
      let inner = `
      <div class="template-choices">
        <header>
          <h4>${(this.name)}</h4>
          <button id="reset">Reset</button>
        </header>
        <div class="choice-wrapper">
    `;
      this._choices.forEach((code, index) => {
        inner += `
          <div class="choice" data-index="${index}">
            <play-editor data-index="${index}" language="css" minimal="true" delay="100">${code.trim()}</play-editor>
          </div>
      `;
      });
      inner += `
        </div>
        <div class="output-wrapper">
          <play-controller run-on-start>
            <play-runner defaults="ix-choice"></play-runner>
          </play-controller>
        </div>
      </div>
    `;
      // Bind events to choices.
      setTimeout(() => {
        const choiceWrapper = this.shadowRoot.querySelector('.choice-wrapper');
        if(choiceWrapper){
          // Listen for focus or updates on editors.
          choiceWrapper.addEventListener('focus', (evt) => {
            const target = evt.target.closest('play-editor');
            if(target){
              this._choiceSelect(target);
            }
          });
          choiceWrapper.addEventListener('update', (evt) => {
            const target = evt.target.closest('play-editor');
            if(target){
              this._choiceSelect(target);
            }
          });
        }
        const resetBtn = this.shadowRoot.getElementById('reset');
        if(resetBtn){
          resetBtn.addEventListener('click', () => this._resetChoices());
        }
        // Initialize choices.
        this._resetChoices();
      });
      return inner;
    }

    /* ======================
     Choices-specific Code
     ====================== */
    _resetChoices() {
      // Reset the selected choice and update editors with original code.
      this.__choiceSelected = -1;
      // Update each play-editor in the choices.
      const editorNodes = Array.from(this.shadowRoot.querySelectorAll('play-editor'));
      editorNodes.forEach((editor, index) => {
        editor.value = this._choices[index] || '';
      });
      // Mark unsupported if needed:
      this.__choiceUnsupported = this._choices.map((code) =>
        !isCSSSupported(code)
      );
      // Select first editor by default.
      if (editorNodes.length) {
        this._selectChoice(editorNodes[0]);
      }
    }

    /** @param {PlayEditor} editor */
    _getIndex(editor) {
      return parseInt(editor.dataset.index ?? '-1', 10);
    }

    async _selectChoice(editor) {
      const index = parseInt(editor.dataset.index || '-1', 10);
      // Simulate posting a message to play-runner using postMessage.
      if (this._runnerEl && typeof this._runnerEl.postMessage === 'function') {
        await this._runnerEl.postMessage({
          typ: 'choice',
          code: editor.value,
        });
      }
      this.__choiceSelected = index;
      // Optionally update the UI to reflect selection.
      this._updateChoicesUI();
    }

    /** @param {PlayEditor} editor */
    _updateUnsupported(editor) {
      const index = this._getIndex(editor);
      this.__choiceUnsupported = this.__choiceUnsupported.map((value, i) =>
        index === i ? !isCSSSupported(editor.value) : value
      );
    }

    _choiceSelect(editor) {
      // Called when an editor is selected.
      this._updateUnsupported(editor);
      this._selectChoice(editor);
    }

    _updateChoicesUI() {
      const choiceElements = this.shadowRoot.querySelectorAll('.choice');
      choiceElements.forEach((el) => {
        const index = parseInt(el.dataset.index, 10);
        if (index === this.__choiceSelected) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
        // Mark unsupported if applicable.
        if (this.__choiceUnsupported && this.__choiceUnsupported[index]) {
          el.classList.add('unsupported');
        } else {
          el.classList.remove('unsupported');
        }
      });
    }

    /* ======================
     Simple Tab Handling
     ====================== */
    _setActiveTab(clickedTab) {
      // Remove active state from all tabs, add to clicked one.
      const tabs = this.shadowRoot.querySelectorAll('.tab');
      const panels = this.shadowRoot.querySelectorAll('.tab-panel');
      tabs.forEach((tab) => {
        tab.classList.remove('active');
        tab.setAttribute('tabindex', '-1');
        // Optionally update aria-selected etc.
      });
      clickedTab.classList.add('active');
      clickedTab.setAttribute('tabindex', '0');

      // Activate corresponding panel.
      const index = clickedTab.dataset.index;
      panels.forEach((panel) => {
        if (panel.dataset.index === index) {
          panel.style.display = '';
        } else {
          panel.style.display = 'none';
        }
      });
    }
  }

  // Finally, register the element.
  customElements.define('interactive-example', InteractiveExampleBase);

}();
