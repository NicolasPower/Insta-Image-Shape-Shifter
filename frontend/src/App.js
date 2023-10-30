import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "font-awesome/css/font-awesome.min.css";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoId, setPhotoId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSelectFile = (e) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0] instanceof Blob) {
      setFile(files[0]);
      setOriginalUrl(URL.createObjectURL(files[0]));
      setImageUrl("");
    } else {
      console.error("No valid file selected");
    }
  };

  const handleUpload = async () => {
    try {
      setProcessing(true);
      const data = new FormData();
      data.append("my_file", file);
      const uploadRes = await axios.post("http://localhost:6060/upload", data);
      setPhotoId(uploadRes.data.photoId);
    } catch (error) {
      alert(error.message);
      setProcessing(false);
    }
  };

  const checkImageStatus = async () => {
    try {
      const statusRes = await axios.get(
        `http://localhost:6060/status/${photoId}`
      );
      if (statusRes.data.status === "done") {
        setImageUrl(
          `https://katenics3.s3.ap-southeast-2.amazonaws.com/processed/${photoId}`
        );
        setProcessing(false);
      } else {
        setTimeout(checkImageStatus, 5000);
      }
    } catch (error) {
      console.error(error);
      setProcessing(false);
    }
  };

  function downloadImage(url) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  useEffect(() => {
    if (photoId) {
      checkImageStatus();
    }
  }, [photoId]);

  return (
    <div>
      <h1>Insta Story Shape Shifter</h1>
      <p>
        Upload any image and we will resize it to fit the 9:16 Instagram story
      </p>
      <div className="App container">
        <div className="row mt-4">
          {originalUrl || imageUrl ? (
            <>
              <div className="col-md-6">
                <div className="image-container">
                  {originalUrl && (
                    <img
                      src={originalUrl}
                      alt="Original Image"
                      className="img-fluid"
                    />
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="image-container">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Processed Image"
                      className="img-fluid"
                    />
                  ) : processing ? (
                    <div
                      className="d-flex justify-content-center align-items-center"
                      style={{ height: "300px" }}
                    >
                      <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="col-12 mt-4 image-placeholder">
              <FontAwesomeIcon icon={faCamera} size="3x" />
            </div>
          )}
        </div>

        <div className="container-class-name">
          <div className="buttons-container d-flex justify-content-center align-items-center">
            <label htmlFor="file" className="btn btn-secondary mr-2">
              {originalUrl || imageUrl ? "Reselect Image" : "Select Image"}
            </label>
            <input
              id="file"
              type="file"
              onChange={handleSelectFile}
              multiple={false}
              accept=".jpeg, .jpg"
              className="form-control d-none"
            />
            {file && (
              <button
                onClick={handleUpload}
                className={
                  processing ? "btn btn-success ml-2" : "btn btn-primary ml-2"
                }
                disabled={processing}
              >
                {processing ? "Resizing..." : "Resize Image"}
              </button>
            )}

            {imageUrl && (
              <button
                onClick={() => downloadImage(imageUrl)}
                className="btn btn-info ml-2"
              >
                Download Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
