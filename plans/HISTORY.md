# 撤销、重做与历史记录设计计划

## 1. 文档状态

- 状态：待实现。
- 适用范围：打印模板设计器、大屏设计器及后续基于 `DesignerCanvas` 的设计器。
- 实现位置：历史能力位于设计器文档层，不直接内置到 `DesignerCanvas`。
- 核心要求：完整保留元素和文档中的用户自定义属性。

本文只确定设计边界和第一版方案，不代表当前组件已经实现撤销、重做或历史列表。

## 2. 定位与职责边界

历史记录不能只建立在 `DesignerCanvas` 内部，也不能只记录 `left/top/width/height`。画布组件只知道几何交互，不知道属性面板、图层操作、页面配置和用户扩展字段，因此历史记录必须位于具体设计器的文档层。

推荐的职责关系：

```text
DesignerCanvas
    ↓ transform / guide / delete 等语义事件
Designer Workbench
    ↓ 将一次完整用户操作包装为事务
DesignerHistory
    ↓ 保存可恢复的 DesignerDocument
Template Store
```

`DesignerCanvas` 保持无历史栈设计，只提供明确的操作生命周期。`DesignerHistory` 可以作为 `yiz-editor` 中无 UI 的控制器或 composable，但由打印模板设计器、大屏设计器等使用方定义完整文档结构。

## 3. 文档级历史状态

历史记录的最小单位是整份可持久化设计文档，而不是单独的元素数组：

```ts
interface DesignerDocument<
  TElement extends DesignerElementBase = DesignerElementBase,
  TSettings extends Record<string, unknown> = Record<string, unknown>
> {
  schemaVersion: string
  elements: TElement[]
  guides: DesignerGuide[]
  settings: TSettings
}
```

不同设计器可以扩展 `settings`，例如打印页面尺寸、分页模式、页眉页脚配置，或者大屏分辨率和网格配置。只要字段最终会进入模板持久化数据，就应该纳入文档历史。

## 4. 用户自定义属性

`DesignerElementBase` 允许业务项目添加任意字段。历史模块必须保存和恢复完整元素对象，禁止只挑选内置字段：

```ts
interface CustomElement extends DesignerElementBase {
  kind: string
  fieldName?: string
  style?: Record<string, unknown>
  componentProps?: Record<string, unknown>
  dataSource?: Record<string, unknown>
}
```

以下规则必须成立：

- 用户自定义字段及其嵌套对象、数组必须完整进入 before/after 状态。
- 新增、删除、撤销和重做不能丢失未知字段。
- Schema 校验必须保留合法扩展字段，例如使用 passthrough 或 `additionalProperties` 策略，不能静默剔除。
- 历史比较必须区分字段不存在、`undefined` 和 `null`；模板 Schema 可以进一步限制最终允许的形式。
- 元素 ID 必须稳定，新增、删除、排序和批量操作均以稳定 ID 识别业务对象。

能够进入模板和历史的数据默认必须可序列化。允许字符串、数字、布尔值、`null`、数组和普通对象；函数、Vue 组件实例、DOM 节点、`Ref`、网络连接及复杂类实例不得直接写入模板元素。运行时渲染器应通过 `kind` 或注册表在文档外部关联。

默认克隆器可以基于 `structuredClone(toRaw(state))`，同时允许业务通过 adapter 注入 `clone`、`equals`、`validate` 和 `restore`，用于处理项目定义的序列化规则。任何克隆失败都必须中止本次历史提交并明确报错，不能生成不完整记录。

## 5. 历史范围

默认进入历史的持久化操作：

- 元素添加、删除、复制、粘贴和图层排序。
- 单元素及多元素移动、缩放和键盘微调。
- 锁定、隐藏以及内置属性修改。
- 用户自定义属性修改。
- 辅助线创建、移动和删除；前提是业务选择持久化 guides。
- 页面尺寸、分页模式及其他模板级配置修改。

默认不进入历史的临时界面状态：

- `selectedIds` 和 `hoveredId`。
- 画布 `zoom`、`offsetX`、`offsetY`。
- 吸附临时开关和辅助线全局显隐开关。
- 属性面板展开状态、当前 Demo 和预览数据。

判断原则是该状态是否随模板保存。如果某个项目决定持久化吸附配置等编辑器设置，它就应从 View State 移入 Document State，并自动进入历史范围。

## 6. 事务边界与合并

一次连续交互只生成一条历史记录：

```text
pointerdown   → beginTransaction("移动元素")
pointermove   → 更新当前文档，不写入历史栈
pointerup     → commitTransaction()
pointercancel → cancelTransaction() 或按明确策略提交
```

