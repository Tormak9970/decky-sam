import { sleep } from "decky-frontend-lib";
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
   * Gets the gameId associated with an app.
   * @param appId The id of the game.
   * @returns A promise resolving to the gameId.
   */
  async getGameId(appId: number): Promise<string | null> {
    const overview = await this.getAppOverview(appId);
    if (!overview) {
      PyInterop.log(`Could not get game id. [DEBUG INFO] appId: ${appId};`);
      return null;
    }

    return overview.gameid;
  }

  /**
   * Registers for lifecycle updates for a steam app.
   * @param appId The id of the app to register for.
   * @param callback The callback to run when an update is recieved.
   * @returns A function to call to unregister the hook.
   */
  registerForAppLifetimeNotifications(appId: number, callback: (data: LifetimeNotification) => void): Unregisterer {
    return SteamClient.GameSessions.RegisterForAppLifetimeNotifications((data: LifetimeNotification) => {
      console.log("Lifecycle id:", data.unAppID, appId);
      if (data.unAppID !== appId) return;

      callback(data);
    });
  }

  /**
   * Registers for all lifecycle updates for steam apps.
   * @param callback The callback to run when an update is recieved.
   * @returns A function to call to unregister the hook.
   */
  registerForAllAppLifetimeNotifications(callback: (appId: number, data: LifetimeNotification) => void): Unregisterer {
    return SteamClient.GameSessions.RegisterForAppLifetimeNotifications((data: LifetimeNotification) => {
      callback(data.unAppID, data);
    });
  }

  /**
   * Waits for a game lifetime event to occur.
   * @param appId The id of the app to wait for.
   * @param options The options to determine when the function returns true.
   * @returns A promise resolving to true when the desired lifetime event occurs.
   */
  async waitForAppLifetimeNotifications(appId: number, options: { initialTimeout?: number, waitForStart?: boolean, waitUntilNewEnd?: boolean } = {}): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let timeoutId: any = null;
      const { unregister } = this.registerForAppLifetimeNotifications(appId, (data: LifetimeNotification) => {
        if (options.waitForStart && !data.bRunning) {
          return;
        }

        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (options.waitUntilNewEnd && data.bRunning) {
          return;
        }

        unregister();
        PyInterop.log(`Game lifetime subscription ended, game closed. [DEBUG INFO] appId: ${appId};`);
        resolve(true);
      });

      if (options.initialTimeout) {
        timeoutId = setTimeout(() => {
          PyInterop.log(`Game lifetime subscription expired. [DEBUG INFO] appId: ${appId};`);
          unregister();
          resolve(false);
        }, options.initialTimeout);
      }
    });
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
   * Registers a callback for screenshot notification events.
   * @param callback The callback to run.
   * @returns An Unregisterer for this hook.
   */
  registerForScreenshotNotification(callback: (data: ScreenshotNotification) => void): Unregisterer {
    return SteamClient.GameSessions.RegisterForScreenshotNotification((data: ScreenshotNotification) => {
      callback(data);
    });
  }

  /**
   * Registers a callback for deck sleep requested events.
   * @param callback The callback to run.
   * @returns An Unregisterer for this hook.
   */
  registerForSleepStart(callback: () => void): Unregisterer {
    return SteamClient.User.RegisterForPrepareForSystemSuspendProgress(() => {
      callback();
    });
  }

  /**
   * Registers a callback for deck shutdown requested events.
   * @param callback The callback to run.
   * @returns An Unregisterer for this hook.
   */
  registerForShutdownStart(callback: () => void): Unregisterer {
    return SteamClient.User.RegisterForShutdownStart(() => {
      callback();
    });
  }

  /**
   * Restarts the Steam client.
   */
  restartClient(): void {
    SteamClient.User.StartRestart();
  }
}