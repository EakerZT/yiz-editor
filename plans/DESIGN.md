# DesignerCanvas 设计文档

## 1. 文档状态

- 状态：第一版组件包已建立，API 仍处于早期阶段。
- 当前工程：`@eakerzt/yiz-editor` Vue 3 + TypeScript 组件库。
- 使用目标：由打印模板设计器与大屏设计器共享同一套画布交互内核。
- 参考项目：[`vue3-sketch-ruler`](https://github.com/kakajun/vue3-sketch-ruler)。
- 实现原则：参考成熟交互，不复制第三方源码，不把第三方组件作为运行时依赖。
- 待实现方案：撤销、重做与历史记录见 [`HISTORY.md`](./HISTORY.md)。

## 2. 为什么不是单独的标尺组件

标尺只是画布坐标系统的可视化。如果只实现标尺，使用方仍需分别处理：

- zoom 与 offset。
- DOMRect、滚动位置和鼠标坐标换算。
- 组件拖入坐标。
- 元素移动和尺寸调整。
- 标尺与画布同步。
- px/mm 单位转换。
- 辅助线与业务结构线。

这会让最复杂的部分继续散落在每个设计器中。因此公共能力升级为 `DesignerCanvas`：它统一坐标、视口和元素几何交互，外部通过插槽提供业务内容。

## 3. 定位

```text
DesignerCanvas
├─ TransformEngine       坐标转换、缩放、平移、fit、center
├─ UnitAdapter           px/mm/未来自定义单位
├─ CanvasRuler           横纵标尺与动态刻度
├─ GuideLayer            用户辅助线
├─ Stage                 业务画布
├─ BackgroundLayer       业务背景，位于元素下方
├─ ElementLayer          元素几何包装层
├─ WorldOverlay          业务结构覆盖层，位于元素上方
├─ SelectionLayer        单选、多选、框选
├─ HoverLayer            hover 描边与外部事件
├─ MoveController        元素移动与键盘微调
├─ ResizeController      八方向尺寸调整
├─ SnapEngine            网格/画布/辅助线/元素吸附
└─ element slot          外部业务渲染
```

它是“无业务渲染的设计器内核”，而不是打印模板组件或大屏组件。

## 4. `vue3-sketch-ruler` 相对当前目标的不足

这里的不足是抽象边界不匹配，而不是第三方项目本身存在缺陷。

### 4.1 像素画布模型不足以表达打印业务单位

打印模板必须满足：

- 模型永久保存 mm。
- DOM 使用 CSS px 渲染。
- 标尺显示 mm。
- 拖动、缩放结果按 mm 精度返回。
- 编辑器 zoom 不进入模板数据。

仅修改标尺标签不能解决刻度、换算、吸附和舍入问题。

### 4.2 scale/offset 还不是完整坐标契约

业务元素需要稳定的转换 API，而不是自行组合 scale、offset、DOMRect 和 scroll：

```ts
viewportToWorld()
worldToViewport()
viewportDeltaToWorld()
worldToStage()
stageToWorld()
worldLengthToStage()
stageLengthToWorld()
```

### 4.3 辅助线模型需要更明确

简单的横纵数值数组缺少：

- 稳定 id。
- 单条锁定与可见性。
- 创建、移动、删除事件。
- 业务单位精度。
- 与页眉、页脚、安全区等业务结构线的边界。

### 4.4 元素交互与视口输入需要统一仲裁

画布平移、元素移动、尺寸调整、框选和辅助线移动不能同时拥有同一指针。当前原型通过单一 Operation 状态保证一次只有一种交互。

### 4.5 只提供视口仍会让元素交互重复

大屏和打印模板都需要选择、移动、缩放与边界限制。如果这些能力继续留在业务元素中，元素仍需知道 zoom 和坐标实现细节。因此原型继续向上抽象了 ElementLayer。

## 5. 公共层与业务层边界

### 5.1 DesignerCanvas 负责

- World 坐标系统。
- zoom、offset、平移和指针中心缩放。
- 标尺和用户辅助线。
- 世界坐标背景层与业务结构覆盖层。
- 元素定位外层。
- 单选、多选、框选。
- 多选统一边界框。
- 元素 hover 状态、描边与事件。
- 移动和尺寸调整。
- 键盘微调。
- Shift 等比缩放。
- 吸附候选计算与吸附提示线。
- 操作开始、变化、结束事件。
- 画布边界与外部约束回调。
- 外部 HTML5 拖放接收与落点世界坐标换算。

### 5.2 外部业务负责

- 元素类型和业务字段。
- `#element` 插槽内容。
- 打印页眉、页脚、表格与分页。
- 大屏图表加载和预览行为。
- 模板与页面 Schema。
- 数据保存。
- 删除确认和撤销重做。
- 业务结构线。
- PDF 或正式页面渲染。

## 6. 坐标模型

定义四个坐标空间：

| 空间     | 含义                       | 单位     |
| -------- | -------------------------- | -------- |
| Client   | 浏览器客户区坐标           | CSS px   |
| Viewport | 相对画布可见区域左上角     | CSS px   |
| Stage    | zoom=1 时 DOM 实际布局坐标 | CSS px   |
| World    | 业务数据坐标               | px 或 mm |

设：

- `u`：一个 World 单位对应的 Stage CSS px。
- `z`：zoom。
- `o`：Stage 原点在 Viewport 中的偏移。
- `w`：World 坐标。
- `s`：Stage 坐标。
- `v`：Viewport 坐标。

```text
s = w × u
v = o + s × z
w = (v - o) / z / u
```

大屏：

```text
u = 1 CSS px / px
```

打印：

```text
u = 96 / 25.4 CSS px / mm
```

该 mm 换算只服务浏览器编辑显示，不代表物理显示器 DPI。PDF 仍应直接使用 mm/pt。

## 7. 精度策略

- TransformEngine 内部保留浮点数。
- pointermove 过程中不主动舍入。
- 操作结束时通过 UnitAdapter 归一化。
- 大屏默认保存整数 px。
- 打印模板默认保存 0.01mm。
- 标尺显示精度与持久化精度分离。

这样可以避免连续缩放和拖动导致累计漂移。

## 8. 元素协议

```ts
interface DesignerElementBase {
  id: string
  left: number
  top: number
  width: number
  height: number
  locked?: boolean
  hidden?: boolean
  [key: string]: unknown
}
```

大屏元素和打印元素当前都满足该结构。其他业务字段原样保留，DesignerCanvas 不读取它们。

元素能力通过回调提供：

```ts
interface DesignerElementCapabilities {
  selectable?: boolean
  movable?: boolean
  resizeX?: boolean
  resizeY?: boolean
  minWidth?: number
  minHeight?: number
}
```

例如打印横线可以只允许横向调整，锁定标题可以选择但不能移动。

`element.locked` 是持久化的权威锁定状态。锁定元素仍允许选择，但必须禁止移动、键盘微调和所有方向缩放；`getCapabilities` 只能在元素未锁定时进一步收紧或配置能力，不能重新开启锁定元素的几何操作。图层面板、画布光标和控制点显示必须读取同一锁定状态，禁止各自维护副本。

## 9. 外部使用方式

```vue
<DesignerCanvas
  v-model:elements="elements"
  v-model:selected-ids="selectedIds"
  v-model:transform="transform"
  v-model:guides="guides"
  :world-size="{ width: 210, height: 297 }"
  :unit="millimeterUnit"
  :background-style="{ backgroundColor: '#fff' }"
  :get-capabilities="getCapabilities"
  :constrain-transform="constrainTransform"
>
  <template #background="{ transform, coordinate }">
    <!-- 大屏背景图片、网格或打印纸张背景 -->
  </template>

  <template #element="{ element, selected, zoom }">
    <component
      :is="resolveRenderer(element)"
      :element="element"
      :selected="selected"
      :zoom="zoom"
    />
  </template>

  <template #overlay="{ transform, coordinate }">
    <!-- 页眉/页脚分界线等业务结构 -->
  </template>
</DesignerCanvas>
```

外部元素组件不再处理定位、选择框、控制点或鼠标坐标换算。

`backgroundClass`、`backgroundStyle` 和 `#background` 配置位于元素下方的 World 背景层；`overlayClass`、`overlayStyle` 和 `#overlay` 配置位于元素上方的 World 覆盖层。两层都随 Stage 使用同一 transform 与单位换算，并默认不接管指针事件。背景用于大屏背景色、背景图片、网格或打印纸张视觉；overlay 用于页眉页脚分界线、安全区等非交互业务结构。

外部素材通过原生 HTML5 Drag and Drop 进入 Surface。`DesignerCanvas` 在 `dragover` 和 `drop` 时统一扣除 Surface 的 DOM 偏移，并应用当前 zoom、offset 与 UnitAdapter，发出：

```ts
interface DesignerCanvasDropEvent {
  originalEvent: DragEvent
  viewportPoint: DesignerPoint
  worldPoint: DesignerPoint
  insideWorld: boolean
}
```

组件不解析 `dataTransfer`，也不直接创建业务元素。外部在 `external-drop` 中读取素材类型、决定默认宽高与业务字段，再更新 `elements`。World 外的坐标不会被强制截断，业务可通过 `insideWorld` 明确拒绝或自定义处理。

## 10. 受控状态

```ts
v-model:elements
v-model:selectedIds
v-model:transform
v-model:guides
```

其中：

- `elements` 是业务数据。
- `selectedIds`、`transform`、`guides` 是编辑状态。
- zoom 和 offset 禁止进入打印模板或大屏正式运行 Schema。
- guides 是否持久化由业务层决定，组件不写入任何存储。

## 11. 操作事务

元素操作具有三个阶段：

```text
transform-start
transform-change
transform-end
```

每个事件都包含操作类型、原始矩形和当前矩形。这允许外部在未来接入：

- 撤销重做事务。
- 属性面板同步。
- 业务校验。
- 操作日志。

DesignerCanvas 不内置撤销栈。

## 12. 标尺

- 使用 Canvas 2D 绘制。
- backing store 按 `devicePixelRatio` 放大。
- 根据当前 zoom 和单位动态选择刻度。
- 默认优选序列为 `1、2、5 × 10ⁿ`。
- 只绘制当前可见范围。
- 标尺原点永远与 World `(0, 0)` 一致。
- 允许画布移出视口后显示负刻度。

## 13. 辅助线与业务结构线

用户辅助线使用 World 单位：

```ts
interface DesignerGuide {
  id: string
  axis: 'x' | 'y'
  position: number
  locked?: boolean
  visible?: boolean
  label?: string
}
```

辅助线颜色可通过 `--yiz-editor-designer-guide` 配置，激活线及其坐标标签背景可通过
`--yiz-editor-designer-guide-active` 配置。

以下内容不进入 guides：

- 打印页眉和页脚分界线。
- 元素移动时的业务尺寸线。
- 大屏安全区。
- 吸附产生的临时对齐线。

它们通过 overlay 插槽绘制。

## 14. 输入规则

- 左键点击元素：选择并移动。
- Shift + 左键：增减多选。
- 空白区域拖动：框选。
- 空格 + 左键：无条件平移。与鼠标中键相同，无论起点位于元素、尺寸控制点、辅助线、标尺或空白画布，均优先进入 Pan Operation。
- 鼠标中键：无条件平移。元素、尺寸控制点、辅助线和空白画布上的中键事件均优先进入 Pan Operation，不触发元素选择/移动/缩放或辅助线移动。
- Ctrl + 滚轮：指针中心缩放。
- 方向键：小步移动。
- Shift + 方向键：大步移动。
- Delete：向外部发出删除请求。
- 从标尺拖动：创建辅助线。
- 从左上角标尺交汇区拖动：进入原子性的双辅助线创建操作，同时预览横向与纵向辅助线；释放点位于 World 内时一次确认两条，否则一起取消。
- 双击辅助线或拖出 World 范围：删除辅助线。

第一版统一使用 Pointer Events。开始操作后临时绑定 window pointer 监听，并在结束、取消或组件卸载时清理。

## 15. 吸附与等比缩放

### 15.1 吸附来源

当前 SnapEngine 支持：

- World 画布的左右边界、上下边界和水平/垂直中心。
- 用户辅助线。
- 其他可见元素的边缘和中心。
- 可配置 World 单位网格。

候选优先级为画布/辅助线/元素高于网格，避免元素某个中心点已经位于网格时压过附近更有语义的边缘对齐。

吸附阈值使用 Viewport CSS px 配置，再根据当前 zoom 和 UnitAdapter 转换成 World 距离。因此放大或缩小后，鼠标接近目标时的视觉触发距离保持一致。

移动多个元素时使用多选整体边界框计算吸附，只产生一个统一位移，不会破坏元素之间的相对位置。调整尺寸时只吸附当前控制点实际控制的边。

吸附过程中绘制临时提示线，并标注来源、位置和单位；操作结束后立即清除。外部可通过以下 Props 控制：

```ts
snap: boolean
snapThreshold: number // Viewport CSS px
snapGridSize: number // World 单位，0 表示关闭网格
snapToWorld: boolean
snapToGuides: boolean
snapToElements: boolean
```

### 15.2 Shift 等比缩放

- 拖动四个角控制点时，按住 Shift 保持原始宽高比，固定对角点。
- 拖动左右控制点时，按住 Shift 由宽度驱动高度，垂直中心保持不变。
- 拖动上下控制点时，按住 Shift 由高度驱动宽度，水平中心保持不变。
- 如果元素只允许单轴缩放，则 Shift 不强制启用另一轴。
- 等比缩放与吸附同时发生时，先吸附活动边，再以该轴为驱动恢复宽高比；仅保留最终仍然对齐的提示线。

### 15.3 多元素框选与 hover

- 在空白画布按下左键并拖动产生 Marquee Rect。
- 从左往右拖动进入包含模式，元素四条边必须全部位于 Marquee Rect 内。
- 从右往左拖动进入相交模式，元素只要与 Marquee Rect 存在面积交集即可选中。
- 包含模式使用蓝色实线，相交模式使用绿色虚线，并显示当前模式标签。
- 按住 Shift 开始框选时保留原选择并追加匹配元素。
- 多选后保留各元素成员框，同时绘制统一外框与元素数量标签。
- 多选移动仍从任意已选元素发起，所有元素保持相对位置。
- 元素 pointerenter/pointerleave 驱动内部 hover 状态。
- `#element` 插槽获得 `isHover`，不同业务元素可以完全自行决定悬浮渲染。
- `hoverClass` 在元素悬浮时统一加到几何包装层，供使用方提供统一 CSS。
- `hoverStyleMode` 提供 `none/background/mask/outline` 四种预设；默认 `none`，设计器不强制视觉效果。
- background、mask、outline 位于 Viewport Overlay，不随 zoom 改变边界视觉宽度。
- 预设颜色通过 `--yiz-editor-designer-hover-background`、`--yiz-editor-designer-hover-mask` 和 `--yiz-editor-designer-hover-outline` 覆盖。
- `v-model:hovered-id` 用于同步图层面板等外部区域。
- `element-hover` 同时返回元素、进入/离开状态和原始 PointerEvent。

推荐的使用方式：

```vue
<DesignerCanvas
  v-model:hovered-id="hoveredId"
  hover-class="my-unified-hover"
  hover-style-mode="outline"
  @element-hover="onElementHover"
>
  <template #element="{ element, isHover }">
    <component :is="resolveRenderer(element)" :element="element" :is-hover="isHover" />
  </template>
</DesignerCanvas>
```

如果业务元素已经使用 `isHover` 完成全部表现，应将 `hoverStyleMode` 设为 `none`；预设样式和业务自定义也允许叠加。

中键进入 Pan Operation 后，根节点增加 `designer-canvas--panning` 状态类，并以高优先级把全部后代 cursor 统一为 `grabbing`，防止元素的 `move`、辅助线的 `row/col-resize` 或控制点的 resize cursor 覆盖平移反馈。

## 16. 当前原型已实现

1. TransformEngine 及 px/mm UnitAdapter。
2. fit、center、zoomAt 和坐标转换 API。
3. 高 DPI Canvas 标尺。
4. 用户辅助线。
5. 元素插槽包装层。
6. 单选、Shift 多选和框选。
7. 多元素移动。
8. 单元素八方向尺寸调整。
9. 键盘微调。
10. 元素锁定和能力配置。
11. World 边界限制。
12. transform 生命周期事件。
13. 大屏 px 和 A4 mm 演示场景。
14. TransformEngine 与刻度算法单元测试。
15. SnapEngine：网格、画布、辅助线、元素边缘与中心吸附。
16. Shift 角点/边点等比缩放。
17. 世界坐标背景配置、背景插槽和业务结构 overlay。
18. 外部拖放接收、落点坐标换算及大屏/打印演示素材创建。

## 17. 当前限制

- 仅支持平面绝对定位元素，不支持嵌套容器。
- 多选暂不提供统一缩放控制框，只支持多选移动。
- 尚未实现旋转。
- 尚未实现元素组合与取消组合。
- 尚未实现自动滚动画布边缘。
- 设计模式默认屏蔽插槽内容的鼠标交互，尚未提供“进入内容编辑”状态。
- guides 暂无键盘微调。
- 尚未实现文档级撤销、重做与历史记录。
- 尚未进行超大元素数量的性能验证。
- 当前公开 API 仍处于早期阶段，正式发布前遵循语义化版本约束。

## 18. 下一阶段优先级

### P0：验证正确性

- 浏览器实测选择、移动、缩放、框选、辅助线。
- 验证 Windows 100%、125%、150% 显示缩放。
- 验证打印坐标往返误差不超过 0.01mm。
- 补充组件交互自动化测试。

### P1：接近真实设计器

- 多选统一边界框与多选缩放。
- 元素内容激活状态，解决图表/表格内部交互。
- 画布边缘自动滚动或自动平移。
- 文档级历史控制器、撤销重做工具栏与历史列表示例。

### P2：进入 yiz-ui 前

- 明确受控/非受控 API。
- 主题变量和暗色模式。
- 无障碍键盘行为。
- 独立组件文档和最小示例。
- 性能基准与内存清理测试。
- 确认包名、组件名和版本策略。

## 19. 集成原则

`yiz-editor` 是唯一公共实现，业务项目不再复制组件源码。推荐流程：

1. 先接入打印模板设计器，验证 mm 和业务结构覆盖层。
2. 再接入大屏设计器，验证 px、多元素与图表内容。
3. 业务项目通过包依赖升级，不在项目内维护分叉实现。
4. 破坏性 API 调整集中在正式稳定版本前完成。

## 20. 验收标准

- 大屏与打印使用同一个 DesignerCanvas。
- 业务元素不再自行组合 zoom、offset、scroll 和 DOMRect。
- 打印标尺显示 mm，大屏标尺显示 px。
- 打印业务数据始终保存 mm。
- 视图状态不进入正式业务 Schema。
- 指针中心缩放时锚点不漂移。
- 选取、移动和调整尺寸在不同 zoom 下行为一致。
- 吸附视觉阈值不随 zoom 改变，Shift 缩放保持原始宽高比。
- 高 DPI 标尺清晰。
- 全局监听器有确定清理路径。
- 核心单元测试与生产构建通过。

## 21. 结论

公共组件应该定义为 `DesignerCanvas`，而不是单独的标尺或只负责缩放的 Viewport。它统一设计器的坐标、视口和元素几何交互；外部仅通过 `#element` 插槽负责业务渲染，并通过能力与约束回调表达业务规则。

这一边界既能显著减少打印模板和大屏设计器中的重复代码，也足够通用，具备未来进入 yiz-ui 的价值。
