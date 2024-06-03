<script lang="ts">
  import { UnscheduledTask } from "../../types";
  import { useColorOverride } from "../hooks/use-color-override";

  export let task: UnscheduledTask;

  $: override = useColorOverride(task);
  // todo: hide in hook
  $: backgroundColor =
    $override || task.wrapper
      ? ""
      : undefined || "var(--time-block-bg-color, var(--background-primary))";

  $: border = task.wrapper
    ? ""
    : "1px solid var(--time-block-border-color, var(--color-base-50))";
</script>

<div class="padding">
  <div
    style:background-color={backgroundColor}
    style:margin-left={task.wrapper ? "0px" : "10px"}
    style:margin-right={task.wrapper ? "0px" : "10px"}
    style:border
    class="content"
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseup
  >
    <slot />
  </div>
</div>

<style>
  .padding {
    position: var(--time-block-position, static);
    top: var(--time-block-top, 0);
    left: var(--time-block-left, 0);

    display: flex;

    width: var(--time-block-width, 100%);
    height: var(--time-block-height, auto);
    padding: 0 1px 2px;

    transition: 0.05s linear;
  }

  /* TODO: Move out */
  .padding :global(svg.lock-icon) {
    width: var(--icon-xs);
    height: var(--icon-xs);
  }

  .content {
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 0 0;

    font-size: var(--font-ui-small);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    border-radius: var(--radius-s);
    box-shadow: 1px 1px 2px 0 #0000001f;
  }
</style>
