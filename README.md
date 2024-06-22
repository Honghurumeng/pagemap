# pagemap

这是一个能快速为你的网页中的 dom 内容生成小地图的组件，使用 querySelector，默认使用 dom 背景色，可以进行拖拽以滚动页面。

<img src="./assets/截屏2024-06-21%2010.02.45.png" width="200" height="120">

## Usage

CSS

```css
#map {
  position: fixed;
  top: 0;
  right: 0;
  width: 200px;
  height: 100%;
  z-index: 100;
}
```

HTML

```html
<canvas id="map"></canvas>
```

Script

```javascript
<script src="./pagemap.js"></script>;

var pageInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  // pageMap使用需要等到页面加载完成
  pageInstance = pagemap(document.querySelector("#map"), {
    // viewport: document.getElementById("board"),
    viewport: null,
    styles: {
      // 注意：要展示在前面的元素要写在后面
      // "#topPanel": "rgba(0,0,0,0.08)",
      // ".list,.add-list": "rgba(0,0,0,0.3)",
      ".list,.add-list": "default",
      // ".card": "rgba(0,0,0,0.5)",
      ".card": "default",
      // "h2,h3,h4": "rgba(0,0,0,0.08)",
    },
    back: "rgba(0,0,0,0.2)",
    // view: "rgba(0,0,0,0.4)",
    // drag: "rgba(0,0,0,0.4)",
    view: "default",
    drag: "rgba(0,0,0,0.4)",
    interval: null,
  });
});
```

## 刷新

有两种方式：

一种是设置 styles.interval （单位：ms），minimap 就会进行自动刷新

```javascript
if (settings.interval > 0) {
  setInterval(() => draw(), settings.interval);
}
```

一种是使用 api，在合适的逻辑点进行调用：

```javascript
pageInstance.redraw();
```
