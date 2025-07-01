import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Upload, Video, ImageIcon, Settings, Check } from "lucide-react"

// Assuming these imports exist in your project
import type { CreateVideoRequest, CreateVideoResponse } from "../../api/gen/video"
import { useAuth } from "../../utils/AuthProvider"
import { videoClient } from "../../api/grpc/videoClient"

const UploadVideoPage: React.FC = () => {
  const { user, getAuthMetadata } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [description, setDescription] = useState("")
  const [privacy, setPrivacy] = useState("public")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("")
  const [allowComments, setAllowComments] = useState(true)
  const [allowDuet, setAllowDuet] = useState(true)
  const [allowStitch, setAllowStitch] = useState(true)
  const [videoURL, setVideoURL] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  const previewVideoURL = useMemo(() => {
    if (!file) return ""
    const url = URL.createObjectURL(file)
    return url
  }, [file])

  useEffect(() => {
    return () => {
      if (previewVideoURL) {
        URL.revokeObjectURL(previewVideoURL)
      }
    }
  }, [previewVideoURL])

  const handleUpload = async () => {
    if (!file || !user?.id) return

    setLoading(true)
    try {
      let duration = 0
      if (videoRef.current && videoRef.current.duration) {
        duration = Math.floor(videoRef.current.duration)
      }

      const videoArrayBuffer = await file.arrayBuffer()
      const thumbnailArrayBuffer = thumbnailFile ? await thumbnailFile.arrayBuffer() : null

      const request: CreateVideoRequest = {
        userId: Number(user?.id),
        caption,
        description,
        duration,
        privacy,
        allowComments,
        allowDuet,
        allowStitch,
        videoData: new Uint8Array(videoArrayBuffer),
        contentType: "video/mp4",
        videoUrl: "",
        thumbnail: thumbnailArrayBuffer ? new Uint8Array(thumbnailArrayBuffer) : undefined,
      }

      const response: CreateVideoResponse = await videoClient.CreateVideo(request, getAuthMetadata())

      const url = response.video?.videoUrl ?? ""
      if (url) {
        setVideoURL(url)
      }
    } catch (err: any) {
      if (err.message?.includes("upstream request timeout") || err.code === "DEADLINE_EXCEEDED") {
        console.log("⏳ Video is still being processed. Please wait a few moments and check your profile.")
      } else {
        alert("Upload failed: " + (err.message || "Unknown error"))
        console.error("Upload failed:", err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-container">
      <div className="upload-content">
        <div className="upload-header">
          <Video className="header-icon" />
          <h1>Upload Video</h1>
          <p>Share your creativity with the world</p>
        </div>

        <div className="upload-form">
          {/* Video Upload Section */}
          <div className="form-section">
            <div className="section-header">
              <Upload size={20} />
              <h3>Video File</h3>
            </div>

            <div className="file-upload-area">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const selected = e.target.files?.[0] || null
                  setFile(selected)
                  setVideoURL("")
                }}
                className="file-input"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="file-upload-label">
                {file ? (
                  <div className="file-selected">
                    <Check size={24} />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <Upload size={32} />
                    <span>Click to select video file</span>
                    <small>MP4, AVI, MOV up to 100MB</small>
                  </div>
                )}
              </label>
            </div>

            {/* Video Preview */}
            {file && (
              <div className="video-preview">
                <video
                  ref={videoRef}
                  src={previewVideoURL}
                  controls
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const duration = (e.target as HTMLVideoElement).duration
                    console.log("Video duration:", duration)
                  }}
                />
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="caption">Caption</label>
              <input
                id="caption"
                type="text"
                placeholder="Enter video caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="privacy">Privacy</label>
              <select id="privacy" value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="form-select">
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Enter video description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="form-textarea"
            />
          </div>

          {/* Thumbnail Section */}
          <div className="form-section">
            <div className="section-header">
              <ImageIcon size={20} />
              <h3>Thumbnail (Optional)</h3>
            </div>

            <div className="thumbnail-upload">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const image = e.target.files?.[0] || null
                  setThumbnailFile(image)
                  setThumbnailPreview(image ? URL.createObjectURL(image) : "")
                }}
                className="file-input"
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload" className="thumbnail-label">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview || "/placeholder.svg"} alt="Thumbnail preview" />
                ) : (
                  <div className="thumbnail-placeholder">
                    <ImageIcon size={24} />
                    <span>Add thumbnail</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Permissions */}
          <div className="form-section">
            <div className="section-header">
              <Settings size={20} />
              <h3>Video Permissions</h3>
            </div>

            <div className="permissions-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Allow Comments
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowDuet}
                  onChange={(e) => setAllowDuet(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Allow Duet
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowStitch}
                  onChange={(e) => setAllowStitch(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Allow Stitch
              </label>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`upload-button ${!file || loading ? "disabled" : ""}`}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload Video
              </>
            )}
          </button>

          {/* Success Section */}
          {videoURL && (
            <div className="success-section">
              <div className="success-header">
                <Check size={24} />
                <h3>Upload Successful!</h3>
              </div>
              <div className="success-video">
                <video src={videoURL} controls />
              </div>
              <div className="success-url">
                <p>Video URL:</p>
                <code>{videoURL}</code>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
                .upload-container {
                    height: 100vh;
                    overflow-y: auto;
                    overflow-x: hidden;
                    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
                    color: #ffffff;
                    padding: 2rem 1rem;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .upload-content {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .upload-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .header-icon {
                    color: #3b82f6;
                    margin-bottom: 1rem;
                }

                .upload-header h1 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin: 0 0 0.5rem 0;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .upload-header p {
                    color: #9ca3af;
                    font-size: 1.1rem;
                    margin: 0;
                }

                .upload-form {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    padding: 2rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
                }

                .form-section {
                    margin-bottom: 2rem;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    color: #3b82f6;
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                    font-weight: 600;
                }

                .file-upload-area {
                    position: relative;
                }

                .file-input {
                    position: absolute;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }

                .file-upload-label {
                    display: block;
                    padding: 2rem;
                    border: 2px dashed rgba(59, 130, 246, 0.5);
                    border-radius: 0.75rem;
                    background: rgba(59, 130, 246, 0.05);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                .file-upload-label:hover {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                }

                .file-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    color: #9ca3af;
                }

                .file-placeholder span {
                    font-size: 1.1rem;
                    font-weight: 500;
                }

                .file-placeholder small {
                    font-size: 0.9rem;
                    color: #6b7280;
                }

                .file-selected {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #10b981;
                    font-weight: 500;
                }

                .video-preview {
                    margin-top: 1rem;
                    border-radius: 0.75rem;
                    overflow: hidden;
                    background: #000;
                }

                .video-preview video {
                    width: 100%;
                    max-height: 400px;
                    object-fit: contain;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                @media (max-width: 768px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-group label {
                    font-weight: 600;
                    color: #e5e7eb;
                    font-size: 0.9rem;
                }

                .form-input,
                .form-select,
                .form-textarea {
                    padding: 0.75rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    color: #ffffff;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .form-input:focus,
                .form-select:focus,
                .form-textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .form-textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                .thumbnail-upload {
                    position: relative;
                }

                .thumbnail-label {
                    display: block;
                    width: 150px;
                    height: 100px;
                    border: 2px dashed rgba(255, 255, 255, 0.3);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .thumbnail-label:hover {
                    border-color: #3b82f6;
                }

                .thumbnail-label img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .thumbnail-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    gap: 0.5rem;
                    color: #9ca3af;
                    font-size: 0.9rem;
                }

                .permissions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }

                .checkbox-label:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .checkbox-input {
                    display: none;
                }

                .checkbox-custom {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .checkbox-input:checked + .checkbox-custom {
                    background: #3b82f6;
                    border-color: #3b82f6;
                }

                .checkbox-input:checked + .checkbox-custom::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }

                .upload-button {
                    width: 100%;
                    padding: 1rem 2rem;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border: none;
                    border-radius: 0.75rem;
                    color: white;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .upload-button:hover:not(.disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                }

                .upload-button.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .success-section {
                    margin-top: 2rem;
                    padding: 2rem;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 0.75rem;
                }

                .success-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    color: #10b981;
                }

                .success-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }

                .success-video {
                    margin-bottom: 1rem;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    background: #000;
                }

                .success-video video {
                    width: 100%;
                    max-height: 300px;
                }

                .success-url {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 1rem;
                    border-radius: 0.5rem;
                }

                .success-url p {
                    margin: 0 0 0.5rem 0;
                    font-weight: 600;
                    color: #10b981;
                }

                .success-url code {
                    display: block;
                    word-break: break-all;
                    color: #9ca3af;
                    font-size: 0.9rem;
                    background: rgba(0, 0, 0, 0.5);
                    padding: 0.5rem;
                    border-radius: 0.25rem;
                }

                @media (max-width: 640px) {
                    .upload-container {
                        padding: 1rem 0.5rem;
                    }

                    .upload-header h1 {
                        font-size: 2rem;
                    }

                    .upload-form {
                        padding: 1.5rem;
                    }

                    .permissions-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
    </div>
  )
}

export default UploadVideoPage
