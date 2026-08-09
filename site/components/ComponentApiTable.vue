<template>
  <div class="api-table-wrap">
    <table class="api-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>类型</th>
          <th>默认值</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.name">
          <td>
            <code>{{ row.name }}</code>
          </td>
          <td>
            <code>{{ row.type }}</code>
          </td>
          <td>
            <code>{{ row.defaultValue }}</code>
          </td>
          <td>{{ row.description }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
interface ComponentApiRow {
  name: string
  type: string
  defaultValue: string
  description: string
}

defineProps<{
  rows: ComponentApiRow[]
}>()
</script>

<style lang="less" scoped>
.api-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.api-table {
  width: 100%;
  min-width: 920px;
  color: #334155;
  font-size: 14px;
  line-height: 1.55;
  border-collapse: collapse;
}

.api-table th,
.api-table td {
  padding: 12px 14px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid #e2e8f0;
}

.api-table th {
  color: #475569;
  font-weight: 600;
  background: #f8fafc;
}

.api-table th:nth-child(1) {
  width: 18%;
}
.api-table th:nth-child(2) {
  width: 30%;
}
.api-table th:nth-child(3) {
  width: 20%;
}

.api-table tbody tr:hover {
  background: #f8fbff;
}

.api-table code {
  color: #1d4ed8;
  font-family: var(--yiz-editor-site-font-family);
  word-break: break-word;
}
</style>
