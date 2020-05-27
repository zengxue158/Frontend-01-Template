/**
 * 接收 HTML 字符串 转换成 DOM 树
 * 主要标签： 开始标签 结束标签 自封闭标签
 */
const css = require('css');
const layout = require('./layout');
// 注： images 不支持 node 10以上的版本；
const images = require('images');
const render = require('./render');

const EOF = Symbol('EOF'); // EOF: End of File
const letter = new RegExp(/^[a-zA-Z]$/);
const whiteSpace = new RegExp(/^[\t\t\f ]$/);

let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;
let stack = [{type: 'document', children: []}];


// 将css规则存放到数组里
let rules = [];
function addCSSRules(text) {
    let ast = css.parse(text);
    // console.log(JSON.stringify(ast, null, "    "));
    rules.push(...ast.stylesheet.rules);
}

function match(element, selector) {
    if (!selector || !element.attribute) {
        return false;
    }
    if (selector.charAt(0) == '#') {
        let attr = element.attribute.filter(attr => attr.name === 'id')[0]
        if (attr && attr.value === selector.replace('#', '')) {
            return true;
        } else if (selector.charAt(0) == '.') {
            let attr = element.attribute.filter(attr => attr.name === 'class')[0]
            if (attr && attr.value === selector.replace('.', '')) return true;
        } else {
            if (element.tarName === selector) {
                return true;
            }
        }
        return false;
    }
}

function specificity(selector) { 
    let p = [0, 0, 0, 0];
    let selectorParts = selector.split(' ');
    for (let part of selectorParts) {
        if (part.charAt(0) == '#') {
            p[1] += 1;
        } else if (part.charAt(0) == '.') {
            p[2] += 1;
        } else {
            p[3] += 1;
        }
    }
    return p;
}

function compare(sp1, sp2) {
    if (sp1[0] - sp2[0]) {
        return sp1[0] - sp2[0];
    } 
    if (sp1[1] - sp2[1]) {
        return sp1[1] -sp2[1];
    }
    if (sp1[2] - sp2[2]) {
        return sp1[2] -sp2[2];
    }
    return sp1[3] -sp2[3];
}

function computeCSS(element) {
    let elements = stack.slice().reverse();
    if (!element.computedStyle) {
        element.computedStyle = {};
    }
    for (let rule of rules) {
        let selectorParts = rule.selectors[0].split(' ').reverse();
        if (!match(element, selectorParts[0])) continue;
        let matched = false;
        let j = 1;
        for (let i = 0, len = elements.length; i < len; i++) {
            if (match(elements[i]), selectorParts[j]) {
                j++;
            }
        }
        if (j >= selectorParts.length) {
            matched = true;
        }
        if (matched) {
            let sp = specificity(rule.selectors[0]);
            let computedStyle = element.computedStyle;
            for (let declaration of rule.declarations) {
                if (!computedStyle[declaration.property]) {
                    computedStyle[declaration.property] = {};
                }
                if (!computedStyle[declaration.property].specificity) {
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                } else if (compare(computedStyle[declaration.property].specificity, sp) < 0) {
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                }
            }
            console.log(element.computedStyle);
        }
    }
}

