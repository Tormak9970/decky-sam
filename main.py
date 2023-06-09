import decky_plugin

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
