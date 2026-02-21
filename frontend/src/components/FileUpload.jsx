import React, { useEffect, useState } from 'react';
import uploadService from '../services/uploadService';

const FileUpload = ({
  label,
  accept = 'image/*',
  onFileSelect,
  uploadOnSelect = false,
  onUploaded,
  disabled = false,
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = async (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    onFileSelect?.(selected);

    if (uploadOnSelect) {
      try {
        setLoading(true);
        const url = await uploadService.uploadImage(selected);
        onUploaded?.(url);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <label className='field'>
      {label && <span className='field-label'>{label}</span>}
      <input
        className='field-input'
        type='file'
        accept={accept}
        onChange={handleChange}
        disabled={disabled || loading}
      />
      {loading && <span className='field-hint'>?ang t?i l?n...</span>}
      {preview && (
        <div className='file-preview'>
          <img src={preview} alt='preview' />
        </div>
      )}
    </label>
  );
};

export default FileUpload;
