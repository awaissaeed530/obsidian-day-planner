import { FileView, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";

import { VIEW_TYPE_TIMELINE, VIEW_TYPE_WEEKLY } from "./constants";
import { createPlannerHeading } from "./plan";
import { DayPlannerSettings } from "./settings";
import { dayShownInTimeline, getTimelineFile } from "./store/active-day";
import { appStore } from "./store/app-store";
import { settings } from "./store/settings";
import { tasks } from "./store/tasks";
import { visibleDateRange } from "./store/visible-date-range";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { StatusBar } from "./ui/status-bar";
import TimelineView from "./ui/timeline-view";
import WeeklyView from "./ui/weekly-view";
import {
  createDailyNoteIfNeeded,
  dailyNoteExists,
  getDateUidForToday,
  getDateUidFromFile,
} from "./util/daily-notes";
import { getDaysOfCurrentWeek } from "./util/moment";
import { refreshPlanItemsInStore } from "./util/obsidian";

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  private statusBar: StatusBar;

  async onload() {
    this.settings = Object.assign(
      new DayPlannerSettings(),
      await this.loadData(),
    );

    this.statusBar = new StatusBar(
      this.settings,
      this.addStatusBarItem(),
      this.app.workspace,
    );

    this.registerCommands();

    this.registerView(
      VIEW_TYPE_TIMELINE,
      (leaf: WorkspaceLeaf) => new TimelineView(leaf, this.settings, this),
    );

    this.registerView(
      VIEW_TYPE_WEEKLY,
      (leaf: WorkspaceLeaf) => new WeeklyView(leaf, this),
    );

    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.initAppAndSettingsStores();

    this.app.workspace.onLayoutReady(this.handleLayoutReady);
    this.app.workspace.on("active-leaf-change", this.handleActiveLeafChanged);
    this.app.metadataCache.on("changed", async (file: TFile) => {
      // todo: this should work for any visible item
      if (file === getTimelineFile()) {
        await refreshPlanItemsInStore();
      }
    });

    this.registerInterval(
      window.setInterval(
        () => this.updateStatusBarOnFailed(this.updateStatusBar),
        1000,
      ),
    );
  }

  private handleActiveLeafChanged = ({ view }: WorkspaceLeaf) => {
    if (!(view instanceof FileView)) {
      return;
    }

    const newDailyNoteKey = getDateUidFromFile(view.file);

    if (!newDailyNoteKey) {
      if (get(dayShownInTimeline) !== getDateUidForToday()) {
        dayShownInTimeline.set(getDateUidForToday());
      }

      return;
    }

    dayShownInTimeline.set(newDailyNoteKey);
  };

  private registerCommands() {
    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show the Day Planner Timeline",
      callback: async () => await this.initTimelineLeaf(),
    });

    this.addCommand({
      id: "show-weekly-view",
      name: "Show the Week Planner",
      callback: async () => await this.initWeeklyLeaf(),
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's Day Planner",
      callback: async () =>
        this.app.workspace
          .getLeaf(false)
          .openFile(await createDailyNoteIfNeeded(window.moment())),
    });

    this.addCommand({
      id: "insert-planner-heading-at-cursor",
      name: "Insert Planner Heading at Cursor",
      editorCallback: (editor) =>
        editor.replaceSelection(createPlannerHeading()),
    });
  }

  private initAppAndSettingsStores() {
    appStore.set(this.app);

    const {
      zoomLevel,
      centerNeedle,
      startHour,
      timelineDateFormat,
      plannerHeading,
      plannerHeadingLevel,
    } = this.settings;

    settings.set({
      zoomLevel,
      centerNeedle,
      startHour,
      timelineDateFormat,
      plannerHeading,
      plannerHeadingLevel,
    });

    settings.subscribe(async (newValue) => {
      this.settings = { ...this.settings, ...newValue };
      await this.saveData(this.settings);
    });
  }

  private handleLayoutReady = async () => {
    // todo: this dep is implicit. `dateRange` should be set before parsed plan items
    visibleDateRange.set(getDaysOfCurrentWeek());

    this.register(
      visibleDateRange.subscribe(async () => {
        await refreshPlanItemsInStore();
      }),
    );

    this.register(
      dayShownInTimeline.subscribe(async () => {
        await refreshPlanItemsInStore();
      }),
    );
  };

  onunload() {
    this.detachLeavesOfType(VIEW_TYPE_TIMELINE);
    this.detachLeavesOfType(VIEW_TYPE_WEEKLY);
  }

  private async updateStatusBarOnFailed(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (error) {
      this.statusBar.setText(`⚠️ Planner update failed (see console)`);
      console.error(error);
    }
  }

  private updateStatusBar = async () => {
    if (dailyNoteExists()) {
      await this.statusBar.update(get(tasks));
    } else {
      this.statusBar.setEmpty();
    }
  };

  private async initWeeklyLeaf() {
    this.detachLeavesOfType(VIEW_TYPE_WEEKLY);
    await this.app.workspace.getLeaf(false).setViewState({
      type: VIEW_TYPE_WEEKLY,
      active: true,
    });
  }

  private async initTimelineLeaf() {
    this.detachLeavesOfType(VIEW_TYPE_TIMELINE);
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_TIMELINE,
      active: true,
    });
  }

  private detachLeavesOfType(type: string) {
    this.app.workspace.getLeavesOfType(type).forEach((leaf) => leaf.detach());
  }
}
