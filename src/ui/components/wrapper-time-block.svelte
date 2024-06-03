<script lang="ts">
  import { Task } from "../../types";

  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: Task;
</script>

<ScheduledTimeBlock {task}>
  <div class="wrapper-task-content">
    <div style:background-color="rgba(0, 0, 0, 0.1)" class="ribbon" />
    <div class="text" style="text-align: right; z-index: 999;">
      <span class="summary">
        {task.text.replace("- [ ]", "")}
      </span>
    </div>
  </div>
</ScheduledTimeBlock>

<style>
  .wrapper-task-content {
    display: flex;
    flex: 1 0 0;
    flex-direction: column;

    padding: var(--size-2-1) var(--size-4-1);
    padding-left: calc(4px + var(--size-4-2));

    color: var(--text-normal);

    border: 1px dashed rgba(255, 255, 255, 0.5);
    font-weight: 700;
  }

  .ribbon {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;

    width: var(--size-4-2);
  }
</style>