现有 `transform-start/change/end` 可作为移动与缩放的事务边界。辅助线拖动、批量删除、粘贴多个元素和批量属性修改也必须使用相同事务语义。

属性输入需要避免每次按键产生历史：

- 输入框 focus 时开始事务，blur 或 Enter 时提交；Escape 可以取消。
- Slider、颜色选择器等连续控件在开始拖动时 begin，在结束拖动时 commit。
- 不能取得明确开始/结束事件时，允许使用 `mergeKey` 和短时间窗口合并。

```ts
{
  label: '修改元素宽度',
  mergeKey: 'element-1:width'
}
```

多元素移动、批量锁定等操作必须作为单一原子事务撤销，不能按元素拆成多条记录。

## 7. 存储策略

可选方案：

1. 完整快照：每次提交保存完整 before/after 文档。最容易保证用户自定义属性正确，但内存占用较高。
2. Command：为每种操作提供 execute/undo。标准几何操作清晰，但业务自定义属性需要持续新增反向命令，容易遗漏。
3. 正向/反向 Patch：事务开始和结束比较文档，保存 patches 与 inversePatches。能覆盖未知字段并节省内存，但数组排序、深层对象和元素批量操作更复杂。

第一版采用完整文档快照，优先保证正确性。历史引擎的公开接口不能暴露具体存储结构，以便后续在不影响使用方的情况下切换为 Patch 或结构共享实现。

快照必须包含深层自定义属性，禁止仅对元素数组或元素对象做浅拷贝。图片等大资源应保存本地资源 ID 或路径，不应把 Base64 或二进制内容重复放入每个历史快照。

## 8. 历史记录与控制器接口

建议记录元数据：

```ts
interface HistoryEntry<TDocument> {
  id: string
  label: string
  timestamp: number
  source: 'canvas' | 'property' | 'layer' | 'guide' | 'system'
  affectedElementIds?: string[]
  before: TDocument
  after: TDocument
}
```

历史控制器至少提供：

```ts
canUndo
canRedo
isDirty
undo()
redo()
beginTransaction(meta)
commitTransaction(meta?)
cancelTransaction()
clear()
reset(document)
markSaved()
```

在 Undo 后产生新的提交时必须清空 Redo 分支。`markSaved()` 记录保存基线，撤销或重做到该基线时 `isDirty` 应恢复为 `false`，不能只用历史栈长度判断是否存在未保存修改。

历史列表 UI 只消费 `HistoryEntry` 元数据，不直接拥有文档状态。第一版允许限制最大记录数，例如 100 条；后续增加可配置内存上限和状态大小估算。

## 9. 恢复、校验与生命周期

- Undo/Redo 恢复整份文档后，应清理已经不存在的 `selectedIds`；是否选中受影响元素由 Workbench 决定。
- 恢复状态必须经过与正常编辑一致的文档 Schema 校验，并保留用户扩展字段。
- 加载另一份模板时调用 `reset(document)`，清空旧模板历史并建立新基线。
- Schema 版本迁移后默认清空旧历史，禁止在不同文档版本之间执行 Undo/Redo。
- 服务端数据刷新默认视为新基线；如果产品希望用户可撤销刷新，则由业务显式提交为一条 system 事务。
- 历史恢复期间必须抑制自动记录，避免 Undo 本身产生新的 HistoryEntry。
- 组件卸载、模板切换和异常取消操作时必须关闭未完成事务，不能留下半提交状态。

## 10. 第一版结论

第一版历史系统采用以下基线：

1. 历史位于设计器文档层，不内置于 `DesignerCanvas`。
2. 记录整份可序列化 `DesignerDocument`。
3. 使用显式事务把连续交互合并为一条历史。
4. 使用深层完整快照，保留全部用户自定义属性。
5. 排除选择、Hover、Zoom 等临时界面状态。
6. 提供可替换的 clone/equality/validate/restore adapter，为未来 Patch 存储保留空间。

## 11. 待实现验收标准

- 元素几何操作、属性修改、添加、删除和排序均可正确撤销与重做。
- 一次连续拖动只生成一条历史记录。
- 用户自定义属性及其嵌套结构在 Undo/Redo 后不丢失。
- Undo 后产生新操作会清空 Redo 分支。
- 保存基线能够准确驱动 `isDirty`。
- 加载新模板、Schema 迁移和组件卸载不会遗留未完成事务。
- 历史恢复不会把 Undo/Redo 本身再次记录进历史。
