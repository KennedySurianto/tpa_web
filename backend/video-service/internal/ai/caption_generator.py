import sys
import json
from faster_whisper import WhisperModel
from googletrans import Translator

def main(video_path):
    model = WhisperModel("base", device="cpu", compute_type="int8")

    segments, _ = model.transcribe(video_path, beam_size=5)
    en_captions = []
    for segment in segments:
        en_captions.append(segment.text.strip())

    translator = Translator()
    id_captions = [translator.translate(text, src='en', dest='id').text for text in en_captions]

    print(json.dumps({
        "en": en_captions,
        "id": id_captions
    }))

if __name__ == "__main__":
    video_path = sys.argv[1]
    main(video_path)
