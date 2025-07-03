import sys
import os
import json
import whisper
import subprocess
from googletrans import Translator
import contextlib
import io

import warnings
warnings.filterwarnings("ignore")

import os
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

def preprocess_video(video_path: str, output_wav: str = "processed.wav"):
    command = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-ac", "1",
        "-ar", "16000",
        "-vn",
        "-f", "wav", output_wav
    ]
    subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_wav

def transcribe_audio(audio_path: str):
    model = whisper.load_model("base")
    f = io.StringIO()
    with contextlib.redirect_stdout(f), contextlib.redirect_stderr(f):
        result = model.transcribe(audio_path, verbose=False)
    return result["segments"]

def translate_segments(segments, dest_lang, translator):
    translated = []
    for seg in segments:
        translated_text = translator.translate(seg["text"], src="en", dest=dest_lang).text
        translated.append({
            "start": seg["start"],
            "end": seg["end"],
            "text": translated_text
        })
    return translated

def main(video_path: str):
    audio_path = preprocess_video(video_path)
    segments = transcribe_audio(audio_path)

    en_output = [
        {
            "start": seg["start"],
            "end": seg["end"],
            "text": seg["text"].strip()
        }
        for seg in segments
    ]

    translator = Translator()
    id_output = translate_segments(en_output, "id", translator)

    final_output = {
        "en": en_output,
        "id": id_output,
    }

    print(json.dumps(final_output, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    video_path = sys.argv[1]
    main(video_path)
