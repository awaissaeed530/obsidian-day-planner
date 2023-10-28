import type { Moment } from "moment";
import { MetadataCache, Pos } from "obsidian";
import { DataArray, STask } from "obsidian-dataview";
import { Readable, Writable } from "svelte/store";

import type { getHorizontalPlacing } from "./overlap/horizontal-placing";
import type { ObsidianFacade } from "./service/obsidian-facade";

export interface TaskLocation {
  path: string;
  line: number;
  position: Pos;
}

export type OnUpdateFn = (updated: Task[]) => Promise<void | void[]>;

export interface UnscheduledTask {
  /**
   * @deprecated this will be replaced with dataview `symbol` and `status`
   */
  listTokens: string;

  // todo: the distinction needs to be clearer
  firstLineText: string;
  text: string;

  id: string;
  location?: TaskLocation;
  placing?: ReturnType<typeof getHorizontalPlacing>;
  isGhost?: boolean;
  durationMinutes: number;
}

export interface Task extends UnscheduledTask {
  startTime: Moment;
  startMinutes: number;
}

export interface TasksForDay {
  withTime: PlacedTask[];
  noTime: UnscheduledTask[];
}

// todo: we don't need this, since it's all optional
export interface PlacedTask extends Task {}

export type RelationToNow = "past" | "present" | "future";

export type TimeBlock = Pick<Task, "startMinutes" | "durationMinutes" | "id">;

export interface Overlap {
  columns: number;
  span: number;
  start: number;
}

export type Timestamp = {
  startMinutes: number;
  durationMinutes: number;
};

export type CleanUp = () => void;
export type RenderMarkdown = (el: HTMLElement, markdown: string) => CleanUp;

export interface ObsidianContext {
  obsidianFacade: ObsidianFacade;
  metadataCache: MetadataCache;
  onUpdate: OnUpdateFn;
  initWeeklyView: () => Promise<void>;
  dataviewTasks: Readable<DataArray<STask>>;
  refreshTasks: (source: string) => void;
  dataviewLoaded: Writable<boolean>;
  fileSyncInProgress: Readable<boolean>;
  renderMarkdown: RenderMarkdown;
}
