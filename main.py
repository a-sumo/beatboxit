from flask import Flask, request, jsonify
from flask import Response
from flask_cors import CORS, cross_origin
import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
import urllib.parse
import librosa
import pinecone

# get variable
# Initialize AWS S3 and Pinecone
s3_client = boto3.client('s3')
BUCKET_NAME = 'hyperreal-audio-sample-data-1'
pinecone.init(api_key=os.environ.get(
    "PINECONE_API_KEY"), environment="gcp-starter")
index = pinecone.Index('audio-samples')

# Initialize Flask
app = Flask(__name__, static_folder='static')
CORS(app)

@app.route('/search-audio', methods=['POST'])
@cross_origin()
def analyze_audio():
    # File upload and feature extraction
    file = request.files['file']
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Extract features and query similar vectors
    query_vector = extract_features(file.stream)
    query_results = query_similar_vectors(query_vector, top_k=5)

    # Prepare response data with pre-signed URLs
    response_data = []
    for match in query_results:
        s3_uri = match['metadata']['s3_url']  # Adjust as per your metadata structure
        parsed_uri = urllib.parse.urlparse(s3_uri)
        bucket_name = parsed_uri.netloc.split('.')[0] 
        file_key = parsed_uri.path.lstrip('/')
        presigned_url = generate_presigned_url(bucket_name, file_key)
        if presigned_url:
            response_data.append({
                "id": match['id'],
                "file_url": presigned_url
            })
        else:
            response_data.append({
                "id": match['id'],
                "error": "Unable to generate file URL"
            })

    return jsonify(response_data), 200

# test route
@app.route('/test', methods=['GET'])
@cross_origin()
def test():
    return jsonify({"message": "Hello World"}), 200


def stream_from_s3(bucket_name, file_name):
    try:
        obj = s3_client.get_object(Bucket=bucket_name, Key=file_name)
        return Response(obj['Body'].read(), mimetype='audio/wav')
    except NoCredentialsError:
        return jsonify({"error": "Credentials not available"}), 401
    except ClientError as e:
        return jsonify({"error": str(e)}), 500

def generate_presigned_url(bucket_name, object_name, expiration=3600):
    """Generate a presigned URL to share an S3 object.

    :param bucket_name: string
    :param object_name: string
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Presigned URL as string or None if error occurred
    """
    try:
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket_name, 'Key': object_name},
                                                    ExpiresIn=expiration)
    except ClientError as e:
        # Log the error and provide a more specific message
        print(f"Couldn't generate presigned URL for {bucket_name}/{object_name}. Here's why: {e}")
        return None

    return response

def extract_features(file_stream):
    # Logic to extract MFCCs from the file
    y, sr = librosa.load(file_stream, sr=None)
    mfccs = librosa.feature.mfcc(y=y, sr=sr)
    return mfccs.mean(axis=1)[:20].tolist()


def query_similar_vectors(query_vector, top_k=5):
    query_results = index.query(
        vector=query_vector, top_k=top_k, include_metadata=True)
    # print(query_results)
    return query_results['matches']


if __name__ == '__main__':
    app.run(debug=True)
