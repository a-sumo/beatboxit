import pinecone
import boto3
import librosa
import os
import glob
import numpy as np
from dotenv import load_dotenv

load_dotenv()

# Initialize AWS S3 and Pinecone
s3_client = boto3.client('s3',
                         aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
                         aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"))
BUCKET_NAME = 'hyperreal-audio-sample-data-1'
pinecone.init(api_key=os.environ.get(
    "PINECONE_API_KEY"), environment="gcp-starter")
index = pinecone.Index('audio-samples')


def upload_file_to_s3(file_path, is_init=False):
    file_name = os.path.basename(file_path)
    if is_init == True:
        s3_client.upload_file(file_path, BUCKET_NAME, file_name)

    return f'https://{BUCKET_NAME}.s3.amazonaws.com/{file_name}'


def extract_features(file_path):
    y, sr = librosa.load(file_path)
    mfccs = librosa.feature.mfcc(y=y, sr=sr)
    return mfccs.mean(axis=1).tolist()


def process_and_store_files(directory):
    for file_path in glob.glob(os.path.join(directory, '**/*.wav'), recursive=True):
        # Extract MFCCs
        mfccs = extract_features(file_path)
        print(f'Extracted features for {file_path}')
        print(len(mfccs))
        vector = np.array(mfccs)
        # Upload to S3
        s3_url = upload_file_to_s3(file_path)

        # Upload vector and metadata to Pinecone
        vector_id = os.path.basename(file_path).split('.')[0]
        upsert_response = index.upsert(vectors=[
            {"id": vector_id,
             "values": vector,
             "metadata":
             {"filename": os.path.basename(file_path),
              "s3_url": s3_url}
             }])
        print(upsert_response)


if __name__ == "__main__":
    AUDIO_FILES_DIR = 'libre-sample-pack/drums/one shot'
    process_and_store_files(AUDIO_FILES_DIR)
