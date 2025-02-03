# Beatboxit - Search instrumental audio samples by beatboxing.
![image](https://github.com/user-attachments/assets/19289741-0adb-4a95-a905-a3a1f2b362dd)

## Python backend
Performs analysis of an input sound and similarity search among a set of curated set of CC0 instrumental samples.
The backend is currently down, but the functinalities can be reproduced either with the appropriate Pinecone and AWS credentials.

## Angular frontend
Deployed on https://beatboxit.vercel.app/. 
The user can either upload an audio sample or record a short clip. 
The resulting audio file is then matched against a database of copyright free audio samples. 
The top 5 results are displayed.
