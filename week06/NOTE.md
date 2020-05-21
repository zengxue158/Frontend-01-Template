# 总结 

## 实践记录
### computeCSS+多Class选择器优化
### 实践准备

> npm install css

### 第一步：收集 CSS 规则
- 遇到 style 标签时，我们把 CSS 规则保存起来
- 这里我们调用 CSS Parser 来分析 CSS 规则
- 这里我们必须要仔细研究此库分析 CSS 规则的格式
- computeCss1.js

	```javascript
	const css = require('css')
	
	... some code
	
	// 加入一个新的函数，addCSSRules，这里我们把 CSS 规则暂存到一个数组里
	let rules = []
	function addCSSRules(text) {
	  const ast = css.parse(text)
	  console.log(JSON.stringify(ast, null, "    "))
	  rules.push(...ast.stylesheet.rules)
	}
	
	...some code
	
	function emit(token) {
	
	  ... some code
	  
	   else if (token.type == "endTag") {
	    if (top.tagName != token.tagName) {
	      throw new Error("Tag start end doesn't match")
	    } else {
	      // console.log('pop', stack.pop())
	      /** 遇到 style 标签时，执行添加 CCS 规则的操作 */
	      if (top.tagName === "style") {
	        addCSSRules(top.children[0].content)
	      }
	      stack.pop()
	    }
	    currentTextNode = null
	  }
	  
	  ... some code
	  
	}
	
	```
- 这里，我们需要将添加 CSS 规则操作至元素 pop前，元素 push 后
	- 元素 push 后，也就是 style 标签的子元素文本节点，还未挂载到 style 标签上，styles 标签子元素还是空的
	- pop 前，我们可以取到这个元素

