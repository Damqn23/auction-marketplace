from django.apps import AppConfig


class AuctionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'auctions'

    def ready(self):
        """
        Called when Django starts. Start the auction closing scheduler here.
        """
        import os
        # Only start scheduler in main process (not in runserver reloader or management commands)
        if os.environ.get("RUN_MAIN") != "true" and os.environ.get("SCHEDULER_ENABLED") != "false":
            from auctions.scheduler import start_scheduler
            start_scheduler()
