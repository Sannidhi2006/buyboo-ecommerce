const fs = require('fs');
const path = require('path');

/**
 * StorageService
 *
 * Abstracted storage provider interface.
 * Currently uses local filesystem storage (backend/uploads/).
 * Can be swapped to S3, Cloudinary, or any object storage by updating
 * this service layer without altering product or category business logic.
 */
class LocalStorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '..', 'uploads');
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Generates public URL for an uploaded local file
   * @param {string} filename - Filename on disk
   * @returns {string} Publicly accessible relative URL (e.g. /uploads/filename.webp)
   */
  getFileUrl(filename) {
    if (!filename) return null;
    return `/uploads/${filename}`;
  }

  /**
   * Safely deletes a file from the uploads directory.
   * Prevents directory traversal attacks by resolving and ensuring the target
   * resides strictly inside the uploadDir.
   * Silently ignores external web URLs (e.g. Unsplash seed images) or nonexistent files.
   *
   * @param {string} fileUrlOrPath - URL or path like '/uploads/prod-123.jpg'
   * @returns {boolean} True if deleted, false otherwise
   */
  deleteFile(fileUrlOrPath) {
    if (!fileUrlOrPath) return false;

    // Do not attempt to delete external URLs
    if (fileUrlOrPath.startsWith('http://') || fileUrlOrPath.startsWith('https://')) {
      return false;
    }

    try {
      // Extract the filename portion
      const filename = path.basename(fileUrlOrPath);
      const safePath = path.join(this.uploadDir, filename);

      // Security check: Ensure the resolved path is strictly inside uploadDir
      if (!safePath.startsWith(this.uploadDir)) {
        console.warn(`[Security Warning] Attempted path traversal blocked: ${fileUrlOrPath}`);
        return false;
      }

      if (fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
        return true;
      }
    } catch (err) {
      console.error(`[StorageService] Error deleting file ${fileUrlOrPath}:`, err.message);
    }
    return false;
  }
}

// Export singleton instance
module.exports = new LocalStorageService();
