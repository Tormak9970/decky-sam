import decky_plugin
from py_backend.steamworks import STEAMWORKS

def log(txt):
  decky_plugin.logger.info(txt)

def warn(txt):
  decky_plugin.logger.warn(txt)

def error(txt):
  decky_plugin.logger.error(txt)

Initialized = False

class Plugin:
    async def logMessage(self, message, level):
      if level == 0:
        log(message)
      elif level == 1:
        warn(message)
      elif level == 2:
        error(message)

    async def updateAchievements(self, app_id: int, achievements) -> bool:
      #* create client
      client = STEAMWORKS(app_id)

      # TODO: make this track which achievements failed or how many
      status = True

      # TODO: sort into needs_setting and needs_clearing
      needs_setting: list[str] = []
      needs_clearing: list[str] = []

      #* set achievements that need setting
      for achievement_id in needs_setting:
        # TODO: figure out if this needs name or id, I assume it needs id
        success = client.UserStats.SetAchievement(achievement_id)

        if success:
          log(f"Set achievement {achievement_id} for {app_id}")
        else:
          error(f"Failed to set achievement {achievement_id} for {app_id}")
          status = False

      #* clear achievements that need clearing
      for achievement_id in needs_clearing:
        # TODO: figure out if this needs name or id, I assume it needs id
        success = client.UserStats.ClearAchievement(achievement_id)

        if success:
          log(f"Cleared achievement {achievement_id} for {app_id}")
        else:
          error(f"Cleared to set achievement {achievement_id} for {app_id}")
          status = False

      return status

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
      global Initialized
      if Initialized:
        return
      
      Initialized = True

      log("Initializing Decky SAM.")

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
      decky_plugin.logger.info("Unloading Decky SAM.")
      pass

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
      pass
