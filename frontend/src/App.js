import "./App.css";
import UploadModal from "./components/Modal";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "font-awesome/css/font-awesome.min.css";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import JSZip from "jszip";

function App() {
  const [file, setFile] = useState([]);
  const [photoId, setPhotoId] = useState("");
  const [imageUrl, setImageUrl] = useState([]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("9:16 Instagram Story");
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef();
  const folderInputRef = useRef();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + file.length) % file.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % file.length);
  };

  const handleSingleFileSelect = (e) => {
    fileInputRef.current.click();
  };

  const handleFolderSelect = (e) => {
    folderInputRef.current.click();
  };

  const handleUploadClick = () => {
    setIsModalVisible(true);
  };

  const onFileChange = (e) => {
    handleSelectFile(e);
    setIsModalVisible(false);
  };

  const handleSelectFile = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = [];
      let hasInvalidFile = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type;

        if (!["image/jpeg", "image/png"].includes(fileType)) {
          console.error(
            `Invalid file type: ${file.name} is not a JPEG or PNG file`
          );
          hasInvalidFile = true;
          break;
        }

        const url = URL.createObjectURL(file);
        fileArray.push({ file, url });
      }

      if (hasInvalidFile) {
        setFile([]);
        setOriginalUrl("");
        setImageUrl("");
        alert("Invalid files found. Only JPEG and PNG files are allowed.");
      } else if (fileArray.length > 0) {
        setFile(fileArray);
        setOriginalUrl(fileArray[0].url);
        setImageUrl([]);
      } else {
        console.error("No valid files selected");
      }
    } else {
      console.error("No files selected");
    }
    e.target.value = null;
    fileInputRef.current.value = null;
    folderInputRef.current.value = null;
  };

  const handleUpload = async () => {
    try {
      setProcessing(true);
      setImageUrl("");

      const photoIds = []; // Array to store the photo IDs for each file

      for (const selectedFile of file) {
        // Assuming you have an array named "files" with the selected files
        const data = new FormData();
        data.append("my_file", selectedFile.file);
        data.append("format", selectedFormat);

        const uploadRes = await axios.post(
          "http://localhost:6060/upload",
          data
        );
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
      const updatedImageUrls = [...imageUrl]; // Copy the existing image URLs
      let completedImages = 0;

      for (let i = 0; i < photoId.length; i++) {
        const statusRes = await axios.get(
          `http://localhost:6060/status/${photoId[i]}`
        );

        if (statusRes.data.status === "done") {
          updatedImageUrls[
            i
          ] = `https://katenics3.s3.ap-southeast-2.amazonaws.com/processed/${photoId[i]}`;
          completedImages++;
        }
      }

      console.log(`Completed images: ${completedImages}`);

      if (completedImages === photoId.length) {
        console.log(updatedImageUrls);
        setProcessing(false);
        setImageUrl(updatedImageUrls);
      } else {
        setTimeout(checkImageStatus, 5000);
      }
    } catch (error) {
      console.error(error);
      setProcessing(false);
    }
  };

  function downloadImages(urls) {
    if (urls.length === 1) {
      // If there's only one image, download it as a JPEG
      const photoId = urls[0];
      axios
        .get(`http://localhost:6060/fetchImage/${photoId}`, {
          responseType: "blob",
        })
        .then((response) => {
          const blob = new Blob([response.data], { type: "image/jpeg" });
          const singleImageFile = URL.createObjectURL(blob);

          const anchor = document.createElement("a");
          anchor.href = singleImageFile;
          anchor.download = `resized_image.jpeg`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
        })
        .catch((error) => {
          console.error(
            `Error downloading image for photoId ${photoId}: ${error}`
          );
        });
    } else {
      // If there's more than one image, download them as a ZIP
      const zip = new JSZip();
      const downloadPromises = [];

      urls.forEach((photoId, index) => {
        const downloadPromise = axios
          .get(`http://localhost:6060/fetchImage/${photoId}`, {
            responseType: "blob",
          })
          .then((response) => {
            const blob = new Blob([response.data], { type: "image/jpeg" });
            const fileName = `image_${index}.jpeg`;
            zip.file(fileName, blob);
          })
          .catch((error) => {
            console.error(
              `Error downloading image for photoId ${photoId}: ${error}`
            );
          });

        downloadPromises.push(downloadPromise);
      });

      Promise.all(downloadPromises).then(() => {
        zip.generateAsync({ type: "blob" }).then((content) => {
          const zipFile = URL.createObjectURL(content);

          const anchor = document.createElement("a");
          anchor.href = zipFile;
          anchor.download = `resized_images.zip`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
        });
      });
    }
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
        <div className="row">
          {file.length > 0 && file[currentIndex] ? (
            <>
              <div className="col-md-6">
                <p
                  className="text-center img-title"
                  style={{ marginBottom: 8, marginTop: 10 }}
                >
                  Original Image {currentIndex + 1}
                </p>
                <div className="image-container">
                  <img
                    src={file[currentIndex].url}
                    alt={`Original-${currentIndex}`}
                    className="img-fluid"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="img-title d-flex justify-content-center align-items-center">
                  <p
                    className="mr-3 img-title"
                    style={{
                      marginBottom: 0,
                      marginRight: "10px",
                      marginTop: 10,
                    }}
                  >
                    Processed Image {currentIndex + 1}
                  </p>
                  {file && (
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      style={{ verticalAlign: "middle", marginTop: 10 }}
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
                  {imageUrl && imageUrl.length > currentIndex ? (
                    <img
                      src={imageUrl[currentIndex]}
                      alt={`Processed-${currentIndex}`}
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
              <div className="buttons-container col-12 d-flex justify-content-center mt-3">
                {file.length > 1 && (
                  <>
                    <div
                      onClick={handlePrev}
                      style={{
                        cursor: "pointer",
                        fontSize: "40px",
                        color: "#0f0522",
                      }}
                    >
                      &#11013;
                    </div>
                    <div
                      onClick={handleNext}
                      style={{
                        cursor: "pointer",
                        fontSize: "40px",
                        color: "#0f0522",
                      }}
                    >
                      &#11157;
                    </div>
                  </>
                )}
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
            {isModalVisible && (
              <UploadModal
                show={isModalVisible}
                onHide={() => setIsModalVisible(false)}
                handleSingleFileSelect={handleSingleFileSelect}
                handleFolderSelect={handleFolderSelect}
              />
            )}

            {/* Unified upload button */}
            <button
              onClick={handleUploadClick}
              className="btn btn-secondary mr-2"
            >
              {file.length > 0 ? "Reselect Image" : "Select Image"}
            </button>

            <input
              ref={fileInputRef}
              id="singleFile"
              type="file"
              onChange={onFileChange}
              accept=".jpeg, .jpg, .png"
              className="form-control d-none"
            />

            <input
              ref={folderInputRef}
              id="folder"
              type="file"
              directory=""
              webkitdirectory=""
              onChange={onFileChange}
              accept=".jpeg, .jpg, .png"
              multiple
              className="form-control d-none"
            />

            {file.length > 0 && (
              <button
                onClick={handleUpload}
                className={
                  processing ? "btn btn-success ml-2" : "btn btn-primary ml-2"
                }
                disabled={processing}
              >
                {processing
                  ? "Resizing..."
                  : `Resize ${file.length > 1 ? "Images" : "Image"}`}
              </button>
            )}
            {imageUrl && imageUrl.length > 0 && (
              <button
                onClick={() => downloadImages(photoId)}
                className="btn btn-info ml-2"
              >
                Download {imageUrl.length > 1 ? "Images" : "Image"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
