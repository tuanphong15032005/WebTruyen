import React, { useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import storyService from '../../services/storyService';
import useNotify from '../../hooks/useNotify';

const CreateVolume = ({ storyId, onCreated, onCancel }) => {
  const { notify } = useNotify();
  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Tiêu đề tập là bắt buộc';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      setLoading(true);
      const payload = {
        title: title.trim(),
      };
      const response = await storyService.createVolume(storyId, payload);
      const volumeId = response?.id || response?.volumeId;
      notify('Tạo volume thành công', 'success');
      setTitle('');
      onCreated?.(volumeId || response);
    } catch (error) {
      console.error('createVolume error', error);
      notify('Không thể tạo volume. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className='card form story-detail__volume-form'
      onSubmit={handleSubmit}
    >
      <h3>Tạo tập mới</h3>
      <Input
        label='Tên tập'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder='Nhập tên tập'
      />
      <div className='form-actions'>
        <Button type='submit' loading={loading}>
          Lưu tập
        </Button>
        {onCancel && (
          <Button type='button' variant='ghost' onClick={onCancel}>
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
};

export default CreateVolume;
