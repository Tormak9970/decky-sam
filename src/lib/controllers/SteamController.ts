import { PyInterop } from "./PyInterop";
import { waitForCondition } from "../Utils";
/**
 * Wrapper class for the SteamClient interface.
 */
export class SteamController {
  private hasLoggedIn = false;
  private hasLoggedOut = false;

  /**
   * Gets the SteamAppOverview of the app with a given appId.
   * @param appId The id of the app to get.
   * @returns A promise resolving to the SteamAppOverview of the app
   */
  async getAppOverview(appId: number) {
    await this.waitForAppOverview(appId, (overview) => overview !== null);
    return this._getAppOverview(appId);
  }

  private async waitForAppOverview(appId: number, condition: (overview:SteamAppOverview|null) => boolean): Promise<boolean> {
    return await waitForCondition(3, 250, async () => {
      const overview = await this._getAppOverview(appId);
      return condition(overview);
    });
  }
  
  async _getAppOverview(appId: number) {
    return appStore.GetAppOverviewByAppID(appId) as SteamAppOverview | null;
  }

  /**
   * Gets the SteamAppDetails of the app with a given appId.
   * @param appId The id of the app to get.
   * @returns A promise resolving to the SteamAppDetails of the app
   */
  async getAppDetails(appId: number): Promise<SteamAppDetails | null> {
    await this.waitForAppDetails(appId, (details) => details !== null);
    return await this._getAppDetails(appId);
  }

  private async waitForAppDetails(appId: number, condition: (details:SteamAppDetails|null) => boolean): Promise<boolean> {
    return await waitForCondition(3, 250, async () => {
      const details = await this._getAppDetails(appId);
      return condition(details);
    });
  }

  private async _getAppDetails(appId: number): Promise<SteamAppDetails | null> {
    return new Promise((resolve) => {
      try {
        const { unregister } = SteamClient.Apps.RegisterForAppDetails(appId, (details: SteamAppDetails) => {
          unregister();
          resolve(details.unAppID === undefined ? null : details);
        });
      } catch (e:any) {
        PyInterop.log(`Error encountered trying to get app details. Error: ${e.message}`);
      }
    });
  }

  /**
   * Gets the achievements for a game.
   * @param appid The id of the app to get achievements for.
   * @returns A promise resolving to the list of achievements.
   */
  async getAllAchievementsForApp(appid: number): Promise<SteamAchievement[]> {
    const achievements = await appDetailsStore.GetAchievements(appid);
    console.log("Details Store Achievements", achievements);
    return achievements;
  }

  /**
   * Registers a hook for when the user's login state changes.
   * @param onLogin Function to run on login.
   * @param onLogout Function to run on logout.
   * @param once Whether the hook should run once.
   * @returns A function to unregister the hook.
   */
  registerForAuthStateChange(onLogin: ((username:string) => Promise<void>) | null, onLogout: ((username:string) => Promise<void>) | null, once: boolean): Unregisterer {
    try {
      let isLoggedIn: boolean | null = null;
      const currentUsername = loginStore.m_strAccountName;
      return SteamClient.User.RegisterForLoginStateChange((username: string) => {
        if (username === "") {
          if (isLoggedIn !== false && (once ? !this.hasLoggedOut : true)) {
            if (onLogout) onLogout(currentUsername);
          }
          isLoggedIn = false;
        } else {
          if (isLoggedIn !== true && (once ? !this.hasLoggedIn : true)) {
            if (onLogin) onLogin(username);
          }
          isLoggedIn = true;
        }
      });
    } catch (error) {
      PyInterop.log(`error with AuthStateChange hook. [DEBUG INFO] error: ${error};`);
      // @ts-ignore
      return () => { };
    }
  }

  /**
   * Waits until the services are initialized.
   * @returns A promise resolving to true if services were initialized on any attempt, or false if all attemps failed.
   */
  async waitForServicesToInitialize(): Promise<boolean> {
    type WindowEx = Window & { App?: { WaitForServicesInitialized?: () => Promise<boolean> } };
    const servicesFound = await waitForCondition(20, 250, () => (window as WindowEx).App?.WaitForServicesInitialized != null);
  
    if (servicesFound) {
      PyInterop.log(`Services found.`);
    } else {
      PyInterop.log(`Couldn't find services.`);
    }
  
    return (await (window as WindowEx).App?.WaitForServicesInitialized?.().then((success: boolean) => {
      PyInterop.log(`Services initialized. Success: ${success}`);
      return success;
    })) ?? false;
  }

  /**
   * Registers a callback for achievement notification events.
   * @param callback The callback to run.
   * @returns An Unregisterer for this hook.
   */
  registerForGameAchievementNotification(callback: (data: AchievementNotification) => void): Unregisterer {
    return SteamClient.GameSessions.RegisterForAchievementNotification((data: AchievementNotification) => {
      callback(data);
    });
  }

  /**
   * Restarts the Steam client.
   */
  restartClient(): void {
    SteamClient.User.StartRestart();
  }
}