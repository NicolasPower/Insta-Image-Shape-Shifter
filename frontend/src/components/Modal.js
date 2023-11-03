import React from "react";
import { Modal, Button } from "react-bootstrap";

const UploadModal = ({
  show,
  onHide,
  handleSingleFileSelect,
  handleFolderSelect,
}) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton style={{ borderBottom: "none" }}>
        <Modal.Title>Choose Upload Option</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <Button variant="primary" onClick={handleSingleFileSelect}>
            Upload Single Image
          </Button>
          <Button variant="success" onClick={handleFolderSelect}>
            Upload Image Folder
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default UploadModal;
