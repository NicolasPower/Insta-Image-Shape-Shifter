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
  const [photoId, setPhotoId] = useState(""); // Using photoId instead of imagePath
  const [imageUrl, setImageUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");

  const handleSelectFile = (e) => {
    setFile(e.target.files[0]);
    setOriginalUrl(URL.createObjectURL(e.target.files[0])); // Add this line
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      data.append("my_file", file);
      const uploadRes = await axios.post("http://localhost:6060/upload", data);
      setPhotoId(uploadRes.data.photoId);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
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
      } else {
        setTimeout(checkImageStatus, 5000); // Retry after 5 seconds if still pending
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (photoId) {
      checkImageStatus();
    }
  }, [photoId]);

  return (
    <div className="App container mt-5">
      <div className="row mt-4">
        <div className="col-md-6">
          {originalUrl && (
            <img src={originalUrl} alt="Original Image" className="img-fluid" />
          )}
        </div>
        <div className="col-md-6">
          {imageUrl && (
            <img src={imageUrl} alt="Processed Image" className="img-fluid" />
          )}
        </div>
      </div>

      {!originalUrl && !imageUrl && (
        <div className="mt-4 image-placeholder">
          <FontAwesomeIcon icon={faCamera} size="3x" />
        </div>
      )}

      <div className="mb-3 d-flex justify-content-end mt-2">
        <label htmlFor="file" className="btn btn-secondary mr-2">
          {originalUrl || imageUrl ? "Reselect Image" : "Select Image"}
        </label>
        <input
          id="file"
          type="file"
          onChange={handleSelectFile}
          multiple={false}
          className="form-control d-none"
        />
        {file && (
          <button
            onClick={handleUpload}
            className={
              loading ? "btn btn-success ml-2" : "btn btn-primary ml-2"
            }
          >
            {loading ? "Resizing..." : "Resize Image"}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
