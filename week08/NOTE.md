# CSS选择器和CSS排版

## CSS选择器讲解

### 复合选择器和复杂选择器

> 复合选择器

- <简单选择器><简单选择器><简单选择器>
- \*或者 div 必须写在最前面

> 复杂选择器(由复合选择器组成)

- <复合选择器> space <复合选择器>
- <复合选择器> ">" <复合选择器>
- <复合选择器> "~" <复合选择器>
- <复合选择器> "+" <复合选择器>
- <复合选择器> "||" <复合选择器>

```js
//选择器的优先级 练习
div#a.b .c[id=x]    [0,1,3,1]
#a:not(#b) [0,2,0,0]   :not这个伪类是不参与优先级计算的
*.a  [0,0,1,0] *也是不参与优先级计算的
div.a  [0]
```

### 伪类和伪元素

> [伪类](https://www.html.cn/qa/css3/16548.html)

- 动态伪类 :hover :link :active :visited
- 结构伪类 :first-child :last-child :nth-child(n) :nth-last-child(n)
- 元素状态伪类 :checked :enabled :disabled
- 语言伪类 :lang(language)
- 逻辑型伪类 :not(type="submit") :where :has
- 目标伪类 :target

> 伪元素

- ::before ::after ::first-line ::first-letter

## CSS排版

### 盒模型

- CSS 排版和渲染的基本单位是**盒**，而不是**元素**。
- box-sizing： content-box border-box 两种盒模型

### 正常流

### 脱离正常流

- float 属于脱离文档流，但是其他盒子元素内的文本依然会为 float 元素让出位置，围绕在周围，所以不会看到文本相互叠加的情况。
- position: absolute; position: fixed; 这些属于脱离文档流，同时文本会出现相互叠加。
- position: relative 并没有脱离正常的文档流。

### BFC （Block Formatting Context 块格式化上下文）

- 正常流中都会产生 BFC， 它仅仅是一个正常流排列的块级的盒子。
- BFC 的 margin 合并（margin 边距折叠）。

  - 当 BFC 块级盒子中 overflow：visible 的时候，会出现竖向 margin 的合并，也就是边距折叠。
  - 所以消除边距折叠的方法就是 overflow:hidden, 就能够解除 margin 的边距折叠。

- flex 是 block level,不是 block container,所以不产生 bfc
  - block 既是 block level，也是 block container， 会产生 bfc

### block-level 和 block-container 的理解

- block-level 表示可以被放入 bfc （也就是说 lex、table、grid、block 都可以被放入 bfc）
- block-container 表示可以容纳 bfc (也就是说 block、inline-block 可以容纳 bfc)
- block-box = block-level + block-container
- block-box 如果 overflow 是 visible， 那么就跟父 bfc 合并

```js
Block-level boxes：flex、table、grid、block
block containers: block、inline-block
block boxes：block
```
