/**
 * User: anch
 * Date: 9/22/11
 * Time: 2:32 AM
 */

(function() {
//    http://docs.jquery.com/Plugins/Authoring
//    var
    "use strict";

    var charSet = {
        'D' : '#',
        'T' : '$'
    };

    var KEY_CODES = {
        D: [
            {keyCodeStart:48, keyCodeEnd: 57}
        ],//Digits

        T: [
            {keyCodeStart:48, keyCodeEnd: 57},
            //Digits
            {keyCodeStart:97, keyCodeEnd: 122},
            //Small letters
            {keyCodeStart:65, keyCodeEnd: 90}
        ], //Capital letters,
        LEFT : 37,
        RIGHT : 39,
        END: 35,
        HOME: 36,
        DELETE: 46,
        BACKSPACE: 8
    };

    var MONITOR_CHECK_TIMES = 10;
    var CASE_INSENSITIVE_MATCH = true;

    var globalCache = [];


    //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    (function($) {

        var methods = {
            init : function(options) {

                var settings = {
                    pattern: ''
                };

                if (typeof options === 'object') {
                    $.extend(settings, options);
                } else if (typeof options === 'string') {
                    $.extend(settings, {pattern: options});
                }

                return this.each(function() {
                    var $this = $(this);
                    var infoEntry = new AutoFormatInfoEntry($this);
                    globalCache.push(infoEntry);
                    $this.data('autoformat', infoEntry);

                    infoEntry.applyPattern(settings.pattern);

                    bindEvents($this);

                    var aaa = 1;
                });

            },

            destroy : function() {

                return this.each(function() {
                    //
                })

            },

            /**
             *  This method is mainly for debugging purpose in dev
             */
            cache: function() {
                return globalCache;
            }

        };

        $.fn.autoformat = function(method) {
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || typeof method === 'string' || ! method) {
                return methods.init.apply(this, arguments);
            } else {
                $.error('Method ' + method + ' does not exist on jQuery.autoformat');
            }
        };

    })(jQuery);

    function bindEvents($elem) {
        $elem.bind('keypress', eventHandlers.keypress);
        $elem.bind('keydown', eventHandlers.keydown);
    }

    var eventHandlers = {
        keypress: function(event) {
            var infoEntry = $(this).data('autoformat');
            if (!infoEntry) {
                return;
            }
            if (infoEntry.mutex) { // mutex is set, flip it and return
                infoEntry.mutex = false;
                return;
            }
            infoEntry.handleTyping(event);
            event.preventDefault();
        },
        keydown: function(event) {
            var infoEntry = $(this).data('autoformat');
            if (!infoEntry) {
                return;
            }
            infoEntry.handleControlKey(event);
        },
        preventDefault:  function(event) {
            event.preventDefault();
            return false;
        },
        focus: function() {
            var id = this.id;
            var infoEntry = wFORMS.behaviors.autoformat._globalCache[id];
            if (!infoEntry) {
                return;
            }
            infoEntry.showPrompt();
        },
        blur: function() {
            var id = this.id;
            var infoEntry = wFORMS.behaviors.autoformat._globalCache[id];
            if (!infoEntry) {
                return;
            }
            infoEntry.hidePrompt();
        },
        paste: function(event) {
            var id = this.id;
            var infoEntry = wFORMS.behaviors.autoformat._globalCache[id];
            if (!infoEntry) {
                return;
            }
            var selection = wFORMS.behaviors.autoformat.getSelection(infoEntry.element);

            infoEntry._pasteMonitorHandler = window.setInterval((function() {
                var entry = infoEntry;
                var count = 0;
                return function() {
                    var result = entry.checkCacheTempered(selection);
                    if (result != false) {
                        window.clearInterval(entry._pasteMonitorHandler);
                        entry.handlePaste(result, selection);
                    }
                    count++;
                    if (count >= MONITOR_CHECK_TIMES) {
                        window.clearInterval(entry._pasteMonitorHandler);
                    }
                };
            })(), 10);
        }
    };

    function testSpecialKey(event){
        return event.altKey || event.ctrlKey || event.metaKey;
    }

    //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    function AutoFormatInfoEntry($elem) {
        this.$element = $elem;
        this.template = null;
        this.templateFragments = [];
        this.promptLayer = null;
        this.inputCache = [];
        this._pasteMonitorHandler = null;
        this._cutMonitorHandler = null;

        this.mutex1 = false;
    }

    $.extend(AutoFormatInfoEntry.prototype, {
        getCaretPosition: function() {
            return this.getSelection().caret;
        },

        getSelection: function() {
            var element = this.$element[0];
            var cursurPosition = -1, selectionLength;
            if (element.selectionStart >= 0) {
                cursurPosition = element.selectionStart;
                selectionLength = element.selectionEnd - element.selectionStart;
            } else {//IE
                var range = document.selection.createRange();
                selectionLength = range.text.length;
                range.moveStart("character", -element.value.length);
                cursurPosition = range.text.length - selectionLength;
            }
            return {caret: cursurPosition, length: selectionLength};
        },

        setCaretPosition: function(pos) {
            var element = this.$element[0];
            if (element.setSelectionRange) {
                element.focus();
                element.setSelectionRange(pos, pos);
            }
            else if (element.createTextRange) {
                var range = element.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        },

        applyPattern : function(pattern) {
            this.template = this.interpretRule(pattern);
            this.buildTemplateFragmentList();
        },
        interpretRule : function(pattern) {
            var reader = 0, counter = 0;
            var result = [];
            while (reader < pattern.length) {
                var token = pattern.charAt(reader);
                if (token == '\\') {
                    token = pattern.charAt(++reader);
                    if (token == '$' || token == '#') {
                        result.push(new TemplateEntryLabel(counter++, token));
                    } else {
                        reader--;
                    }
                } else if (token == '$') {
                    result.push(new TemplateEntryMask(counter++, 'T', token));
                } else if (token == '#') {
                    result.push(new TemplateEntryMask(counter++, 'D', token));
                } else {
                    result.push(new TemplateEntryLabel(counter++, token));
                }
                reader++;
            }
            return result;
        },
        buildTemplateFragmentList : function() {
            var j = 0, fragment = null, fragmentOrder = 0;
            var l = this.template.length, lastFragment = null;
            for (var i = 0; i < l; i++) {
                var s = i, e = i, order = 0,
                        templateEntry = this.template[i];
                if (templateEntry.type == 'L') {
                    for (; e < l; e++) {
                        templateEntry = this.template[e];
                        if (templateEntry.type != 'L') {
                            i = e;
                            e--;
                            break;
                        }
                    }
                }
                var newFragment = new TemplateFragment(fragmentOrder++);
                newFragment.previous = lastFragment;
                if (lastFragment) {
                    lastFragment.next = newFragment;
                }
                this.templateFragments.push(newFragment);
                lastFragment = newFragment;
                while (s <= e) {
                    templateEntry = this.template[s++];
                    templateEntry.fragmentOrder = order++;
                    templateEntry.templateFragment = newFragment;
                    newFragment.addEntry(templateEntry);
                }
            }
        },

        getTemplateEntry: function(caret) {
            var dataLength = this.inputCache.length;
            if (caret > dataLength) {
                caret = dataLength;
            }
            var templateLength = this.template.length;
            if (caret >= templateLength) {
                return {type: 'EOF', order: templateLength};
            }
            return this.template[caret];
        },

        handleTyping: function(event) {
            var caret = this.getCaretPosition();
            var templateEntry = this.getTemplateEntry(caret);
            if (templateEntry.type == 'EOF') {
                return;
            }
            templateEntry.inputChecking(this, caret, event);
        },

        handleControlKey : function(event) {
            if (this.testCombinationKey(event)) {
                //no processing, allow browser default behavior
                this.mutext = true;
                return;
            }
            if (this.handleFunctionalKey(event)) {
                this.mutex = true; // keydown' has a higher priority. If it processed, then suppress 'keypress'
                event.preventDefault();
                return;
            }
            this.mutext = false;
        },

        testCombinationKey : function(event) {
            var keyCode = event.which || event.keyCode;
            //check for ctrl + x
            if (event.ctrlKey && keyCode == 88) { /* Ctrl + X*/
                this.handleCut(event);
                return true;
            }
            return( (event.ctrlKey && ( keyCode == 65 || /* Ctrl + A*/
                    keyCode == 67 || /* Ctrl + C*/
                    keyCode == 86 )     /* Ctrl + V*/
                    ) ||
                    (event.shiftKey && (keyCode == KEY_CODES.LEFT || /* Shift + Left*/
                            keyCode == KEY_CODES.RIGHT )) || /* Shift + Right*/
                    (keyCode == KEY_CODES.END ) || /* end */
                    (keyCode == KEY_CODES.HOME ) /* home */
                    )
        },

        handleFunctionalKey : function(event) {
            var keyCode = event.which || event.keyCode;
            var cur = this.getCaretPosition();
            var actionMapping = [
                ['LEFT', 'handleLeftMovement'],
                ['RIGHT', 'handleRightMovement'],
                ['DELETE', 'handleDelete'],
                ['BACKSPACE', 'handleBackspace']
            ];

            for (var i = 0; i < actionMapping.length; i++) {
                var entry = actionMapping[i];
                if (keyCode == KEY_CODES[entry[0]]) {
                    this[entry[1]](event, cur);
                    return true;
                }
            }
            return false;
        },

        //function keys handling functions
        handleLeftMovement : function(event, caret) {
        },

        handleRightMovement : function(event, caret) {
        },

        handleDelete : function(event, caret) {
        },

        handleBackspace : function(event, caret) {
        },

        //cache manipulation functions
        prefill: function(caret) {
            var templateEntry = this.getTemplateEntry(caret);
            if (templateEntry.type != 'L') {
                return;
            }
            var l = templateEntry.templateFragment.getLastEntry().order;
            while (caret <= l) {
                templateEntry = this.template[caret];
                this.inputCache[caret++] = {type: 'L', value: templateEntry.value};
            }
        },

        insertInputEntry : function(caret, insertInputEntry) {
            var inputQueue = this.buildActiveInputQueueAtCaret(caret), i;
            inputQueue.splice(0, 0, insertInputEntry);
            var tailPosition = this.fillActiveInputIntoTemplate(caret, inputQueue);
            this.prefill(tailPosition);
        },

        buildActiveInputQueueAtCaret : function(caret) {
            var inputQueue = [], i, l = this.inputCache.length;
            while(caret < l){
                var inputEntry = this.inputCache[caret++];
                if (inputEntry.type == 'I') {
                    inputQueue.push(inputEntry);
                }
            }
            return inputQueue;
        },

        fillActiveInputIntoTemplate : function(caret, inputQueue) {
            var templateMatchPosition = caret, templateFragment, inputQueueElement, i;
            while (inputQueue.length) {
                var templateEntry = this.getTemplateEntry(templateMatchPosition);
                if (templateEntry.type == 'EOF') { // reach the end of the template
                    break;
                }
                if (templateEntry.type != 'L') {
                    inputQueueElement = inputQueue.shift();
                    if (templateEntry.matchCharacter(inputQueueElement.value)) {
                        this.inputCache[templateMatchPosition++] = inputQueueElement;
                    } // if not match, the 'inputQueueElement' will be discarded intentionally
                } else if (templateEntry.type == 'L') {
                    templateFragment = templateEntry.templateFragment;
                    var startOrder = templateEntry.fragmentOrder, l = templateFragment.entries.length;
                    for (i = startOrder; i < l; i++) {
                        templateEntry = templateFragment.entries[i];
                        this.inputCache[templateMatchPosition++] = {type: 'L', value: templateEntry.value};
                        //if the input queue head element match the template entry, consume that head element
                        inputQueueElement = inputQueue[0];
                        if (templateEntry.matchCharacter(inputQueueElement.value)) {
                            inputQueue.shift();
                        }
                    }
                }
            }
            this.inputCache.splice(templateMatchPosition, this.inputCache.length);  //delete until last
            return templateMatchPosition;
        },

        //UI manipulation
        displayCache : function(){
            this.$element.val(this.calculateCachePresentation());
            //TODO
//            this.updatePatternPrompt();
        },

        calculateCachePresentation : function(){
            var output = '';
            for(var i = 0, l = this.inputCache.length; i < l; i++){
                output += this.inputCache[i].value;
            }
            return output;
        }

    });

    //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    function TemplateEntry(order, type, value) {
        this.order = order;
        this.type = type;
        this.value = value;
        this.templateFragment = null;
        this.orderInFragment = 0;
    }

    //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    function TemplateEntryLabel(order, value) {
        TemplateEntry.call(this, order, 'L', value);
    }

    TemplateEntryLabel.prototype = new TemplateEntry();
    TemplateEntryLabel.prototype.constructor = TemplateEntryLabel;

    $.extend(TemplateEntryLabel.prototype, {
        matchKey: function(event) {
            var keyCode = event.which || event.keyCode;
            var character = String.fromCharCode(keyCode);
            return this.matchCharacter(character);
        },

        matchCharacter: function(character) {
            if (CASE_INSENSITIVE_MATCH) {
                return character.toUpperCase() == this.value.toUpperCase();
            }
            return character == this.value;
        },

        inputChecking: function(infoEntry, caret, event) {
            var cacheUpdated = false;
            if (this.matchKey(event)) { //if matched, step ahead
                if (this.fragmentOrder == 0) { // if caret is at the front boundary of the fixed text fragment. then prefilling (auto-complete) fixed text fragment
                    infoEntry.prefill(caret);
                }
                caret++;
                cacheUpdated = true;
            } else { //if not matched, try to match the next masked input
                var nextInputPoint = this.templateFragment.getLastEntry().order + 1;
                var nextInputEntry = infoEntry.getTemplateEntry(nextInputPoint);
                if (nextInputEntry.type == 'EOF') { // if this is the last fragment, fill it anyway
                    infoEntry.prefill(caret);
                    caret = nextInputPoint;
                    cacheUpdated = true;
                } else {
                    var result = nextInputEntry.matchKey(event);
                    if (result.match) {
                        if (this.fragmentOrder == 0) {
                            infoEntry.prefill(caret);
                        }
                        infoEntry.insertInputEntry(nextInputPoint, {type: 'I', value: result.character});
                        caret = nextInputPoint + 1;
                        cacheUpdated = true;
                    }
                }
            }
            if (cacheUpdated) {
                infoEntry.displayCache();
                infoEntry.setCaretPosition(caret + 1);
                return true;
            }

            return false;
        }
    });

    //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    function TemplateEntryMask(order, type, value) {
        TemplateEntry.call(this, order, type, value);
    }

    TemplateEntryMask.prototype = new TemplateEntry();
    $.extend(TemplateEntryMask.prototype, {
        constructor: TemplateEntryMask,
        /**
         *
         * @param event The DOM event object
         * @param keyCode Usually will not be used unless 'matchCharacter' wants to borrow its logic
         */
        matchKey: function(event, keyCode) {
            var keyCodeMeta = KEY_CODES[this.type], result = {match: false, character: null};
            if (keyCode == undefined) {
                keyCode = event.which || event.keyCode;
            }
            var character = null, range = null;
            for (var i = 0, l = keyCodeMeta.length; i < l; i++) {// enumerate ranges
                range = keyCodeMeta[i];
                if (keyCode >= range.keyCodeStart && keyCode <= range.keyCodeEnd) {
                    result.match = true;
                    //calculate character
                    result.character = String.fromCharCode(keyCode);
                    break;
                }
            }
            return result;
        },

        matchCharacter: function(character) {
            var keyCode = character.charCodeAt(0);
            var result = this.matchKey(null, keyCode);
            return result.match;
        },

        inputChecking: function(infoEntry, caret, event) {
            if (testSpecialKey(event)) { // stop input checking if a functional key is pressed
                return false;
            }
            //test template type match
            if (this.type != 'D' && this.type != 'T') {
                return false;
            }

            var result = this.matchKey(event);
            if (!result.match) {
                return false;
            }
            //create entry in input cache
            infoEntry.insertInputEntry(this.order, {type: 'I', value: result.character});
            infoEntry.displayCache();
            infoEntry.setCaretPosition(caret + 1);
            return true;
        }
    });

    //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    function TemplateFragment(order) {
        this.order = order;
        this.characters = [];
        this.entries = [];
        this.next = null;
        this.previous = null;
    }

    $.extend(TemplateFragment.prototype, {
        addEntry: function(entry) {
            var character = entry.type == 'L' ? entry.value : charSet[entry.type];
            this.characters.push(character);
            this.entries.push(entry);
        },
        getLastEntry: function() {
            return this.entries[this.entries.length - 1];
        }
    });
})();