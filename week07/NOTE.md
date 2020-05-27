# 重学浏览器工作原理
## 重学浏览器工作原理
![浏览器工作原理](http://cms-bucket.ws.126.net/2020/0527/08f9aa96p00qazq9h001pc000nt002gc.png)
## 网络模型
## TCP/IP
## HTTP
>https://mp.weixin.qq.com/s/tscvSq40CT0mKNZ71dHLEg
## 状态机
### CSS Computing（使用css npm包）
收集CSS规则
添加调用
获取父元素序列
拆分选择器
- 计算选择器与元素匹配
    - 根据选择器的类型和元素属性，计算是否与当前元素匹配
    - 这里仅仅实现了三种基本选择器， 实际的浏览器中要处理复合选择器
    - 作业（可选）：实现复合选择器，实现支持空格的Class 选择器
- 生成 computed 属性
    - 一旦选择匹配，就应用选择器到元素上，形成 computedStyle
- 确定规则覆盖关系
    - CSS 规则根据 specificity 和后来优先规则覆盖
    - specificity 是个四元组，越左边权重越高
    - 一个 CSS 规则的 specificity 根据包含的简单选择器相加而成
### DOM layout && render
![DOM layout && render](http://cms-bucket.ws.126.net/2020/0527/55658ddcp00qazqha000yc000ii008gc.png)
- 收集元素
![收集元素](http://cms-bucket.ws.126.net/2020/0527/d4fb87edp00qazqj60008c0009v006xc.png)
- 计算主轴
![计算主轴](http://cms-bucket.ws.126.net/2020/0527/96abbbb8p00qazqkn0008c0009i006lc.png)
- 计算交叉值
![计算交叉值](http://cms-bucket.ws.126.net/2020/0527/5af7facdp00qazqlq0008c0009b006yc.png)
- 重绘和重排
![重绘和重排](http://cms-bucket.ws.126.net/2020/0527/3126bf7bp00qazqn3002tc000zj00h3c.png)
