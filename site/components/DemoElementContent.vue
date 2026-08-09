<template>
  <div
    class="demo-element"
    :class="[
      `demo-element--${kind}`,
      { 'demo-element--print': scene === 'print', 'demo-element--slot-hover': isHover }
    ]"
    :style="elementStyle"
  >
    <template v-if="scene === 'screen'">
      <template v-if="kind === 'metric'">
        <div class="metric-label">{{ title }}</div>
        <div class="metric-value">{{ text }}</div>
        <div class="metric-trend">↗ 12.8% 较上周期</div>
      </template>
      <template v-else-if="kind === 'bars'">
        <div class="chart-title">{{ title }}</div>
        <div class="bar-chart">
          <i v-for="height in [35, 64, 48, 82, 57, 72, 92]" :key="height" :style="{ height: `${height}%` }" />
        </div>
      </template>
      <template v-else-if="kind === 'map'">
        <div class="map-grid" />
        <div class="map-title">{{ title }}</div>
        <span class="map-dot map-dot--one" />
        <span class="map-dot map-dot--two" />
        <span class="map-dot map-dot--three" />
      </template>
      <template v-else>
        <div class="screen-text">{{ text }}</div>
      </template>
    </template>

    <template v-else>
      <template v-if="kind === 'print-title'">
        <div class="print-title">{{ text }}</div>
      </template>
      <template v-else-if="kind === 'print-meta'">
        <div class="print-meta">
          <span>单据编号：SO-20260809-001</span>
          <span>打印日期：2026-08-09</span>
        </div>
      </template>
      <template v-else-if="kind === 'print-table'">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>数量</th>
              <th>单价</th>
              <th>金额</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>设计服务</td>
              <td>1</td>
              <td>2,800</td>
              <td>2,800</td>
            </tr>
            <tr>
              <td>实施服务</td>
              <td>2</td>
              <td>1,200</td>
              <td>2,400</td>
            </tr>
            <tr>
              <td>技术支持</td>
              <td>1</td>
              <td>600</td>
              <td>600</td>
            </tr>
          </tbody>
        </table>
      </template>
      <template v-else-if="kind === 'print-qr'">
        <div class="fake-qr" />
      </template>
      <template v-else-if="kind === 'print-line'">
        <div class="print-line" />
      </template>
      <template v-else>
        <div class="print-text">{{ text }}</div>
      </template>
    </template>

    <span v-if="locked" class="element-lock">◆</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { DesignerElementBase } from 'yiz-editor'

const props = defineProps<{
  element: DesignerElementBase
  scene: 'screen' | 'print'
  isHover?: boolean
}>()

const kind = computed(() => String(props.element.kind ?? 'text'))
const title = computed(() => String(props.element.title ?? ''))
const text = computed(() => String(props.element.text ?? ''))
const color = computed(() => String(props.element.color ?? '#2563eb'))
const locked = computed(() => Boolean(props.element.locked))
const elementStyle = computed(() => ({ '--element-color': color.value }))
</script>

<style scoped>
.demo-element {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  color: #e2e8f0;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.demo-element--slot-hover.demo-element--metric .metric-value,
.demo-element--slot-hover .chart-title,
.demo-element--slot-hover .map-title {
  color: #fff;
  text-shadow: 0 0 12px color-mix(in srgb, var(--element-color) 72%, transparent);
}

.demo-element--slot-hover .bar-chart i {
  filter: saturate(1.25) brightness(1.08);
}

.demo-element--slot-hover .map-dot {
  transform: scale(1.18);
}

.demo-element--slot-hover.demo-element--print {
  color: #0369a1;
}

.demo-element--metric,
.demo-element--bars,
.demo-element--map {
  overflow: hidden;
  background: linear-gradient(145deg, rgb(12 31 53 / 96%), rgb(8 21 38 / 96%));
  border: 1px solid color-mix(in srgb, var(--element-color) 60%, transparent);
  border-radius: 12px;
  box-shadow: inset 0 0 28px color-mix(in srgb, var(--element-color) 10%, transparent);
}

.metric-label {
  padding: 13px 15px 0;
  color: #94a3b8;
  font-size: 14px;
}

.metric-value {
  padding: 2px 15px;
  color: #f8fafc;
  font-size: clamp(24px, 4vw, 42px);
  font-weight: 700;
  letter-spacing: -0.04em;
}

.metric-trend {
  padding: 0 15px;
  color: #34d399;
  font-size: 11px;
}

.chart-title,
.map-title {
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 15px;
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
}

.bar-chart {
  position: absolute;
  inset: 42px 16px 16px;
  display: flex;
  align-items: flex-end;
  gap: 5%;
  border-bottom: 1px solid rgb(148 163 184 / 25%);
  background: repeating-linear-gradient(to top, transparent 0 24%, rgb(148 163 184 / 9%) 25%);
}

.bar-chart i {
  flex: 1;
  min-width: 4px;
  background: linear-gradient(to top, color-mix(in srgb, var(--element-color) 72%, #0f172a), #67e8f9);
  border-radius: 4px 4px 1px 1px;
  box-shadow: 0 0 12px color-mix(in srgb, var(--element-color) 30%, transparent);
}

.map-grid {
  position: absolute;
  inset: 0;
  opacity: 0.32;
  background-image:
    linear-gradient(rgb(34 211 238 / 16%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(34 211 238 / 16%) 1px, transparent 1px);
  background-size: 24px 24px;
  transform: perspective(240px) rotateX(22deg) scale(1.2);
}

.map-dot {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #22d3ee;
  border: 2px solid #cffafe;
  border-radius: 50%;
  box-shadow:
    0 0 0 7px rgb(34 211 238 / 12%),
    0 0 18px #22d3ee;
}

.map-dot--one {
  top: 38%;
  left: 28%;
}
.map-dot--two {
  top: 62%;
  left: 63%;
}
.map-dot--three {
  top: 28%;
  left: 74%;
}

.screen-text {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #f8fafc;
  font-size: clamp(18px, 3vw, 36px);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-shadow: 0 0 18px color-mix(in srgb, var(--element-color) 65%, transparent);
}

.demo-element--print {
  color: #111827;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.print-title {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.print-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  font-size: 8px;
}

.demo-element--print-table table {
  width: 100%;
  height: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 7px;
}

.demo-element--print-table th,
.demo-element--print-table td {
  padding: 2px 4px;
  text-align: left;
  border: 1px solid #111827;
}

.demo-element--print-table th {
  background: #f1f5f9;
}

.fake-qr {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(90deg, #111 50%, transparent 50%) 0 0 / 18% 18%,
    linear-gradient(#111 50%, transparent 50%) 0 0 / 18% 18%,
    repeating-conic-gradient(#111 0 25%, #fff 0 50%) 50% / 22% 22%;
  border: 3px solid #fff;
  outline: 1px solid #111;
}

.print-line {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  border-top: 1px solid #111;
}

.print-text {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 8px;
}

.element-lock {
  position: absolute;
  top: 4px;
  right: 5px;
  color: #f59e0b;
  font-size: 8px;
}
</style>