function emit(token) {
    let top = stack[stack.length - 1];
    if (token.type == 'startTag') {
        let element = {
            type: 'element',
            children: [],
            attribute: []
        }
        element.tagName = token.tagName;
        for (let p in token) {
            if (p != 'type' || p != 'tagName') {
                element.attribute.push({
                    name: p,
                    value: token[p],
                })
            }
        }
        computeCSS(element);
        top.children.push(element);

        if (!token.isSelfClosing) {
            stack.push(element);
        }
        currentTextNode = null;
    } else if (token.type == 'endTag') {
        if (top.tagName != token.tagName) {
            throw new Error("Tag start end doesn't match!")
        } else {
            if (top.tagName === 'style') {
                addCSSRules(top.children[0].content);
            }
            layout(top);
            stack.pop();
        }
        currentTextNode = null;
    } else if (token.type == 'text') {
        if (currentTextNode == null) {
            currentTextNode = {
                type: 'text',
                content: '',
            }
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
    
}

function data(c) {
    if (c == '<') {
        return tagOpen;
    } else if (c == EOF) {
        emit({
            type: 'EOF',
        });
        return;
    } else {
        emit({
            type: 'text',
            content: c,
        });
        return data;
    }
}

function tagOpen(c) {
    if (c == '/') {
        return endTagOpen;
    } else if (c.match(letter)) {
        currentToken = {
            type: 'startTag',
            tagName: '',
        };
        return tagName(c);
    } else {
        emit({
            type: 'text',
            content: c,
        });
        return;
    }
}

function tagName(c) {
    if (c.match(whiteSpace)) {
        return beforeAttributeName;
    } else if (c == '/') {
        return selfClosingStartTag;
    } else if (c.match(letter)) {
        currentToken.tagName += c;
        return tagName;
    } else if (c == '>') {
        emit(currentToken);
        return data;
    } else {
        return tagName;
    }
}

function endTagOpen(c) {
    if (c.match(letter)) {
        currentToken = {
            type: 'endTag',
            tagName: '',
        };
        return tagName(c);
    } else if (c == '>') {
        return endTagOpen;
    } else if (c == EOF) {
    } else {
        return;
    }
}

function beforeAttributeName(c) {
    if (c.match(whiteSpace)) {
        return beforeAttributeName;
    } else if (c == '>' || c == '/' || c == EOF) {
        return afterAttributeName(c);
    } else if (c == '=') {
        // return beforeAttributeName;
    } else {
        currentAttribute = {
            name: '',
            value: '',
        };
        return attributeName(c);
    }
}

function attributeName(c) {
    if (c == '>' || c == '/' || c == EOF || c.match(whiteSpace)) {
        return afterAttributeName(c);
    } else if (c == '=') {
        return beforeAttributeValue;
    } else if (c == '\u0000') {
    } else if (c == '"' || c == "'" || c == '<') {
    } else {
        currentAttribute.name += c;
        return  attributeName;
    }
}

function afterAttributeName(c) {
    if (c.match(whiteSpace)) {
        return afterAttributeName;
    } else if (c == '/') {
        return selfClosingStartTag;
    } else if (c == '=') {
        beforeAttributeValue
        
    } else if (c == '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }else if (c == EOF) {
    } else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: '',
            value: '',
        }
        return afterAttributeName(c);
    }
}

function beforeAttributeValue(c) {
    if (c == '>' || c == '/' || c == EOF || c.match(whiteSpace)) {
        return beforeAttributeValue;
    } else if (c == '"') {
        return doubleQuotedAttributeValue;
    } else if (c == "'") {
        return singleQuotedAttributeValue;
    } else if (c == '>') {
    } else {
        return UnquotedAttributeValue(c);
    }
}

function afterQuotedAttributeValue(c) {
    if (c.match(whiteSpace)) {
        return beforeAttributeName;
    } else if (c == '/') {
        return selfClosingStartTag;
    } else if (c == '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c == EOF) {
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function doubleQuotedAttributeValue(c) {
    if (c == '\"') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c == '\u0000') {
    } else if (c == EOF) {
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function singleQuotedAttributeValue(c) {
    if (c == '\'') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c == '\u0000') {
    } else if (c == EOF) {
    } else {
        currentAttribute.value += c;
        return singleQuotedAttributeValue;
    }
}

function UnquotedAttributeValue(c) {
    if (c.match(whiteSpace)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c == '/') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if (c == '>') {
        selfClosingStartTag;
    } else if (c == '\u0000') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c == '"' || c == "'" || c == '<' || c == '=' || c == '`') {
    } else if (c == EOF) {
    } else {
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}

function selfClosingStartTag(c) {
    if (c == '>') {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if (c == EOF) {
    } else {
    }
}


function parseHTML(html) {
    let state = data;
    for (let c of html) {
        state = state(c);
    }
    state = state(EOF);
    return stack[0];
}

const html = `<html maaa=a >
<head>
    <style>
.box {
    width: 500px;
    display: flex;
    justify-content: space-around;
}
.box1 {
    width:100px;
    background-color: red;
}
.box2{
    width:30px;
    background-color: blue;
}
    </style>
</head>
<body>
    <div class="box" disabled='true' >
        <div class="box1"></div>
        <div class="box2"></div>
    </div>
</body>
</html>`;

let dom = parseHTML(html);

let viewport = images(800, 600);

render(viewport, dom);

viewport.save('viewport.jpg');

// module.exports.parseHTML = parseHTML;
