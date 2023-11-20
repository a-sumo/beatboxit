import os
import subprocess
import sys

def clone_repository(repo_url, destination):
    try:
        subprocess.run(["git", "clone", repo_url, destination], check=True)
        print(f"Repository cloned into {destination}")
    except subprocess.CalledProcessError:
        print("Failed to clone repository. Please make sure Git is installed.")
        sys.exit(1)

if __name__ == "__main__":
    REPO_URL = "https://github.com/TheSmallTeaBoi/the-libre-sample-pack.git"
    DESTINATION = "libre-sample-pack"

    clone_repository(REPO_URL, DESTINATION)
