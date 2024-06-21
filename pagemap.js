const pagemap = (canvas, options) => {
  const WIN = window; // 窗口对象
  const DOC = WIN.document; // 文档对象
  const DOC_EL = DOC.documentElement; // HTML 根元素
  const CTX = canvas.getContext("2d"); // 获取 canvas 上下文

  // 生成黑色透明度的颜色
  const black = (pc) => `rgba(0,0,0,${pc / 100})`;

  // 合并用户配置和默认配置
  const settings = Object.assign(
    {
      viewport: null, // 视口元素
      styles: {
        // 不同元素的样式
        "header,footer,section,article": black(8),
        "h1,a": black(10),
        "h2,h3,h4": black(8),
      },
      back: black(2), // 背景颜色
      view: black(5), // 视图颜色
      drag: black(10), // 拖拽颜色
      interval: null, // 刷新间隔
    },
    options
  );

  // 添加或移除事件监听器的辅助函数
  const _listener = (el, method, types, fn) =>
    types.split(/\s+/).forEach((type) => el[method](type, fn));
  const on = (el, types, fn) => _listener(el, "addEventListener", types, fn);
  const off = (el, types, fn) =>
    _listener(el, "removeEventListener", types, fn);

  // 创建矩形对象
  const Rect = (x, y, w, h) => {
    return { x, y, w, h };
  };

  // 相对位置的矩形
  const rect_rel_to = (rect, pos = { x: 0, y: 0 }) => {
    return Rect(rect.x - pos.x, rect.y - pos.y, rect.w, rect.h);
  };

  // 文档矩形
  const rect_of_doc = () => {
    return Rect(0, 0, DOC_EL.scrollWidth, DOC_EL.scrollHeight);
  };

  // 窗口矩形
  const rect_of_win = () => {
    return Rect(
      WIN.scrollX,
      WIN.scrollY, // 修正为 scrollY
      DOC_EL.clientWidth,
      DOC_EL.clientHeight
    );
  };

  // 获取元素相对于文档的偏移
  const el_get_offset = (el) => {
    const br = el.getBoundingClientRect();
    return { x: br.left + WIN.scrollX, y: br.top + WIN.scrollY }; // 修正为 scrollY
  };

  // 元素矩形
  const rect_of_el = (el) => {
    const { x, y } = el_get_offset(el);
    return Rect(x, y, el.offsetWidth, el.offsetHeight);
  };

  // 视口矩形
  const rect_of_viewport = (el) => {
    const { x, y } = el_get_offset(el);
    return Rect(
      x + el.clientLeft,
      y + el.clientTop,
      el.clientWidth,
      el.clientHeight
    );
  };

  // 内容矩形
  const rect_of_content = (el) => {
    const { x, y } = el_get_offset(el);
    return Rect(
      x + el.clientLeft - el.scrollLeft,
      y + el.clientTop - el.scrollTop,
      el.scrollWidth,
      el.scrollHeight
    );
  };

  // 计算缩放比例
  const calc_scale = (() => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    return (w, h) => Math.min(width / w, height / h);
  })();

  // 调整 canvas 尺寸
  const resize_canvas = (w, h) => {
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  };

  const viewport = settings.viewport;
  const find = (sel) => Array.from((viewport || DOC).querySelectorAll(sel));

  let drag = false;
  let root_rect;
  let view_rect;
  let scale;
  let drag_rx;
  let drag_ry;

  let rangeRectLineWidth = 5;

  // 绘制矩形，当是drag或者view时，绘制线框
  const draw_rect = (rect, col, rangeRect = false) => {
    if (col) {
      if (rangeRect && col === "default") {
        CTX.beginPath();
        CTX.strokeStyle = "black";
        CTX.lineWidth = rangeRectLineWidth;
        CTX.strokeRect(rect.x, rect.y, rect.w - rangeRectLineWidth, rect.h - rangeRectLineWidth);
      } else {
        CTX.beginPath();
        CTX.rect(rect.x, rect.y, rect.w, rect.h);
        CTX.fillStyle = col;
        CTX.fill();
      }
    }
  };

  // 应用样式
  const apply_styles = (styles) => {
    Object.keys(styles).forEach((sel) => {
      find(sel).forEach((el) => {
        let col = styles[sel];
        if (col === "default") {
          col = getComputedStyle(el).backgroundColor;
        }
        draw_rect(rect_rel_to(rect_of_el(el), root_rect), col);
      });
    });
  };

  // 绘制地图
  const draw = () => {
    root_rect = viewport ? rect_of_content(viewport) : rect_of_doc();
    view_rect = viewport ? rect_of_viewport(viewport) : rect_of_win();
    scale = calc_scale(root_rect.w, root_rect.h);

    resize_canvas(root_rect.w * scale, root_rect.h * scale);

    CTX.setTransform(1, 0, 0, 1, 0, 0);
    CTX.clearRect(0, 0, canvas.width, canvas.height);
    CTX.scale(scale, scale);

    draw_rect(rect_rel_to(root_rect, root_rect), settings.back);
    apply_styles(settings.styles);
    draw_rect(
      rect_rel_to(view_rect, root_rect),
      drag ? settings.drag : settings.view,
      true
    );
  };

  // 拖拽事件处理
  const on_drag = (ev) => {
    ev.preventDefault();
    const cr = rect_of_viewport(canvas);
    const x = (ev.pageX - cr.x) / scale - view_rect.w * drag_rx;
    const y = (ev.pageY - cr.y) / scale - view_rect.h * drag_ry;

    if (viewport) {
      viewport.scrollLeft = x;
      viewport.scrollTop = y;
    } else {
      WIN.scrollTo(x, y);
    }
    draw();
  };

  // 结束拖拽事件处理
  const on_drag_end = (ev) => {
    drag = false;
    off(WIN, "mousemove", on_drag);
    off(WIN, "mouseup", on_drag_end);
    on_drag(ev);
  };

  // 开始拖拽事件处理
  const on_drag_start = (ev) => {
    drag = true;

    const cr = rect_of_viewport(canvas);
    const vr = rect_rel_to(view_rect, root_rect);
    drag_rx = ((ev.pageX - cr.x) / scale - vr.x) / vr.w;
    drag_ry = ((ev.pageY - cr.y) / scale - vr.y) / vr.h;
    if (drag_rx < 0 || drag_rx > 1 || drag_ry < 0 || drag_ry > 1) {
      drag_rx = 0.5;
      drag_ry = 0.5;
    }

    on(WIN, "mousemove", on_drag);
    on(WIN, "mouseup", on_drag_end);
    on_drag(ev);
  };

  // 初始化
  const init = () => {
    canvas.style.cursor = "pointer";
    on(canvas, "mousedown", on_drag_start);
    on(viewport || WIN, "load resize scroll", draw);
    if (settings.interval > 0) {
      setInterval(() => draw(), settings.interval);
    }
    draw();
  };

  init();

  return {
    redraw: draw,
  };
};
