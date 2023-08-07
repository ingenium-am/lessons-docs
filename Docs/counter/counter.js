// General capacity for counters' init
const BYTE_SIZE = 1;

// Numeric limit
const MAX_BINARY = 2**(BYTE_SIZE*8) - 1;

// Hint for Statusbar
const STATUS = 'Try thumbwheel switches of digits';


// --- CLASS INIT --- //

function Counter(name, base) {
    
    this.name = name;
    this.base = base;
    this.prefix = name.slice(0,3);
    this.size = initSize(this);
    this.digits = initDigits(this);
    this.counter = getEmptyCounter(this);

    this.formattedTitle = this.name.charAt(0).toUpperCase() + this.name.slice(1);
    this.formattedBase = 'Base ' + this.base;
    this.formattedDigits = 'Digits [ ' + this.digits.split('').join(' ') + ' ]';

    this.incrementCounter = function() {
        let nextNum = this.getNumValue() + 1;
        if (nextNum <= MAX_BINARY) {
            this.counter = newCounter(this, nextNum);
        } else {
            return [false, nextNum + ' - exceeding ' + BYTE_SIZE + ' byte!'];
        }
        return [true];
    };

    this.decrementCounter = function() {
        let nextNum = this.getNumValue() - 1;
        if (nextNum >= 0) {
            this.counter = newCounter(this, nextNum);
        } else {
            return [false, 'Negative numbers are not available!'];
        }
        return [true];
    };

    this.resetCounter = function() {
        this.counter = getEmptyCounter(this);
        return [true];
    }

    this.updateDigit = function(counterIndex, isInc) {
        let i = digitIndex(this, counterIndex);
        let tempCounter = this.counter.slice();
        if (isInc) {
            tempCounter[counterIndex] = i === (this.digits.length - 1) ? this.digits[0] : this.digits[i + 1];
        } else {
            tempCounter[counterIndex] = i === 0 ? this.digits[this.digits.length - 1] : this.digits[i - 1];
        }

        let num = getNumByArray(tempCounter, this.base);
        if (num <= MAX_BINARY) {
            this.counter = tempCounter;
        } else {
            return [false, num + ' - exceeding ' + BYTE_SIZE + ' byte!'];
        }
        return [true];
    }

    this.updateByNumberChecked = function(num) {
        this.counter = newCounter(this, num);
    }

    this.getNumValue = function() {
        return getNumByArray(this.counter, this.base);
    }

    function getNumByArray(counterArray, base) {
        return parseInt(counterArray.join(''), base);
    }

    function digitIndex(counter, counterIndex) {
        if (counterIndex < 0 || counterIndex >= counter.size) return;
        let n = counter.counter[counterIndex];
        return counter.digits.toLowerCase().indexOf(n.toLowerCase());
    }

    function newCounter(counter, num) {
        let numStr = num.toString(counter.base);
        while (numStr.length < counter.size) {
            numStr = "0" + numStr;
        }
        return numStr.split('');
    }

    function initSize(obj) {
        return Math.ceil(Math.log(2**(BYTE_SIZE*8)) / Math.log(obj.base));
    }

    function initDigits(obj) {
        let digits = "";
        for (i = 0; i < Math.min(obj.base, 10); i++) {
            digits += i;
        }
        if (obj.base > 10) {
            for (i = 65; i < 65 + (obj.base - 10); i++) {
                digits += String.fromCharCode(i);
            }
        }
        return digits;
    }
    
    function getEmptyCounter(obj) {
        let array = []
        for (i = obj.size; i > 0; i--) {
            array.push('0');
        }
        return array;
    }
}

// --- MODEL INIT --- //

// COUNTERS OBJECT - KEY(prefix) : VALUE(self)
const COUNTERS = [
    // CREATE NEW COUNTER HERE
    
    new Counter('binary', 2),
    new Counter('hexadecimal', 16),
    new Counter('decimal', 10)
    
].reduce(function(obj, item) {
    obj[item['prefix']] = item;
    return obj;
}, {});


// --- FUNCTIONS --- //      

function updateCounter(cellId) {
    let idSplit = cellId.split('-');
    let prefix = idSplit[0]
    let suffix = idSplit[1];
    let counterIndex = suffix.substring(2);

    let counter = COUNTERS[prefix];
    let result = counter.updateDigit(counterIndex, suffix[0] === 't'); // t = top/increment
    syncOtherCounters(counter, result);
}

function syncOtherCounters(refCounter, result) {
    if (result[0]) {
        Object.values(COUNTERS).forEach(function(counter) {
            if (counter.name !== refCounter.name) {
                let newNumber = refCounter.getNumValue();
                counter.updateByNumberChecked(newNumber);
            }
        });
    }
    updateCounterTables(result);
}

function increment() {
    let counters = Object.values(COUNTERS);
    let result = counters[0].incrementCounter();
    if (result[0]) {
        for (i = 1; i < counters.length; i++) {
            counters[i].incrementCounter();
        }
    }
    updateCounterTables(result);
}

