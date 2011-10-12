(function() {
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
    var BLINK_INTERVAL = 500;

    var globalCache = [];


    //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    (function($) {

        var methods = {
            init : function(options) {

                var settings = {
                    css_prompt: 'autoformat_prompt',
                    css_entry_label: 'autoformat_prompt_label',
                    css_entry_mask: 'autoformat_prompt_mask',
                    css_input_text: 'autoformat_input_text',
                    deluxe: false,
                    pattern: ''
                };

                if (typeof options === 'object') {
                    $.extend(settings, options);
                } else if (typeof options === 'string') {
                    $.extend(settings, {pattern: options});
                }

                return this.each(function() {
                    var $this = $(this);
                    var infoEntry = new AutoFormatInfoEntry($this, settings);
                    globalCache.push(infoEntry);
                    $this.data('autoformat', infoEntry);

                    infoEntry.applyPattern(settings.pattern);

                    deployLayout($this, infoEntry);
                    bindEvents($this, infoEntry);

                });

            },

            destroy : function() {
                return this.each(function() {
                    //TODO
                    var $this = $(this);
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

    function deployLayout($element, autoFormatInfoEntry){
        var $div = $('<div/>').height($element.outerHeight()).width($element.outerWidth())
                .css({
                    display: $element.css('display'),
                    position: 'relative'
                });
        $element.wrap($div).css({
            'background-color' : 'transparent',
            position: 'relative',
            'ime-mode': 'disabled'
        });
        $div = $element.parent(); //strange, the wrapping div is not $div any more ... -_-!

        var zIndex = (function($e){
           var zIndex;
           do{
               if( (zIndex = $e.css('z-index')) !== 'auto'){
                   return parseInt(zIndex);
               }
           }while(($e = $e.parent()).length!=0 && $e[0].tagName != 'HTML');
            return 0;
        })($element);

        if(zIndex == 0){
            $element.css('z-index', 1)
        }else{
            zIndex--;
        }

        function addCssPropertyValues(){
            var sum = 0;
            $.each(arguments, function(i, v){
                var value = parseFloat($element.css(v).replace(/px$/, ''));
                sum += isNaN(value) ? 0 : value;
            });
            return sum + 'px';
        }

        autoFormatInfoEntry.ui_measure =
            (autoFormatInfoEntry.ui_prompt = $('<div></div>').css({
                'font-size': $element.css('font-size'),
                'font-family': $element.css('font-family'),
                position : 'absolute',
                left: '0px',
                top: '0px',
                'z-index' : zIndex,
                'padding-top': addCssPropertyValues('padding-top', 'margin-top', 'border-top-width'),
                'padding-left': addCssPropertyValues('padding-left', 'margin-left', 'border-left-width'),
                'padding-right': addCssPropertyValues('padding-right', 'margin-right', 'border-right-width'),
                'padding-bottom': addCssPropertyValues('padding-bottom', 'margin-bottom', 'border-bottom-width')
            }).appendTo($div))
        .clone().css(
            {
                visibility: 'hidden',
                padding: '0px'
            }
        ).appendTo($div);
        autoFormatInfoEntry.ui_prompt.addClass(autoFormatInfoEntry.settings['css_prompt']);

        if(autoFormatInfoEntry.settings['deluxe']){
            deployExtraUI(autoFormatInfoEntry, zIndex);
        }
    }

    function deployExtraUI(autoFormatInfoEntry, zIndex){
        autoFormatInfoEntry.ui_renderingComponent = autoFormatInfoEntry.ui_prompt.clone()
            .insertBefore(autoFormatInfoEntry.ui_prompt).addClass(autoFormatInfoEntry.settings['css_input_text'])
            .removeClass(autoFormatInfoEntry.settings['css_prompt']);
        autoFormatInfoEntry.ui_measure.addClass(autoFormatInfoEntry.settings['css_input_text']);

        autoFormatInfoEntry.ui_caretBlink = $('<div></div>').css({
            position : 'absolute',
            width: '1px',
            height: autoFormatInfoEntry.$element.height(),
            top: autoFormatInfoEntry.ui_prompt.css('padding-top'),
            'z-index': zIndex + 2,
            'background-color' : '#000000',
            visibility: 'hidden'

        }).insertBefore(autoFormatInfoEntry.ui_renderingComponent);
        autoFormatInfoEntry.$element.css('color', 'transparent');

        autoFormatInfoEntry.caretBlinkLeftPatch
            = parseInt(autoFormatInfoEntry.ui_prompt.css('padding-left').replace(/px$/, ''));
    }

    function bindEvents($elem, infoEntry) {
        $.each(['keypress', 'keydown', 'focus', 'blur', 'paste'], function(i, v){
            $elem.bind(v, eventHandlers[v]);
        });
        $elem.attr('autocomplete', 'off');

        if(infoEntry.settings['deluxe']){
            $.each(['focus', 'blur'], function(i, v){
                $elem.bind(v, eventHandlers[v + 'Extra']);
            });
            $elem.bind('click', eventHandlers['click']);

        }
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
            var infoEntry = $(this).data('autoformat');
            if (!infoEntry) {
                return;
            }
            infoEntry.showPrompt();
        },

        focusExtra: function() {
            var infoEntry = $(this).data('autoformat');
            if (!infoEntry) {
                return;
            }
            infoEntry.activateCaret();
        },

        blur: function() {
            var infoEntry = $(this).data('autoformat');
            if (!infoEntry) {
                return;
            }
            infoEntry.hidePrompt();
        },

        blurExtra: function() {
            var infoEntry = $(this).data('autoformat');
            if (!infoEntry) {
                return;
            }
            infoEntry.deactivateCaret();
        },

        paste: function(event) {
            var infoEntry = $(this).data('autoformat');
            if (!infoEntry) {
                return;
            }
            var selection = infoEntry.getSelection();

            infoEntry._pasteMonitorHandler = window.setInterval((function() {
                var count = 0;
                return function() {
                    var result = infoEntry.checkCacheTempered(selection);
                    if (result != false) {
                        window.clearInterval(infoEntry._pasteMonitorHandler);
                        infoEntry.handlePaste(result, selection);
                    }
                    count++;
                    if (count >= MONITOR_CHECK_TIMES) {
                        window.clearInterval(infoEntry._pasteMonitorHandler);
                    }
                };
            })(), 10);
        },

        click: function() {
            var infoEntry = $(this).data('autoformat');
            if (!infoEntry) {
                return;
            }
            infoEntry.activateCaret();
        }
    };

    function testSpecialKey(event){
        return event.altKey || event.ctrlKey || event.metaKey;
    }
    function escapeHTMLEntities(value){
        //todo
        return value;
    }

    //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    function AutoFormatInfoEntry($elem, settings) {
        this.$element = $elem;
        this.settings = settings;
        this.template = null;
        this.templateFragments = [];
        this.promptLayer = null;
        this.inputCache = [];
        this._pasteMonitorHandler = null;
        this._cutMonitorHandler = null;
        this._caretMonitorHandler = null;
        this._caretBlinkStatus = false;

        this.mutex1 = false;

        //UI components references
        this.ui_prompt = null;
        this.ui_measure = null;
        this.ui_renderingComponent = null;
        this.ui_caretBlink = null;

        this.caretBlinkLeftPatch = 0;
        this.fontStyleString = this.computeFontStyleString();
    }

    $.extend(AutoFormatInfoEntry.prototype, {
        getCaretPosition: function() {
            return this.getSelection().caret;
        },

        getSelection: function(){
           var element = this.$element[0];
           var cursurPosition=-1, selectionLength;
           if(element.selectionStart >=0 ){
               cursurPosition= element.selectionStart;
               selectionLength =  element.selectionEnd - element.selectionStart;
           }else if(document.selection){//IE
               var $oS, $oR, $oT;
               if (element.tagName && element.tagName === "TEXTAREA"){
                    $oS = document.selection.createRange().duplicate();
                    $oR = element.createTextRange();
                    $oR.collapse(false);
                    $oR.moveToBookmark($oS.getBookmark());
                    if ($oS.text === ''){
                        $oT = $oR.duplicate();
                        $oT.moveEnd("character", 1);
                        if ($oS.boundingWidth === $oT.boundingWidth && $oS.boundingHeight === $oT.boundingHeight){
                            $oR = $oT;
                        }
                    }
               }else{
                    $oR = document.selection.createRange().duplicate();
               }
               selectionLength = $oR.text.length;
               cursurPosition = Math.abs($oR.moveStart("character", -1000000));
           }else if (document.getSelection){ /* Netscape */
               cursurPosition = 0;
               selectionLength = document.getSelection().length;
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

            if(this.settings['deluxe']){
                this.activateCaret(pos);
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
                            e--;
                            break;
                        }
                    }
                    i = (e == l? --e : e);
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
                this.mutex = true;
                return;
            }
            if (this.handleFunctionalKey(event)) {
                this.mutex = true; // 'keydown' has a higher priority. If it processed, then suppress 'keypress'
                event.preventDefault();
                return;
            }
            this.mutex = false; // yield processing right to successive logic
        },

        testCombinationKey : function(event) {
            var keyCode = event.which || event.keyCode;
            //check for ctrl + x , this need to be handled specially, `cause 'cut' action requires special logic
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
            var templateEntry = this.getTemplateEntry(caret), fragment;
            if(templateEntry.type == 'EOF'){
                fragment = this.templateFragments[this.templateFragments.length - 1];
            }else{
                fragment = templateEntry.templateFragment;
                if(fragment.previous){
                   fragment = fragment.previous;
                }
            }

            caret = fragment.entries[0].order;
            this.setCaretPosition(caret);
            return caret;
        },

        handleRightMovement : function(event, caret) {
           var templateEntry = this.getTemplateEntry(caret), fragment;
           if(templateEntry.type == 'EOF'){
               fragment = this.templateFragments[this.templateFragments.length - 1];
           }else{
               fragment =  templateEntry.templateFragment;
           }
           caret = fragment.getLastEntry().order + 1;
           this.setCaretPosition(caret);
           return caret;

        },

        handleDelete : function(event, caret) {
            var preserveTrailingFragment = true;
            var selection = this.getSelection();
            if(selection.length != 0){
                return this.groupSelectionRemove(selection);
            }

            var templateEntry = this.getTemplateEntry(caret), templateFragment;
            if(templateEntry.type == 'L'){
                preserveTrailingFragment = false;
                templateFragment = templateEntry.templateFragment;
                if(templateFragment.next == null){
                    caret = templateFragment.entries[0].order; //will remove the last fragment
                }else{
                    templateFragment = templateFragment.next;
                    var firstEntryOrder = templateFragment.entries[0].order;
                    //input entry exist?
                    if(this.inputCache[firstEntryOrder] != undefined // if a Mask entry after the fragment exists
                        || templateEntry.fragmentOrder !=0){ // if caret is not at the first character of the fragment
                        caret = firstEntryOrder; // skip to first entry of the next adjacent fragment
                    }else{
                        caret = templateEntry.templateFragment.entries[0].order; //prepare to remove the current fragment
                    }
                }
            }

            var inputQueue= this.buildActiveInputQueueAtCaret(caret);
            inputQueue.shift();

            this.fillActiveInputIntoTemplate(caret, inputQueue, preserveTrailingFragment);
            this.displayCache();
            this.setCaretPosition(caret);

            return true;
        },

        handleBackspace : function(event, caret) {
            var preserveTrailingFragment = true;
            var selection = this.getSelection(), templateFragment;
            if(selection.length != 0){
                return this.groupSelectionRemove(selection);
            }
            if(--caret < 0){
                return true; //handled, already at the beginning
            }

            var templateEntry = this.getTemplateEntry(caret);
            if(templateEntry.type == 'L'){
                preserveTrailingFragment = false;
                templateFragment = templateEntry.templateFragment;
                if(templateFragment.order ==0){
                    if(this.inputCache[caret+1] !== undefined){// if there is a fragment comes after the first L fragment
                        this.setCaretPosition(0);
                        return;
                    }
                    caret = 0;//the fragment will be deleted
                }else{
                    templateFragment = templateFragment.previous;
                    caret = templateFragment.entries[0].order;
                }
            }
            var inputQueue= this.buildActiveInputQueueAtCaret(caret);
            inputQueue.shift();

            this.fillActiveInputIntoTemplate(caret, inputQueue, false);
            this.displayCache();
            this.setCaretPosition(caret);
            return true;
        },

        handlePaste: function(difference, refSelection){
            var inputQueue = this.buildActiveInputQueueAtCaret(difference.start);
            var removeCount = 0;
            if(refSelection.length != 0){// need remove the active input characters in the selection
                removeCount = this.inputMaskStatisticWithinRange(refSelection.caret, refSelection.length);
            }
            //remove 'removeCount' elements from the queue
            while(removeCount --){
                inputQueue.shift();
            }
            var insertionQueue = [];
            //build up insertion as entry list
            for(var i = 0; i < difference.diff.length; i++){
                insertionQueue.push({type: 'I', value: difference.diff[i]});
            }
            //splice the insertion with the successive input
            inputQueue = insertionQueue.concat(inputQueue);

            this.fillActiveInputIntoTemplate(difference.start, inputQueue);
            this.displayCache();
            this.setCaretPosition(difference.start);
            return true;
        },

        handleCut: function(event){
            var selection = this.getSelection();
            if(selection.length==0){ // nothing will be cut, directly return
                return;
            }
            this._valueBeforeCut = this.$element.val();
            this.groupSelectionRemove(selection, false); //straighten cache first regardless of repsentation change

            //since we don't know when the browser's behaviour will complete the cut operation, we have to poll the current value
            // and compare it with the value last seen ('this._valueBeforeCut')
            // after the value is changed, we are sure that the cut operation is fulfilled(content went to the clipboard), then
            // we can synchronize the value with the inputCache
            this._cutMonitorHandler = window.setInterval((function(entry){
                var count = 0;
                return function(){
                    var value = entry.$element.val();
                    if(value != entry._valueBeforeCut){
                        entry._valueBeforeCut = null;
                        window.clearInterval(entry._cutMonitorHandler);
                        entry.displayCache();
                        entry.setCaretPosition(selection.caret);
                    }

                    count++;
                    if(count >= MONITOR_CHECK_TIMES){
                        window.clearInterval(entry._cutMonitorHandler);
                    }
                };
            })(this), 10);
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

        fillActiveInputIntoTemplate : function(caret, inputQueue, preserveTrailingEntry) {
            if(preserveTrailingEntry === undefined){
                preserveTrailingEntry = true;
            }
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
            templateEntry = this.getTemplateEntry(templateMatchPosition);
            if( preserveTrailingEntry && (templateEntry instanceof TemplateEntryLabel && templateEntry.fragmentOrder === 0
                    &&  this.inputCache[templateMatchPosition] !== undefined) ){
                // if the next point to delete is the front boundary of a fragment, and the fragment existed before, then
                // preserve this fragment (skip it and delete the entries that come after it)
                templateMatchPosition = templateEntry.templateFragment.getLastEntry().order  + 1;
            }

            this.inputCache.splice(templateMatchPosition, this.inputCache.length);  //delete until last

            return templateMatchPosition;
        },

        groupSelectionRemove: function(selection, updatePresentation){
            if(updatePresentation == undefined){
                updatePresentation = true;
            }
            var caret = selection.caret;
            var inputQueue= this.buildActiveInputQueueAtCaret(caret);
            var activeInput = this.inputMaskStatisticWithinRange(caret, selection.length);
            while(activeInput--){
                inputQueue.shift();
            }
            this.fillActiveInputIntoTemplate(caret, inputQueue, true);
            if(updatePresentation){
                this.displayCache();
                this.setCaretPosition(caret);
            }
            return true;
        },

        inputMaskStatisticWithinRange : function(caret, length){
            var count = 0;
            for(var i = caret, j = 0, l = this.inputCache.length; i < l && j < length; i++){
                var inputEntry = this.inputCache[i];
                if(inputEntry.type != 'L'){
                    count++;
                }
                j++
            }
            return count;
        },

        checkCacheTempered : function(refSelection){
            var value = this.$element.val(), valueLength = value.length,
                cacheLength = this.inputCache.length, diff, start;
            var cache = this.calculateCachePresentation();
            cacheLength = cacheLength - refSelection.length;

            if(value == cache){// no change
                return false;
            }
            var diffLength = valueLength - cacheLength;
            var caret = this.getCaretPosition();
            if(diffLength > 0){ //pasted new stuff
                //the difference would be the 'diffLength'-long portion before caret
                start = caret - diffLength;
                diff = value.substr(start, diffLength);
            }else{
                start = caret;
                diff = this.calculateCachePresentation().substr(start, -diffLength);
            }

            return {diff: diff, start: start, length : diffLength};
        },

        //UI manipulation
        computeFontStyleString: function(){
            var $element = this.$element, style = '';
            var properties = ['font-size', 'font-family', 'font-weight', 'line-height'];
            $.each(properties, function(i, v){
                style += v + ':' + $element.css(v) + ' !important; ';
            });
            return style;
        },

        displayCache : function(){
            this.$element.val(this.calculateCachePresentation());
            if(this.settings['deluxe']){
                this.ui_renderingComponent.html((this.calculateCacheDeluxePresentation()));
                this.normalizeFont(this.ui_renderingComponent);
            }
            this.updatePatternPrompt();
        },
        calculateCachePresentation : function(){
            var output = '';
            for(var i = 0, l = this.inputCache.length; i < l; i++){
                output += this.inputCache[i].value;
            }
            return output;
        },

        calculateCacheDeluxePresentation : function(boundary){
            if(boundary === undefined){
                boundary = this.inputCache.length;
            }
            return this.constructEntriesPresentation(this.inputCache, 0 , boundary);
        },

        updatePatternPrompt : function(){
            var inputText = this.$element.val(), presentation;
            if( this.settings['deluxe'] ){
                presentation = inputText;
            }else{
                presentation = this.calculateCacheDeluxePresentation();
            }
            var output = this.constructEntriesPresentation(this.template, inputText.length, this.template.length);

            this.ui_prompt.css('left', this.measureTextWidth( presentation ) + 'px');
            this.ui_prompt.html( output );
            this.normalizeFont(this.ui_prompt);
        },

        constructEntriesPresentation: function(arr, from, to){
            var output = '';
            for(; from < to; from ++){
                var entry = arr[from], symbol, style = this.settings['css_entry_mask'];
                if(entry.type == 'L'){
                    symbol = escapeHTMLEntities(entry.value) ;
                    style = this.settings['css_entry_label'];
                }else{
                    symbol = charSet[entry.type] || entry.value;
                }
                output += '<span class="' + style + '">' + symbol + '</span>';
            }
            return output;
        },

        normalizeFont: function($element){
            $element.find('span').attr('style', this.fontStyleString);
        },

        measureTextWidth : function(text){
            this.ui_measure.html(text);
            this.normalizeFont(this.ui_measure);
            return this.ui_measure.width();
        },

        showPrompt : function(){
            this.ui_prompt.show();
            this.updatePatternPrompt();
        },

        hidePrompt : function(){
            this.ui_prompt.hide();
        },

        activateCaret: function(position){
            this.deactivateCaret();
            this.updateBlinkPosition(position);
            var func = (function(infoEntry){
                return function(){
                    infoEntry._caretBlinkStatus = !infoEntry._caretBlinkStatus;
                    infoEntry.ui_caretBlink.css('visibility', infoEntry._caretBlinkStatus ? 'visible' : 'hidden');
                }
            })(this);

            this._caretMonitorHandler = window.setInterval(func, BLINK_INTERVAL);
            func();
        },

        deactivateCaret: function(){
            if(this._caretMonitorHandler == null){
                return;
            }
            window.clearInterval(this._caretMonitorHandler);
            this.ui_caretBlink.css('visibility', 'hidden');
            this._caretBlinkStatus = false;
        },

        updateBlinkPosition: function(position){
            if(position === undefined){
                position = this.getCaretPosition();
            }
            var portionToMeasure = this.calculateCacheDeluxePresentation(position);
            this.ui_caretBlink.css('left', this.caretBlinkLeftPatch + this.measureTextWidth( portionToMeasure ) + 'px');
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
                infoEntry.setCaretPosition(caret);
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
