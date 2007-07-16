/* 
 * Author: Oliver Steele
 * Copyright: Copyright 2007 by Oliver Steele.  All rights reserved.
 * License: MIT License
 * Homepage: http://osteele.com/javascripts/functional
 * Created: 2007-07-15
 * Modified: 2007-07-16
 */

Functional.install();

function Evaluator(rootName, enableTranscript) {
    this.enableTranscript = arguments.length >= 2 ? enableTranscript : true;
    var elements = this.elements = {transcript:{}};
    setElements(elements, {
        input: '.input-column .current',
        output: '.output-column .current',
        evalButton: '.eval-button'
    });
    setElements(elements.transcript, {
        controls: '.transcript-controls',
        toggle: '.transcript-controls .toggle',
        clear: '.transcript-controls .clear',
        input: '.input-column .transcript',
        output: '.output-column .transcript'
       });
    
    this.lastRecord = null;
    this.observeElements();
    this.setShowTranscript($F(elements.transcript.toggle));
    $(elements.transcript.controls).hide();
    this.recenterButton();
    function setElements(table, paths) {
        $H(paths).each(function(item) {
            var path = rootName+' '+item[1];
            var elt = table[item[0]] = $$(path)[0];
            elt || console.error("Couldn't find $$('"+path+'")');
        });
    }
}

Evaluator.prototype.setShowTranscript = function(visible) {
    var elements = this.elements;
    [elements.transcript.input, elements.transcript.output, elements.transcript.clear].invoke(visible ? 'show' : 'hide');
    this.transcript = visible;
}

Evaluator.prototype.observeElements = function() {
    var elements = this.elements;
    var transcript = elements.transcript;
    Event.observe(transcript.toggle, 'click', function() {
        this.setShowTranscript($F(transcript.toggle));
        this.recenterButton();
    }.bind(this));
    Event.observe(transcript.clear, 'click', function() {
        // should unobserve the vanished elements, but I don't
        // think it matters for interactive use
        transcript.input.innerHTML = '';
        transcript.output.innerHTML = '';
        transcript.controls.hide();
        this.recenterButton();
    }.bind(this));
    Event.observe(elements.input, 'keyup', function(e) {
        if (e.keyCode == 13) {
            this.eval();
            Event.stop(e);
        }
    }.bind(this));
    Event.observe(elements.evalButton, 'click', this.eval.bind(this).saturate());
}

Evaluator.prototype.eval = function(text) {
    var inputElement = this.elements.input;
    var outputElement = this.elements.output;
    var transcriptElements = this.elements.transcript;
    if (arguments.length < 1)
        var text = inputElement.value.strip().replace('\n', '');
    inputElement.value = text;
    text = text.replace(/^\s*var\s+/, '');
    text = text.replace(/^\s*function\s+([A-Z_$][A-Z_$\d]*)/i, '$1 = function');
    var html;
    try {
        var value;
        value = eval(text);
        html = Evaluator.toString(value).escapeHTML();
    } catch (e) {
        html = 'Error: ' + e;
    }
    outputElement.innerHTML = html;
    if (this.lastRecord) {
        function update(elt, text) {
            elt.innerHTML = elt.innerHTML ? elt.innerHTML + '\n' + text : text;
        }
        //update(transcriptElements.input, this.lastRecord.input.escapeHTML());
        var e = document.createElement('div');
        e.className = 'input';
        e.innerHTML = this.lastRecord.input;
        transcriptElements.input.appendChild(e);
        this.makeClickable([e]);
        update(transcriptElements.output, this.lastRecord.output);
        if (this.enableTranscript) {
            transcriptElements.controls.show();
            transcriptElements.clear.show();
        }
        this.recenterButton();
    }
    this.lastRecord = {input: text, output: html};
}

Evaluator.toString = function(value) {
    if (value instanceof Array) {
        var spans = map(Evaluator.toString, value);
        return '[' + spans.join(', ') + ']';
    }
    switch (typeof(value)) {
    case 'function': return 'function()';
    case 'string': return '"' + value + '"';
    default: return value ? value.toString() : ''+value;
    }
}

// I'm not smart enough to figure out how to do this in CSS.
// This won't keep up with some display change, but oh well.
Evaluator.prototype.recenterButton = function() {
    var button = this.elements.evalButton;
    var heights = map('Element.getHeight(_)', [this.elements.input, this.elements.output, button]);
    var max = Math.max(heights[0], heights[1]);
    var y = Math.floor((max - heights[2]) / 2) + 10;
    if (this.transcript)
        y += Element.getHeight(this.elements.transcript.input);
    button.style.marginTop = y + 'px';
}

Evaluator.prototype.makeClickable = function(elements) {
    function handler(e) {
        var text = Event.element(e).innerHTML.unescapeHTML();
        gEval.eval(text);
    }
    map(Event.observe.bind(Event).partial(_, 'click', handler), elements);
}