function decrement() {
    let counters = Object.values(COUNTERS);
    let result = counters[0].decrementCounter();
    if (result[0]) {
        for (i = 1; i < counters.length; i++) {
            counters[i].decrementCounter();
        }
    }
    updateCounterTables(result);
}

function reset() {
    Object.values(COUNTERS).forEach(function(counter) {
        counter.resetCounter();
    });
    updateCounterTables([true]);
}


// --- VIEW UPDATE --- //

function updateCounterTable(counter, result) {

    let counterArray = counter.counter;
    
    for (i = 0; i < counterArray.length; i++) {
        let cellCharValue = counterArray[i].toLowerCase();
        let charCode = cellCharValue.charCodeAt();
        let cellNumValue = parseInt(cellCharValue);
        if (charCode >= 97) {
            cellNumValue = (charCode - 97) + 10;
        }
        let newPosition = (cellNumValue === 0 ? '0' : '-' + cellNumValue*22) + 'px 0px';
        let cellNodes = document.getElementById(counter.prefix)
            .firstChild
            .firstChild
            .getElementsByClassName('numbers')[0].childNodes;
        cellNodes[i].style.backgroundPosition = newPosition;
    }
}

function updateCounterTables(result) {
    let statusbar = document.getElementById('statusbar');
    
    if (result[0]) {
        Object.values(COUNTERS).forEach(function(counter) {
            updateCounterTable(counter, result);
        });
        
        if (statusbar.innerText != STATUS) {
            statusbar.innerText = STATUS;
            statusbar.style.color = '';
        }
    } else {
        statusbar.innerText = result[1];
        statusbar.style.color = '#CC0000';
    }
}


// --- VIEW CREATE --- //

const COUNTER_ROWS = ['top-toggles', 'numbers', 'bot-toggles'];
const COUNTER_ROWS_SUF = COUNTER_ROWS.map(function(name) {
    return (name === 'numbers') ? '' : name.split('-').reduce(function(x1, x2) {return x1[0] + x2[0]})
});

function buildElement(tag, parent, attrs) {
    let obj = document.createElement(tag);
    setAttributes(obj, attrs);
    parent.appendChild(obj);
    return obj;
}

function setAttributes(obj, attrMap) {
    Object.keys(attrMap).forEach(function(key) {
        obj.setAttribute(key, attrMap[key]);
    });
}

function createTitle() {
    let title = BYTE_SIZE + '-BYTE COUNTER';
    document.getElementsByTagName('title')[0].innerText = title;

    let div = buildElement('div', document.body, {'id': 'title'});
    let h2 = buildElement('h2', div, {});
    h2.innerText = title;
}

function createCounterTable(counter) {

    let div = buildElement('div', document.body, {'class': 'counter-container', 'id': counter.prefix});
    let table = buildElement('table', div, {'class': 'counter'});
    let tableBody = buildElement('tbody', table, {'class': 'counter'});

    // Row loop
    for (i = 0; i < COUNTER_ROWS.length; i++) {

        let row = buildElement('tr', tableBody, {'class': COUNTER_ROWS[i]});

        let cellAttrs = COUNTER_ROWS_SUF[i] === '' ? {} : {'onclick': 'updateCounter(id)'};
        cellAttrs['class'] = COUNTER_ROWS[i].slice(0, -1);
    
        for (j = 0; j < counter.size; j++) {
            cellAttrs['id'] = counter.prefix + '-' + COUNTER_ROWS_SUF[i] + j;
            buildElement('td', row, cellAttrs);
        }
    }

    let divDesc = buildElement('div', document.body, {'class': 'counter-desc'});
    let pName = buildElement('p', divDesc, {'class': 'counter-name', 'id': counter.prefix + '-name'});
    pName.innerHTML = counter.formattedTitle;
    
    let pAnn = buildElement('p', divDesc, {'class': 'counter-ann', 'id': counter.prefix + '-ann'});
    pAnn.innerHTML = counter.formattedBase + ' - ' + counter.formattedDigits; 
}

function createButtons() {
    
    let div = buildElement('div', document.body, {'id': 'buttons-container'});
    let statusbar = buildElement('p', div, {'id': 'statusbar'});
    statusbar.innerText = STATUS;
    let table = buildElement('table', div, {'class': 'buttons'});
    let tableBody = buildElement('tbody', table, {'class': 'buttons'});
    let row = buildElement('tr', tableBody, {'class': 'buttons'});
    buildElement('td', row, {'id': 'decButton', 'onclick': 'decrement()'});
    buildElement('td', row, {'id': 'rstButton', 'onclick': 'reset()'});
    buildElement('td', row, {'id': 'incButton', 'onclick': 'increment()'});
}

function onLoad() {

    createTitle();

    Object.values(COUNTERS).forEach(function(counter) {
        createCounterTable(counter);
    });

    createButtons();
}

window.onload = onLoad;
