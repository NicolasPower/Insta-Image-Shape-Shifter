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
  const [selectedFormat, setSelectedFormat] = useState("9:16 Instagram Story");

  // const handleSelectFile = (e) => {
  //   const files = e.target.files;
  //   if (files && files.length > 0 && files[0] instanceof Blob) {
  //     console.log(files)
  //     setFile(files[0]);
  //     setOriginalUrl(URL.createObjectURL(files[0]));
  //     setImageUrl("");
  //   } else {
  //     console.error("No valid file selected");
  //   }
  // };

  const handleSelectFile = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i] instanceof Blob) {
          const file = files[i];
          const url = URL.createObjectURL(file);
          fileArray.push({ file, url });
        }
      }
      if (fileArray.length > 0) {
        // Do something with the array of selected files
        console.log(fileArray);
        setFile(fileArray); // Assuming you have a state variable to store the selected files
        setOriginalUrl(URL.createObjectURL(files[0]));
        setImageUrl("");
      } else {
        console.error("No valid files selected");
      }
    } else {
      console.error("No files selected");
    }
  };

  const handleUpload = async () => {
    try {
      setProcessing(true);
      setImageUrl("");
      
      const photoIds = []; // Array to store the photo IDs for each file
      
      for (const selectedFile of file) { // Assuming you have an array named "files" with the selected files
        const data = new FormData();
        data.append("my_file", selectedFile.file);
        data.append("format", selectedFormat);
        
        const uploadRes = await axios.post("http://localhost:6060/upload", data);
        console.log(data)
        photoIds.push(uploadRes.data.photoId);
      }
      
      setPhotoId(photoIds); // Assuming you have a state variable to store the uploaded photo IDs
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
                <p
                  className="text-center img-title"
                  style={{ marginBottom: 8 }}
                >
                  Original Image
                </p>
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
                <div className="d-flex justify-content-center align-items-center">
                  <p
                    className="mr-3 img-title"
                    style={{ marginBottom: 0, marginRight: "10px" }}
                  >
                    Processed Image
                  </p>
                  {file && (
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      style={{ verticalAlign: "middle" }}
                    >
                      <option value="9:16 Instagram Story">
                        9:16 Instagram Story
                      </option>
                      <option value="1:1 Square">1:1 Square</option>
                      <option value="4:5 Portrait">4:5 Portrait</option>
                      <option value="16:9 Landscape">16:9 Landscape</option>
                    </select>
                  )}
                </div>
                <div className="image-container mt-2">
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
              <FontAwesomeIcon icon={faCamera} size="5x" />
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
              multiple={true}
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
