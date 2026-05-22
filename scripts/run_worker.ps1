$ErrorActionPreference = "Stop"

python -m celery -A app.tasks.celery_app worker -l info -Q video_generation

