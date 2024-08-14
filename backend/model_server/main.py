import os
import shutil
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

import torch
import uvicorn
from fastapi import FastAPI
from transformers import logging as transformer_logging  # type:ignore

from danswer import __version__
from danswer.utils.logger import setup_logger
from model_server.custom_models import router as custom_models_router
from model_server.custom_models import warm_up_intent_model
from model_server.encoders import router as encoders_router
from model_server.management_endpoints import router as management_router
from shared_configs.configs import INDEXING_ONLY
from shared_configs.configs import MIN_THREADS_ML_MODELS
from shared_configs.configs import MODEL_SERVER_ALLOWED_HOST
from shared_configs.configs import MODEL_SERVER_PORT

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

HF_CACHE_PATH = Path("/root/.cache/huggingface/")
TEMP_HF_CACHE_PATH = Path("/root/.cache/temp_huggingface/")

transformer_logging.set_verbosity_error()

logger = setup_logger()


def _move_files_recursively(source: Path, dest: Path, overwrite: bool = False) -> None:
    """
    This moves the files from the temp huggingface cache to the huggingface cache

    We have to move each file individually because the directories might
    have the same name but not the same contents and we dont want to remove
    the files in the existing huggingface cache that don't exist in the temp
    huggingface cache.
    """
    for item in source.iterdir():
        target_path = dest / item.relative_to(source)
        if item.is_dir():
            _move_files_recursively(item, target_path, overwrite)
        else:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            if target_path.exists() and not overwrite:
                continue
            shutil.move(str(item), str(target_path))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    if torch.cuda.is_available():
        logger.info("GPU is available")
    else:
        logger.info("GPU is not available")

    if TEMP_HF_CACHE_PATH.is_dir():
        logger.info("Moving contents of temp_huggingface to huggingface cache.")
        _move_files_recursively(TEMP_HF_CACHE_PATH, HF_CACHE_PATH)
        shutil.rmtree(TEMP_HF_CACHE_PATH, ignore_errors=True)
        logger.info("Moved contents of temp_huggingface to huggingface cache.")

    torch.set_num_threads(max(MIN_THREADS_ML_MODELS, torch.get_num_threads()))
    logger.info(f"Torch Threads: {torch.get_num_threads()}")

    if not INDEXING_ONLY:
        warm_up_intent_model()
    else:
        logger.info("This model server should only run document indexing.")

    yield


def get_model_app() -> FastAPI:
    application = FastAPI(
        title="Danswer Model Server", version=__version__, lifespan=lifespan
    )

    application.include_router(management_router)
    application.include_router(encoders_router)
    application.include_router(custom_models_router)

    return application


app = get_model_app()


if __name__ == "__main__":
    logger.info(
        f"Starting Danswer Model Server on http://{MODEL_SERVER_ALLOWED_HOST}:{str(MODEL_SERVER_PORT)}/"
    )
    logger.info(f"Model Server Version: {__version__}")
    uvicorn.run(app, host=MODEL_SERVER_ALLOWED_HOST, port=MODEL_SERVER_PORT)