- 运行结果
	- ![第一步运行结果](http://p0.meituan.net/myvideodistribute/01014f5e30127ef5f2b23dd6b7fa44ac153947.png)
- 文本结果

	```json
	{
	    "type": "stylesheet",
	    "stylesheet": {
	        "rules": [
	            {
	                "type": "rule",
	                "selectors": [
	                    "body div #myid"
	                ],
	                "declarations": [
	                    {
	                        "type": "declaration",
	                        "property": "width",
	                        "value": "100px",
	                        "position": {
	                            "start": {
	                                "line": 3,
	                                "column": 9
	                            },
	                            "end": {
	                                "line": 3,
	                                "column": 20
	                            }
	                        }
	                    },
	                    {
	                        "type": "declaration",
	                        "property": "background-color",
	                        "value": "#ff5000",
	                        "position": {
	                            "start": {
	                                "line": 4,
	                                "column": 9
	                            },
	                            "end": {
	                                "line": 4,
	                                "column": 34
	                            }
	                        }
	                    }
	                ],
	                "position": {
	                    "start": {
	                        "line": 2,
	                        "column": 5
	                    },
	                    "end": {
	                        "line": 5,
	                        "column": 6
	                    }
	                }
	            },
	            {
	                "type": "rule",
	                "selectors": [
	                    "body div img"
	                ],
	                "declarations": [
	                    {
	                        "type": "declaration",
	                        "property": "width",
	                        "value": "30px",
	                        "position": {
	                            "start": {
	                                "line": 7,
	                                "column": 9
	                            },
	                            "end": {
	                                "line": 7,
	                                "column": 19
	                            }
	                        }
	                    },
	                    {
	                        "type": "declaration",
	                        "property": "background-color",
	                        "value": "#ff1111",
	                        "position": {
	                            "start": {
	                                "line": 8,
	                                "column": 9
	                            },
	                            "end": {
	                                "line": 8,
	                                "column": 34
	                            }
	                        }
	                    }
	                ],
	                "position": {
	                    "start": {
	                        "line": 6,
	                        "column": 5
	                    },
	                    "end": {
	                        "line": 9,
	                        "column": 6
	                    }
	                }
	            }
	        ],
	        "parsingErrors": []
	    }
	}
	```



### 第二步：添加调用
- 当我们创建一个元素后，立即计算 CSS
- 理论上，当我们分析一个元素时，所有 CSS 规则已经收集完毕
- 在真实浏览器中，可能遇到写在 body 的 style 标签，需要重新 CSS 计算的情况，这里我们忽略
- computeCSS2.js
	
	```javascript
	
	...some code
	
	
	function computeCSS(element) {
	  console.log(rules)
	  console.log("-=-=-=-=-=-=-=")
	  console.log("compute CSS for Element-=-=-=-=-=-=", element)
	  console.log("********************************************")
	}
	
	...some code
	
	function emit(token) {
	
	  ... some code
	  
	  if (token.type == "startTag") {
	    let element = {
	      type: "element",
	      children: [],
	      attributes: []
	    }
	
	    element.tagName = token.tagName
	
	    for (let p in token) {
	      if (p != "type" && p != "tagName") {
	        element.attributes.push({
	          name: p,
	          value: token[p]
	        })
	      }
	    }
	
	    computeCSS(element)
	
	    top.children.push(element)
	    element.parent = top
	
	    if (!token.isSelfClosing)
	      stack.push(element)
	    
	    currentTextNode = null
	    // console.log('push', element)
	  }
	  
	  ... some code
	
	}
	```
	
- 这里一个元素的创建后，tagName, 属性都加好后，就应该有一个 cumputeCSS 过程
- 运行结果
	- ![第二步：添加调用](http://p1.meituan.net/myvideodistribute/634ec08db6e9b90b38c17656be424e2d127292.png)



### 第三步：获取父元素序列
- 在 computeCss 函数中，我们必须知道元素的所有父元素才能判断元素与规则是否匹配
- 我们从上一步骤的 stack，可以获取本元素所有的父元素
- 因为我们首先获取的是”当前元素“，所以我们获得和计算父元素匹配的顺序是从内向外
	- ![从内向外 CSS 匹配](http://p1.meituan.net/myvideodistribute/68af300e9e207b8a190b7c3893f17ff036554.png)
- computeCSS3.js
	
	```javascript
	
	...some code
	
	
	function computeCSS(element) {
      const elements = stack.slice().reverse()
	}
	
	...some code
	
	```
- 运行结果
	- ![第三步运行结果](http://p0.meituan.net/myvideodistribute/706c9c25bc5a46f41f8bc11ba2a6854e250838.png)
- stack.slice() 拷贝原数组，不在 stack 中操作，防御式编程避免影响 stack
	


### 第四步：拆分选择器
- 选择器也要从当前元素从外排列
- 复杂选择器拆成针对单个元素的选择器，用循环匹配父元素队列
- computeCSS4.js
	
	```javascript
	
	...some code
	
	

function specificity(selector) {
  const p = [0, 0, 0, 0]
  const selectorParts = selector.split(" ")
  for (let part of selectorParts) {
    if (part.charAt(0) == "#") {
      p[1] += 1
    } else if (part.charAt(0) == ".") {
      p[2] += 1
    } else {
      p[3] += 1
    }
  }
  return p
}

function compare(sp1, sp2) {
  if (sp1[0] - sp2[0]) {
    return sp1[0] - sp2[0]
  }
  if (sp1[1] - sp2[1]) {
    return sp1[1] - sp2[1]
  }
  if (sp1[2] - sp2[2]) {
    return sp1[2] - sp2[2]
  }
  return sp1[3] - sp2[3]
}

	function computeCSS(element) {
      const elements = stack.slice().reverse()

	  if (!element.computedStyle)
	    element.computedStyle = {}
	  
	  for (let rule of rules) {
	    const selectorParts = rule.selectors[0].split(" ").reverse()
	
	    if (!match(element, selectorParts[0]))
	      continue
	
	    let matched = false
	
	    let j = 1
	
	    for (let i = 0; i < elements.length; i ++) {
	      if (match(elements[i], selectorParts[j])) {
	        j ++
	      }
	    }
	    if (j >= selectorParts.length) {
	      matched = true
	    }
	    if (matched) { // 匹配成功
	      console.log("Element", element, "matched rule", rule)
	    }
	  }
	}
	
	...some code
	
	```


### 第五步：计算选择器与元素匹配
- 根据选择器的类型和元素属性，计算是否与当前元素匹配
- 这里仅实现了三种基本选择器，实际的浏览器中要处理复合选择器
- computeCSS5.js
	
	```javascript
	
	...some code
	
	
	function match(element, selector) {
	  if (!selector || !element.attributes) 
	    return false
	  
	  if (selector.charAt(0) == "#") {
	    const attr = element.attributes.filter(attr => attr.name === "id")[0]
	    if (attr && attr.value === selector.replace("#", ''))
	      return true
	  } else if (selector.charAt(0) == ".") {
	    const attr = element.attributes.filter(attr => attr.name === "class")[0]
	    if (attr && attr.value === selector.replace(".", ''))
	      return true
	  } else {
	    if (element.tagName === selector) {
	      return true
	    }
	  }
	  return false
	}
	
	...some code
	
	```
	
- 运行结果
	- ![第五步运行结果](http://p0.meituan.net/myvideodistribute/e23fb1db77239166c990b52468b24451353540.png)

#### 第五步优化：实现支持空格的 Class 选择器
- 假如我们的 html 改成这样：

	```html
	<html maaa=a >
		<head>
		    <style>
		body div #myid{
		    width:100px;
		    background-color: #ff5000;
		}
		body div img{
		    width:30px;
		    background-color: #ff1111;
		}
		
		body div .cls1 {
		  background-color: #ff9906;
		}
		    </style>
		</head>
		<body>
		    <div>
		        <img id="myid"/>
		        <img class="cls1 cls2"/>
		    </div>
		</body>
	</html>
	```
- 在 <img> 增加多个 class 选择器，那我们的选择器 match 可以改成

	```javascript
	
	...some code
	
	
	function match(element, selector) {
	  if (!selector || !element.attributes) 
	    return false
	  
	  if (selector.charAt(0) == "#") {
		    
		...some code
		
		
	  } else if (selector.charAt(0) == ".") {
	    const attr = element.attributes.filter(attr => attr.name === "class")[0]
	    if (attr) {
	      const attrClassArray = attr.value.split(' ')
	      for (let attrClass of attrClassArray) {
	        if (attrClass === selector.replace(".", '')) {
	          return true
	        }
	      }
	    }
	  } else {
			    
		...some code
		
		
	  }
		...some code
		
	}
	
	...some code
	
	```
- 思路：
	- 我们可以看到
		- ![多 class 选择器](http://p0.meituan.net/myvideodistribute/a8b9d9396713239928cd8b0af216535e40897.png)
	- 我们可以将 元素 attr 根据空格分隔，再利用循环匹配
- 运行结果
	- ![第五步优化运行结果](http://p1.meituan.net/myvideodistribute/1d5533479cdb7d6c1a0af20acdfc4e71146017.png)

### 第六步：生成 computed 属性
- 一旦选择匹配，就应用选择器到元素上，形成 computedStyle
- computeCSS6.js
	
	```javascript
	
	...some code
	
	
	function computeCSS(element) {
		
		...some code
		
		
	    if (matched) { // 匹配成功
	      const computedStyle = element.computedStyle
	      for (let declaration of rule.declarations) {
	        if (!computedStyle[declaration.property]) {
	          computedStyle[declaration.property] = {}
	        }
	        computedStyle[declaration.property].value = declaration.value
	      }
	      console.log(element.computedStyle)
	    }
		
		...some code
		
		
	}
	
	...some code
	
	```
	
- 运行结果
	- ![第六步运行结果](http://p0.meituan.net/myvideodistribute/71888ca9220eb11196bc00eb407fb05980361.png)

### 第七步：确定规则覆盖关系
- CSS 规则根据 specificity 和后来优先规则覆盖
- specificity 是个四元组，越左边权重越高
- 一个 CSS 规则的 specificity 根据包含的简单选择器相加而成
- ![selectors-3 specificity](http://p0.meituan.net/myvideodistribute/a50f3ae53878adbacbdcb7798632605e283940.png)
- computeCSS7.js
	
	```javascript
	
	...some code

	function specificity(selector) {
	  const p = [0, 0, 0, 0]
	  const selectorParts = selector.split(" ")
	  for (let part of selectorParts) {
	    if (part.charAt(0) == "#") {
	      p[1] += 1
	    } else if (part.charAt(0) == ".") {
	      p[2] += 1
	    } else {
	      p[3] += 1
	    }
	  }
	  return p
	}
	
	function compare(sp1, sp2) {
	  if (sp1[0] - sp2[0]) {
	    return sp1[0] - sp2[0]
	  }
	  if (sp1[1] - sp2[1]) {
	    return sp1[1] - sp2[1]
	  }
	  if (sp1[2] - sp2[2]) {
	    return sp1[2] - sp2[2]
	  }
	  return sp1[3] - sp2[3]
	}
	
	
	function computeCSS(element) {
		
		...some code
		
		
	    if (matched) { // 匹配成功
	      const sp = specificity(rule.selectors[0])
	      const computedStyle = element.computedStyle
	      for (let declaration of rule.declarations) {
	        if (!computedStyle[declaration.property]) {
	          computedStyle[declaration.property] = {}
	        }
	        if (!computedStyle[declaration.property].specificity) {
	          computedStyle[declaration.property].value = declaration.value
	          computedStyle[declaration.property].specificity = sp
	        } else if (compare(computedStyle[declaration.property].specificity, sp) < 0) {
	          computedStyle[declaration.property].value = declaration.value
	          computedStyle[declaration.property].specificity = sp
	        }
	      }
	    }
			
		...some code
		
		
	}
	
	...some code
	
	```
	


- 运行结果
	- ![第七步运行结果](http://p1.meituan.net/myvideodistribute/063c59deee7d24e437fdff9920aec8ea216464.png)
	- ![第七步运行结果](http://p1.meituan.net/myvideodistribute/c3a7fb73c0d001fef48137c4a23144b6211501.png)


### 参考文献
- [CSS 优先级是如何计算的？](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Specificity)
- [selectors-3 specificity](https://drafts.csswg.org/selectors-3/#specificity)


## 写在后面
- [完整代码地址-戳我戳我戳我](https://github.com/Ele-Peng/toy-browser)
- 学而不思则罔 互勉
- 祝大家多多发财