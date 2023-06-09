import { ServerAPI } from "decky-frontend-lib";
import { PyInterop } from "./PyInterop";
import { SteamController } from "./SteamController";
import { PluginState } from "../../state/PluginState";

export type ChangedAchievement = {
  achievement: SteamAchievement,
  isUnlocked: boolean,
  wasUnlocked: boolean
}
/**
 * Main controller class for the plugin.
 */
export class PluginController {
  // @ts-ignore
  private static server: ServerAPI;
  private static state: PluginState;

  private static steamController: SteamController;

  private static gameLifetimeRegister: Unregisterer;
  private static historyListener: () => void;

  /**
   * Sets the plugin's serverAPI.
   * @param server The serverAPI to use.
   * @param state The plugin state.
   */
  static setup(server: ServerAPI, state: PluginState): void {
    this.server = server;
    this.state = state;
    this.steamController = new SteamController();
  
    // ? any other init stuff here
  }

  /**
   * Sets the plugin to initialize once the user logs in.
   * @returns The unregister function for the login hook.
   */
  static initOnLogin(): Unregisterer {
    return this.steamController.registerForAuthStateChange(async (username) => {
      PyInterop.log(`User logged in. [DEBUG] username: ${username}.`);
      if (await this.steamController.waitForServicesToInitialize()) {
        PluginController.init();
      } else {
        PyInterop.toast("Error", "Failed to initialize, try restarting.");
      }
    }, null, true);
  }

  /**
   * Initializes the Plugin.
   */
  static async init(): Promise<void> {
    PyInterop.log("PluginController initialized.");
  }

  /**
   * Gets the overview for the provided app.
   * @param appid The id of the app to get the overview of.
   * @returns A promise resolving to the app's overview, or null if failed.
   */
  static async getAppOverview(appid: number): Promise<SteamAppOverview | null> {
    return await PluginController.steamController.getAppOverview(appid);
  }

  /**
   * Gets the achievements for the provided app.
   * @param appid The id of the app to get achievements for.
   * @returns A promise resolving to the list of achievements.
   */
  static async getAchievementsForApp(appid: number): Promise<SteamAchievement[]> {
    return await PluginController.steamController.getAllAchievementsForApp(appid);
  }
  
  /**
   * Saves the changes made to the achievements of a game
   * @param achievementChanges An array of changes made to the achievements of a game.
   * @returns A promise resolving to a boolean indicating if the changes were saved successfully.
   */
  static async commitAchievementChanges(achievementChanges: ChangedAchievement[]): Promise<boolean> {
    return false;
  }

  /**
   * Function to run when the plugin dismounts.
   */
  static dismount(): void {
    this.gameLifetimeRegister.unregister();
    this.historyListener();
    
    PyInterop.log("PluginController dismounted.");
  }
}