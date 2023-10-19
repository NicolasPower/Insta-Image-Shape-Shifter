import "./index.css";
import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState({});
  const [modifiedImageUrl, setModifiedImageUrl] = useState("");
  const [imagePath, setImagePath] = useState(""); // Separate image path state
  const [effectWord, setEffectWord] = useState(""); // Separate word state

  const handleSelectFile = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      data.append("my_file", file);
      const uploadRes = await axios.post("http://localhost:6060/upload", data);
      setRes(uploadRes.data);
      setImagePath(uploadRes.data.public_id); // Set the image path
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleApplyEffect = async () => {
    if (imagePath && effectWord) {
      try {
        const effectResponse = await axios.get(
          `http://localhost:6060/generateImageWithEffect?imagePath=${imagePath}&word=${effectWord}`
        );
        setModifiedImageUrl(effectResponse.data.imageUrl);
      } catch (error) {
        console.error(error);
      }
    }
  }

  useEffect(() => {
    // You can use this effect for other purposes if needed
  }, [imagePath]);

  return (
    <div className="App">
      <label htmlFor="file" className="btn-grey">
        {" "}
        Select file
      </label>
      {file && <center> {file.name}</center>}
      <input
        id="file"
        type="file"
        onChange={handleSelectFile}
        multiple={false}
      />
      <input
        type="text"
        placeholder="Enter Effect Word"
        value={effectWord}
        onChange={(e) => setEffectWord(e.target.value)}
      />
      <code>
        {Object.keys(res).length > 0
          ? Object.keys(res).map((key) => (
              <p className="output-item" key={key}>
                <span>{key}:</span>
                <span>
                  {typeof res[key] === "object" ? "object" : res[key]}
                </span>
              </p>
            ))
          : null}
      </code>
      {file && (
        <>
          <button onClick={handleUpload} className="btn-green">
            {loading ? "Uploading..." : "Upload to Cloudinary"}
          </button>
          <button onClick={handleApplyEffect} className="btn-blue">
            Apply Effect
          </button>
        </>
      )}
      {modifiedImageUrl && (
        <img src={modifiedImageUrl} alt="Modified Image" />
      )}
    </div>
  );
}

export default App;
